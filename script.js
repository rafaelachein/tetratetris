const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");

context.scale(20, 20);

const arena = createMatrix(12, 20);

const colors = [
  null,
  "#ff0d72",
  "#0dc2ff",
  "#0dff72",
  "#f538ff",
  "#ff8e0d",
  "#ffe138",
  "#3877ff"
];

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0
};

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameStarted = false;

let startTime = 0;
let elapsedTime = 0;
let level = 1;

let downHoldInterval = null;

const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const levelElement = document.getElementById("level");
const startScreen = document.getElementById("start-screen");

const upButton = document.getElementById("up-button");
const leftButton = document.getElementById("left-button");
const downButton = document.getElementById("down-button");
const rightButton = document.getElementById("right-button");

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  if (type === "T") {
    return [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ];
  }

  if (type === "O") {
    return [
      [2, 2],
      [2, 2]
    ];
  }

  if (type === "L") {
    return [
      [0, 3, 0],
      [0, 3, 0],
      [0, 3, 3]
    ];
  }

  if (type === "J") {
    return [
      [0, 4, 0],
      [0, 4, 0],
      [4, 4, 0]
    ];
  }

  if (type === "I") {
    return [
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0]
    ];
  }

  if (type === "S") {
    return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0]
    ];
  }

  if (type === "Z") {
    return [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0]
    ];
  }
}

function collide(arena, player) {
  const matrix = player.matrix;
  const pos = player.pos;

  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < matrix[y].length; ++x) {
      if (
        matrix[y][x] !== 0 &&
        (arena[y + pos.y] && arena[y + pos.y][x + pos.x]) !== 0
      ) {
        return true;
      }
    }
  }

  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function arenaSweep() {
  let rowCount = 1;

  outer: for (let y = arena.length - 1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }

    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;

    player.score += rowCount * 10;
    rowCount *= 2;

    updateScore();
    updateLevel();
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function startGame() {
  if (!gameStarted) {
    gameStarted = true;
    startScreen.style.display = "none";
    dropCounter = 0;
    lastTime = performance.now();
    startTime = performance.now();
  }
}

function playerDrop() {
  if (!gameStarted) return;

  player.pos.y++;

  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
  }

  dropCounter = 0;
}

function playerMove(dir) {
  if (!gameStarted) return;

  player.pos.x += dir;

  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerReset() {
  const pieces = "TJLOSZI";
  player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
  player.pos.y = 0;
  player.pos.x =
    Math.floor(arena[0].length / 2) -
    Math.floor(player.matrix[0].length / 2);

  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    level = 1;
    dropInterval = 1000;
    startTime = performance.now();

    updateScore();
    updateLevel();
  }
}

function updateScore() {
  scoreElement.textContent = "Score: " + player.score;
}

function updateLevel() {
  level = Math.floor(player.score / 100) + 1;
  levelElement.textContent = "Level: " + level;

  dropInterval = Math.max(150, 1000 - (level - 1) * 100);
}

function playerRotate(dir) {
  if (!gameStarted) return;

  const pos = player.pos.x;
  let offset = 1;

  rotate(player.matrix, dir);

  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));

    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }

  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function update(time = 0) {
  if (gameStarted) {
    const deltaTime = time - lastTime;
    lastTime = time;

    elapsedTime = Math.floor((time - startTime) / 1000);

    const hours = String(Math.floor(elapsedTime / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, "0");
    const seconds = String(elapsedTime % 60).padStart(2, "0");

    timerElement.textContent = `Time: ${hours}:${minutes}:${seconds}`;

    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
      playerDrop();
    }
  }

  draw();
  requestAnimationFrame(update);
}

function pressVisual(button) {
  button.classList.add("pressed");
}

function releaseVisual(button) {
  button.classList.remove("pressed");
}

function tapButton(button, action) {
  startGame();
  pressVisual(button);
  action();

  setTimeout(() => {
    releaseVisual(button);
  }, 120);
}

function startDownHold() {
  startGame();
  pressVisual(downButton);
  playerDrop();

  if (downHoldInterval) return;

  downHoldInterval = setInterval(() => {
    playerDrop();
  }, 70);
}

function stopDownHold() {
  releaseVisual(downButton);

  if (downHoldInterval) {
    clearInterval(downHoldInterval);
    downHoldInterval = null;
  }
}

document.addEventListener("keydown", event => {
  if (!gameStarted) {
    startGame();
    return;
  }

  if (event.key === "ArrowLeft") {
    playerMove(-1);
  } else if (event.key === "ArrowRight") {
    playerMove(1);
  } else if (event.key === "ArrowDown") {
    playerDrop();
  } else if (event.key === "ArrowUp") {
    playerRotate(1);
  }
});

startScreen.addEventListener("pointerdown", event => {
  event.preventDefault();
  startGame();
});

leftButton.addEventListener("pointerdown", event => {
  event.preventDefault();
  tapButton(leftButton, () => playerMove(-1));
});

rightButton.addEventListener("pointerdown", event => {
  event.preventDefault();
  tapButton(rightButton, () => playerMove(1));
});

upButton.addEventListener("pointerdown", event => {
  event.preventDefault();
  tapButton(upButton, () => playerRotate(1));
});

downButton.addEventListener("pointerdown", event => {
  event.preventDefault();
  startDownHold();
});

downButton.addEventListener("pointerup", event => {
  event.preventDefault();
  stopDownHold();
});

downButton.addEventListener("pointercancel", event => {
  event.preventDefault();
  stopDownHold();
});

downButton.addEventListener("pointerleave", event => {
  event.preventDefault();
  stopDownHold();
});

playerReset();
updateScore();
updateLevel();
update();
