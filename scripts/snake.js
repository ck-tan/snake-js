var lastGameUpdate = 0,
	gameSpeed = 15,
	scoreMultiplier = 1,
	score = 0,
	scoreDisplay,
	statusDisplay;
var waitForNextTick = false;
var board,
	boardHeight = 0,
	boardWidth = 0,
	blockSize = 10,
	boardHeightBlocks = 0,
	boardWidthBlocks = 0,
	boardBlocks = [],
	boardEmptyBlocks = [],
	boardOccupiedBlocks = [];
var walls = [];
var food = [],
	foodLimit = 1;
var snake = [],
	snakeLength = 1,
	snakeHeading = "",
	snakeSpeed = 1,
	snakeGrowthRate = 1;
	snakeGrowth = 0;
//LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40
var timestep = 1000/60;
var fps = 60,
    framesThisSecond = 0,
    lastFpsUpdate = 0,
	fpsDisplay;
document.addEventListener('DOMContentLoaded', function() { 
	console.log("compatibility", typeof requestAnimationFrame)
	fpsDisplay = document.getElementById('fps');
	scoreDisplay = document.getElementById('score');
	statusDisplay = document.getElementById('status');
	board = document.getElementById('board');
	boardHeight = board.clientHeight;
	boardWidth = board.clientWidth;
	boardHeightBlocks = boardHeight / blockSize;
	boardWidthBlocks = boardWidth / blockSize;
	for (i = 0; i < boardHeightBlocks; i++) {
		for (j = 0; j < boardWidthBlocks; j++) {
			boardBlocks.push([j, i]);
		}
	}
	init();
});
function init() {
	waitForNextTick = false;
	initWalls();
	initSnake();
	setBoardState();
	food = [];
	foodLimit = 1;
	addFood();
	score = 0;
	board.onkeyup = function(evt) {
		if (!evt) var evt = window.event;
		var keyNum = (evt.which) ? evt.which : evt.keyCode;
		//if (keyNum === 32 || keyNum === 13) { */
		if (keyNum === 37 || keyNum === 38 || keyNum === 39 || keyNum === 40) {
			start();
			board.onkeyup = null;
		}
	};
	board.onkeydown = function(evt) {
		if (waitForNextTick == false) {
			if (!evt) var evt = window.event;
			evt.preventDefault(); // prevent arrow keys from scrolling the page
			var keyNum = (evt.which) ? evt.which : evt.keyCode;
			switch (keyNum) {
				case 37:
					if (snakeHeading != "RIGHT") {
						snakeHeading = "LEFT";
					}
					break;
				case 38:
					if (snakeHeading != "DOWN") {
						snakeHeading = "UP";
					}
					break;
				case 39:
					if (snakeHeading != "LEFT") {
						snakeHeading = "RIGHT";
					}
					break;
				case 40:
					if (snakeHeading != "UP") {
						snakeHeading = "DOWN";
					}
					break;
			}
			waitForNextTick = true;
			//alternative method is to stack inputs in an array, but that'll make the game easier
		}
	};
	board.focus();
}
function initWalls() { 
	walls = [];
	for (i = 0; i < boardWidthBlocks; i++) {
		walls.push([i,0]);
	}
	for (i = 1; i < boardHeightBlocks; i++) {
		walls.push([boardWidthBlocks - 1,i]);
	}
	for (i = boardWidthBlocks - 2; i > -1; i--) {
		walls.push([i,boardHeightBlocks - 1]);
	}
	for (i = boardHeightBlocks - 2; i > 0; i--) {
		walls.push([0,i]);
	}
	for (i = 0; i < walls.length; i++) {
		var wallBlock = document.createElement("div");
		wallBlock.style.left = (walls[i][0] * blockSize) + "px";
		wallBlock.style.top = (walls[i][1] * blockSize) + "px";
		wallBlock.style.height = blockSize + "px";
		wallBlock.style.width = blockSize + "px";
		wallBlock.className = 'wall';
		board.appendChild(wallBlock);
	}
}
function initSnake() {
	snake = [];
	snakeLength = 1;
	snakeHeading = "";
	snakeGrowth = 0;
	snakeStartPos = [boardWidthBlocks / 2, boardHeightBlocks / 2];
	snake.push(snakeStartPos);
	drawSnake();
}
function start() {
	requestAnimationFrame(mainLoop);
}
function mainLoop(timestamp) {
	if (timestamp > lastFpsUpdate + 1000) { // update every second
        fps = 0.25 * framesThisSecond + (1 - 0.25) * fps; // compute the new FPS
 
        lastFpsUpdate = timestamp;
        framesThisSecond = 0;
    }
    framesThisSecond++;
	if (timestamp > lastGameUpdate + 1000/gameSpeed) {
        lastGameUpdate = timestamp;
		update();
		if(checkFood() == false) {
			if (snakeGrowth > 0) {
				snakeGrowth--;
			} else {
				snake.pop();
			}
		} else {
			if (boardEmptyBlocks.length <= 0) {
				stop("WIN");
				return;
			} else {
				snakeGrowth += snakeGrowthRate - 1; //growth is already skipped if food is checkFood
				if (snakeGrowth < 0) snakeGrowth = 0;
				addFood();
			}
		}
		waitForNextTick = false;
		if (checkCollision()) {
			stop("LOSE");
			return;
		} else {
			draw();
		}
	}
	requestAnimationFrame(mainLoop);
}

function update() {
	moveSnake();
	setBoardState();
}
function moveSnake() {
	var snakeHead = snake[0];
	switch (snakeHeading) {
		case "LEFT":
			snake.unshift([snakeHead[0] - 1, snakeHead[1]]);
			if(snake[0][0] < 0) snake[0][0] = boardWidthBlocks - 1;
			break;
		case "UP":
			snake.unshift([snakeHead[0], snakeHead[1] - 1]);
			if(snake[0][1] < 0) snake[0][1] = boardHeightBlocks - 1;
			break;
		case "RIGHT":
			snake.unshift([snakeHead[0] + 1, snakeHead[1]]);
			if(snake[0][0] >= boardWidthBlocks) snake[0][0] = 0;
			break;
		case "DOWN":
			snake.unshift([snakeHead[0], snakeHead[1] + 1]);
			if(snake[0][1] >= boardHeightBlocks) snake[0][1] = 0;
			break;
		default:
			snake.unshift([snakeHead[0], snakeHead[1] - 1]);
			if(snake[0][1] < 0) snake[0][1] = boardHeightBlocks - 1;
			break;
	}
}
function checkFood() {
	for (i = 0; i < food.length; i++) {
		if ((food[i][0] == snake[0][0]) && (food[i][1] == snake[0][1])) {
			score += scoreMultiplier * gameSpeed;
			food.splice(i,1);
			return true;
		}
	}
	return false;
}
function addFood() {
	var noFoodEmptyBlocks = boardEmptyBlocks.slice(0); //clone array
	for (i = noFoodEmptyBlocks.length - 1; i >= 0; i--) {
		for (j = 0; j < food.length; j++) {
			if ((noFoodEmptyBlocks[i][0] == food[j][0]) && (noFoodEmptyBlocks[i][1] == food[j][1])) {
				noFoodEmptyBlocks.splice(i, 1);
				break;
			}
		}
	}	
	while (food.length < foodLimit) {
		var randomIndex = Math.floor(Math.random()*(noFoodEmptyBlocks.length));
		food.push(noFoodEmptyBlocks[randomIndex]);
		noFoodEmptyBlocks.splice(randomIndex, 1); //remove this block from noFoodEmptyBlocks so there won't be stacking of food
	}
}
function setBoardState() {
	boardEmptyBlocks = boardBlocks.slice(0); //clone array
	boardOccupiedBlocks = [];
	for (i = 0; i < snake.length; i++) { //snake first so snake head is always first index
		boardOccupiedBlocks.push(snake[i]);
	}
	for (i = 0; i < walls.length; i++) {
		boardOccupiedBlocks.push(walls[i]);
	}
	/*
	for (i = 0; i < food.length; i++) {
		boardOccupiedBlocks.push(food[i]);
	}
	*/
	for (i = boardEmptyBlocks.length - 1; i >= 0; i--) {
		for (j = 0; j < boardOccupiedBlocks.length; j++) {
			if ((boardEmptyBlocks[i][0] == boardOccupiedBlocks[j][0]) && (boardEmptyBlocks[i][1] == boardOccupiedBlocks[j][1])) {
				boardEmptyBlocks.splice(i, 1);
				break;
			}
		}
	}
}
function checkCollision() {
	for (i = 1; i < boardOccupiedBlocks.length - 1; i++) { //exclude first index which is the snake head
		if ((boardOccupiedBlocks[i][0] == snake[0][0]) && (boardOccupiedBlocks[i][1] == snake[0][1])) {
			return true;
		}
	}
	return false;
}
function draw() {
	var snake = document.getElementsByClassName("snake");
    while(snake.length > 0){
        snake[0].parentNode.removeChild(snake[0]);
    }
	var food = document.getElementsByClassName("food");
    while(food.length > 0){
        food[0].parentNode.removeChild(food[0]);
    }
	drawSnake();
	drawFood();
    fpsDisplay.textContent = Math.round(fps);
    scoreDisplay.textContent = score;
}
function drawSnake() {
	for (i = 0; i < snake.length; i++) {
		var snakeBlock = document.createElement("div");
		snakeBlock.style.left = (snake[i][0] * blockSize) + "px";
		snakeBlock.style.top = (snake[i][1] * blockSize) + "px";
		snakeBlock.style.height = blockSize + "px";
		snakeBlock.style.width = blockSize + "px";
		snakeBlock.className = 'snake';
		board.appendChild(snakeBlock);
	}
}
function drawFood() {
	if (food.length <= 0) console.log("drawfood err", food.length, food)
	for (i = 0; i < food.length; i++) {
		var foodBlock = document.createElement("div");
		foodBlock.style.left = (food[i][0] * blockSize) + "px";
		foodBlock.style.top = (food[i][1] * blockSize) + "px";
		foodBlock.style.height = blockSize + "px";
		foodBlock.style.width = blockSize + "px";
		foodBlock.className = 'food';
		board.appendChild(foodBlock);
	}
}
function stop(type) {
	if (type == "WIN") {
		statusDisplay.textContent = "You've Won";
	} else if (type == "LOSE") {
		statusDisplay.textContent = "Game Over";
	}
	board.onkeydown = null;
}

//============================================Compatibility===================================================
var requestAnimationFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (function() {
	var lastTimestamp = Date.now(),
		now,
		timeout;
	return function(callback) {
		now = Date.now();
		timeout = Math.max(0, timestep - (now - lastTimestamp));
		lastTimestamp = now + timeout;
		return setTimeout(function() {
			callback(now + timeout);
		}, timeout);
	};
})(),

cancelAnimationFrame = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout;
//============================================Compatibility===================================================