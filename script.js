const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const resetButton = document.getElementById('reset');
const nextButton = document.getElementById('nextLevel');
const prevButton = document.getElementById('prevLevel');

const TILE_SIZE = 64;
const TILE_PADDING = 4;
const LEVELS = [
  [
    '  #####  ',
    '  #   #  ',
    '  #$  #  ',
    '###  $## ',
    '#  $ $ # ',
    '#  . . # ',
    '### @  # ',
    '  #####  '
  ],
  [
    '   #####   ',
    '   #   #   ',
    '   #$  #   ',
    ' ###  $##  ',
    ' #  $ $ #  ',
    '## # . . # ',
    '#  # @  ## ',
    '#  #####  ',
    '########   '
  ],
  [
    '    ####    ',
    '    #  #####',
    '    #     @#',
    '    # $.   #',
    '  ###  $ ###',
    '  #   $$  .#',
    '  # . . ### ',
    '  ########  '
  ],
  [
    '  #######   ',
    '  #  .  #   ',
    '  #  $  #   ',
    '### ##  ####',
    '#  $   $   #',
    '#  ##$## @ #',
    '#   . .    #',
    '############'
  ]
];

const TILE = {
  wall: '#',
  box: '$',
  player: '@',
  goal: '.',
  floor: ' ',
  boxOnGoal: '*',
  playerOnGoal: '+'
};

let currentLevel = 0;
let map = [];
let player = { x: 0, y: 0 };
let goals = new Set();

function loadLevel(index) {
  currentLevel = Math.max(0, Math.min(LEVELS.length - 1, index));
  const raw = LEVELS[currentLevel];

  map = raw.map(row => row.split(''));
  goals.clear();

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const tile = map[y][x];
      if (tile === TILE.player || tile === TILE.playerOnGoal) {
        player = { x, y };
      }
      if (tile === TILE.goal || tile === TILE.playerOnGoal || tile === TILE.boxOnGoal) {
        goals.add(`${x},${y}`);
      }
    }
  }

  resizeCanvas();
  render();
  updateStatus();
}

function resizeCanvas() {
  const rows = map.length;
  const cols = Math.max(...map.map(r => r.length));
  canvas.width = cols * TILE_SIZE;
  canvas.height = rows * TILE_SIZE;
}

function drawTile(x, y, color, radius = 8) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(
    x * TILE_SIZE + TILE_PADDING,
    y * TILE_SIZE + TILE_PADDING,
    TILE_SIZE - TILE_PADDING * 2,
    TILE_SIZE - TILE_PADDING * 2,
    radius
  );
  ctx.fill();
}

function isWall(x, y) {
  return map[y]?.[x] === TILE.wall;
}

function isBox(x, y) {
  return map[y]?.[x] === TILE.box || map[y]?.[x] === TILE.boxOnGoal;
}

function isGoal(x, y) {
  return goals.has(`${x},${y}`);
}

function getTile(x, y) {
  return map[y]?.[x] ?? TILE.floor;
}

function setTile(x, y, value) {
  if (!map[y] || x < 0 || x >= map[y].length) return;
  map[y][x] = value;
}

function move(dx, dy) {
  const targetX = player.x + dx;
  const targetY = player.y + dy;
  const nextTile = getTile(targetX, targetY);

  if (nextTile === TILE.wall) return;

  if (isBox(targetX, targetY)) {
    const boxTargetX = targetX + dx;
    const boxTargetY = targetY + dy;
    const boxTargetTile = getTile(boxTargetX, boxTargetY);

    if (isWall(boxTargetX, boxTargetY) || isBox(boxTargetX, boxTargetY)) return;

    moveBox(targetX, targetY, boxTargetX, boxTargetY);
  }

  movePlayer(targetX, targetY);
  render();
  checkLevelComplete();
}

function movePlayer(targetX, targetY) {
  const currentTile = getTile(player.x, player.y);
  setTile(player.x, player.y, isGoal(player.x, player.y) ? TILE.goal : TILE.floor);
  const targetGoal = isGoal(targetX, targetY);
  setTile(targetX, targetY, targetGoal ? TILE.playerOnGoal : TILE.player);
  player.x = targetX;
  player.y = targetY;
}

function moveBox(fromX, fromY, toX, toY) {
  const movingOnGoal = isGoal(fromX, fromY);
  setTile(fromX, fromY, movingOnGoal ? TILE.goal : TILE.floor);
  const destinationOnGoal = isGoal(toX, toY);
  setTile(toX, toY, destinationOnGoal ? TILE.boxOnGoal : TILE.box);
}

function checkLevelComplete() {
  const completed = [...goals].every(key => {
    const [x, y] = key.split(',').map(Number);
    return map[y]?.[x] === TILE.boxOnGoal;
  });

  if (completed) {
    statusEl.textContent = `Level ${currentLevel + 1} complete! Press Next Level.`;
  }
}

function updateStatus() {
  statusEl.textContent = `Level ${currentLevel + 1} / ${LEVELS.length}`;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const tile = map[y][x];
      const isCurrentGoal = isGoal(x, y);
      const floorColor = isCurrentGoal ? '#3f3728' : '#222732';
      drawTile(x, y, floorColor, 0);

      if (tile === TILE.wall) {
        drawTile(x, y, '#4a5568', 12);
      }

      if (tile === TILE.goal && !isBox(x, y) && ![TILE.playerOnGoal].includes(tile)) {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          TILE_SIZE * 0.16,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      if (isBox(x, y)) {
        drawTile(x, y, '#d88f00', 12);
        ctx.strokeStyle = '#b26f00';
        ctx.lineWidth = 3;
        ctx.strokeRect(
          x * TILE_SIZE + 18,
          y * TILE_SIZE + 18,
          TILE_SIZE - 36,
          TILE_SIZE - 36
        );
      }

      if (tile === TILE.player || tile === TILE.playerOnGoal) {
        ctx.fillStyle = '#f6f7fb';
        ctx.beginPath();
        ctx.arc(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2 - 6,
          TILE_SIZE * 0.18,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.fillStyle = '#f8f9ff';
        ctx.beginPath();
        ctx.roundRect(
          x * TILE_SIZE + TILE_SIZE * 0.28,
          y * TILE_SIZE + TILE_SIZE * 0.48,
          TILE_SIZE * 0.44,
          TILE_SIZE * 0.26,
          6
        );
        ctx.fill();
      }
    }
  }
}

function handleKey(event) {
  const key = event.key.toLowerCase();
  const directions = {
    arrowup: [0, -1],
    arrowdown: [0, 1],
    arrowleft: [-1, 0],
    arrowright: [1, 0],
    w: [0, -1],
    s: [0, 1],
    a: [-1, 0],
    d: [1, 0]
  };
  const direction = directions[key];

  if (!direction) return;
  event.preventDefault();
  move(...direction);
}

function restartLevel() {
  loadLevel(currentLevel);
}

function nextLevel() {
  loadLevel((currentLevel + 1) % LEVELS.length);
}

function previousLevel() {
  loadLevel((currentLevel - 1 + LEVELS.length) % LEVELS.length);
}

window.addEventListener('keydown', handleKey);
resetButton.addEventListener('click', restartLevel);
nextButton.addEventListener('click', nextLevel);
prevButton.addEventListener('click', previousLevel);

loadLevel(0);
