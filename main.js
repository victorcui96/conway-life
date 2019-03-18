$(document).ready(function() {
	const canvas = document.getElementById("grid");
	const context = canvas.getContext("2d");
	const squareWidth = 9;
	const $nextStepBtn = $("#nextstep");
	$nextStepBtn.hide();

	//user input for game parameters
	const $neighborhoodRadiusInput = $("#changeRadius");
	const lonelinessInput = document.getElementById("changeLoneliness");
	const overpopulationInput = document.getElementById("changeOverpopulation");
	const generationMinInput = document.getElementById("changeGMin");
	const generationMaxInput = document.getElementById("changeGMax");
	
	//Default values
	let neighborhoodRadius = parseInt($neighborhoodRadiusInput.val());
	let loneliness = parseInt(lonelinessInput.value);
	let overpopulation = parseInt(overpopulationInput.value);
	let gMin = parseInt(generationMinInput.value);
	let gMax = parseInt(generationMaxInput.value);
	let speed = 200;

	let canvasWidth, userWidth;

	//variables that control the automaton
	let canAdvanceAutomaton = false, canChangeSpeed = false, paused = false;
	let interval_timer;
	let alwaysAlive = false, toroidal = false

    // create a 2-D array that holds the squares in my canvas
	const createLogicalGrid = canvas => {
		let arr = [];
		const numCellsInOneRow = canvas.height / 10;
		for (let i = 0; i < numCellsInOneRow; i++) {
			arr[i] = new Array(numCellsInOneRow).fill(0)
		}
		return arr;
	}
	let logicalGrid = createLogicalGrid(canvas);
	
	//drawing the grid on the canvas
	const makeGrid = (gridPxSize, color) => {
		context.save();
		context.lineWidth = 0.5;
		drawCanvasLines(canvas, gridPxSize, true);
		drawCanvasLines(canvas, gridPxSize, false);
		context.restore();
	}
	const drawCanvasLines = (canvas, gridPxSize, horizontal) => {
		for (let i = 0; i <= canvas.height; i += gridPxSize) {
			context.beginPath();
			if (horizontal) {
				context.moveTo(0, i);
				context.lineTo(canvas.width, i);
			} else {
				context.moveTo(i, 0);
				context.lineTo(i, canvas.width);
			}
			context.closePath();
			context.stroke();
		}
	}
	
	makeGrid(10, "black", canvas);
	
	//gets my square grid
	const getRect = (canvas, event) => {
		const rect = canvas.getBoundingClientRect();
		return ({
			x: 1 + (event.clientX - rect.left) - (event.clientX - rect.left)%10,
	        y: 1 + (event.clientY - rect.top) - (event.clientY - rect.top)%10
		});
	}
	
	//filling the squares in my grid
	//sets that square in the grid to be "alive"
	const fillSquare = (context, x, y, width) => {
		context.fillStyle = "green";
		context.fillRect(x, y, width, width);
	}
	//unfilling the squares in my grid, logically kills that square
	const killSquare = (context, x, y, width) => {
		context.fillStyle = "white";
		context.fillRect(x, y, width, width);
	}
	const markOnceAliveSquares = (context, x, y, width) => {
		context.fillStyle = "LightGreen";
		context.fillRect(x, y, width, width);
	}
	canvas.addEventListener('click', evt => {
		const mousePosition = getRect(canvas, evt);
		const mouseToGridX = Math.floor(mousePosition.y / 10);
		const mouseToGridY = Math.floor(mousePosition.x / 10);
		if (logicalGrid[mouseToGridX][mouseToGridY] === 0) {
			//forces cell to be alive if it isn't already
			fillSquare(context, mousePosition.x, mousePosition.y, squareWidth);
			logicalGrid[mouseToGridX][mouseToGridY] = 1;
		} else {
			//forces cell to be dead if it isn't already
			markOnceAliveSquares(context, mousePosition.x, mousePosition.y, squareWidth);
			logicalGrid[mouseToGridX][mouseToGridY] = 0; 
		}
	}, false);

	//listening for keydown events that change dimension of canvas
	document.getElementById("dimensions").addEventListener("keydown", function() {
		canvasWidth = this.value * 10;
		userWidth = this.value;
	}, false); 
	
	//creates a new canvas (with new user dimensions) and deletes the old one
	document.getElementById("dimensions").onkeypress = evt => {
		//getting the specific key that the user entered
		if (!evt) {
			evt = window.event;
		}
		const keyCode = evt.keyCode || evt.which;
		if (keyCode == '13') {
			//enter pressed
			if (userWidth < 20 || userWidth > 200) {
				alert("Grid dimensions must be between 20 and 200");
			} else {
				//clear out the old canvas
				context.clearRect(0,0, canvas.width, canvas.height);
				canvas.height = canvasWidth;
				canvas.width = canvasWidth;
				makeGrid(10, "black");
				//restructuring my 2D array to match the new Grid
				logicalGrid = createLogicalGrid(canvas);
				return false;
			}
		}
	};
	
	const runAutomaton = logicalGrid => {
		//need a temp array to determine which cells are destined to live
		//original array is kept the same
		let tempArr = logicalGrid.map((arr) => {
			return arr.slice();
		});
		for (let x = 0; x < tempArr.length; x++) {
			for (let y = 0; y < tempArr[x].length; y++) {
				let count = countLiveNeighbors(x,y, logicalGrid);
				if (alwaysAlive) {
					let insideNeighbors = 0;
					for (let col = x - neighborhoodRadius; col <= (x-neighborhoodRadius) + neighborhoodRadius*2; col++) {
						for (let row = y - neighborhoodRadius; row <= (y-neighborhoodRadius) + neighborhoodRadius*2; row++) {
							if (checkCoordinates(col, row, logicalGrid)) {
								insideNeighbors++;
							}
						}
					}
					count += Math.pow(2*neighborhoodRadius + 1, 2) - insideNeighbors;
				} else if (toroidal) {
					for (let col = x - neighborhoodRadius; col <= (x-neighborhoodRadius) + neighborhoodRadius*2; col++) {
						for (let row = y - neighborhoodRadius; row <= (y-neighborhoodRadius) + neighborhoodRadius*2; row++) { 
							if (!checkCoordinates(col, row, logicalGrid)) {
								const gridLen = logicalGrid.length;
								count += logicalGrid[(col + gridLen)%gridLen][(row + gridLen)%gridLen];
							}
						}
					}
				}
				
				if (logicalGrid[x][y] === 1 && (deathByLoneliness(count) || deathByOverpopulation(count))) {
					// mark as once been alive, but now dead
					tempArr[x][y] = false;
				} else {
					//currently dead cell
					if (spawnNextGeneration(count)) {
						tempArr[x][y] = 1;
					}
				}	
			}
		}
		//know which cells are destined to live, so copy temp back into main array
		for (let i = 0; i < tempArr.length; i++) {
			logicalGrid[i] = tempArr[i].slice();
		}
		liveOrDie(logicalGrid, squareWidth);
	}
	
	const liveOrDie = (logicalGrid, squareWidth) => {
		for (let x = 0; x < logicalGrid.length; x++) {
			for (let y = 0; y < logicalGrid[x].length; y++) {
				if (logicalGrid[x][y] === 1) {
					// fills in the square if it's alive
					fillSquare(context, y* 10, x * 10, squareWidth);
				} else if (logicalGrid[x][y] === 0) {
					killSquare(context, y*10, x*10, squareWidth);
				} else {
					markOnceAliveSquares(context, y*10, x*10, squareWidth);
				}
			}
		}
	}
	
	const deathByLoneliness = x => x < loneliness;
	const deathByOverpopulation = x => x > overpopulation;
	//only applies to currently dead cells
	const spawnNextGeneration = x => x >= gMin && x <= gMax 
		
	//search for neighbors within a neighborhood radius
	const countLiveNeighbors = (x, y, logicalGrid) => {
		let liveNeighbors = 0;
		for (let r = x - neighborhoodRadius; r <= (x - neighborhoodRadius) + neighborhoodRadius*2; r++) {
			for (let c = y - neighborhoodRadius; c <= (y - neighborhoodRadius) + neighborhoodRadius*2; c++) {
				if (r === x && c === y) {
					//don't want to check myself
					continue;
				}
				if (checkCoordinates(r,c, logicalGrid) && logicalGrid[r][c] === 1) {
					liveNeighbors++;
				}
					
			}
		}
		return liveNeighbors;
	}
	
	const reset = (logicalGrid, squareWidth) => {
		for (let x = 0; x < logicalGrid.length; x++) {
			for (let y = 0; y < logicalGrid[x].length; y++) {
				killSquare(context, y*10, x*10, squareWidth);
				logicalGrid[x][y] = 0;
			}
		}
	}
	
	const randomize = (logicalGrid, squareWidth) => {
		for (let x = 0; x < logicalGrid.length; x++) {
			for (let y = 0; y < logicalGrid[x].length; y++) {
				const randNum = Math.floor(Math.random() * 2);
				if (randNum === 0) {
					logicalGrid[x][y] = 0;
					killSquare(context, y*10, x*10, squareWidth);
				} else {
					logicalGrid[x][y] = 1;
					fillSquare(context, y*10, x*10, squareWidth);
				}
			}
		}
	}
	
	const checkCoordinates = (x, y, logicalGrid) => {
		if (x < 0 || y < 0 || x >= logicalGrid.length || y >= logicalGrid.length) {
			return false;
		}
		return true;
	}
	
	$("#startstop").click(function() {
		if (!paused) {
			paused = true;
			canChangeSpeed = true;
			$(this).text("Stop");
			$nextStepBtn.fadeOut("fast");	
			interval_timer = setInterval(() => runAutomaton(logicalGrid), speed); //global variable
			canAdvanceAutomaton = true;
		} else {
			paused = false;
			clearInterval(interval_timer);
			$(this).text("Start");
			//displaying next step button
			$nextStepBtn.fadeIn(1000);
		}
	});
	
	//marks all cells as dead
	$('#reset').click(() => {
		reset(logicalGrid, squareWidth);	
	});
	
	$('#randomize').click(() => {
		randomize(logicalGrid, squareWidth);
	});
	
	//advance automaton by one step
	$('#nextstep').click(() => {
		if (canAdvanceAutomaton) {
			runAutomaton(logicalGrid);
		}
	});
	//reset default values
	$('#default').click(() => {
		$neighborhoodRadiusInput.val(1);
		neighborhoodRadius = 1;
		lonelinessInput.value = 2;
		loneliness = 2;
		overpopulationInput.value = 3;
		overpopulation = 3;
		generationMinInput.value = 3;
		gMin = 3;
		generationMaxInput.value = 3;
		gMax = 3;
		alwaysAlive = false;
		toroidal = false;
		document.getElementById("outsideMode").innerHTML = "Current mode: Always Dead!";
	});
    // changing references outside grid
	$('#alwaysDead').click(() => {
		document.getElementById("outsideMode").innerHTML = "Current mode: Always Dead!";
		alwaysAlive = false;
		toroidal = false;
	});
	$('#alwaysAlive').click(() => {
		document.getElementById("outsideMode").innerHTML = "Current mode: Always Alive!";
		alwaysAlive = true;
		toroidal = false;
	});
	$('#toroidal').click(() => {
		document.getElementById("outsideMode").innerHTML = "Current mode: Wrap Around!";
		toroidal = true;
		alwaysAlive = false;
	});
	
	//changes speed of program according to slider
	$('#slider').click(() => {
		speed = parseInt($('#slider').val());
		if (!paused && canChangeSpeed){
			clearInterval(interval_timer);
			interval_timer = setInterval(runAutomaton(logicalGrid), speed);
		}
	});
	
	//changes neigborhood radius
	$("#changeRadius").keypress(function(evt) {
		if (evt.keyCode === 13) {
			//enter pressed 
			const $userRadius = $(this).val();
			if ($userRadius < 1 || $userRadius > 10) {
				alert("You must enter a number between 1 and 10. Try again!");
				$(this).val(1);
			} else {
				neighborhoodRadius = $userRadius;
			}
		}
	});

	//change loneliness threshold
	document.getElementById("changeLoneliness").onkeypress = function(evt) {
		if (evt.keyCode === 13) {
			//enter pressed
			const input = parseInt(this.value);
			if (input <= 0 || input > overpopulation) {
				alert("Loneliness must be > 0 and less than overpopulation threshold");
				this.value = 2;
			} else {
				loneliness = parseInt(this.value);
			}
		}
	};

	//change overpopulation threshold
	document.getElementById("changeOverpopulation").onkeypress = function(evt) {
		if (evt.keyCode === 13) {
			//enter pressed
			const input = parseInt(this.value);
			if (input < loneliness || input >= (4*neighborhoodRadius*neighborhoodRadius + 4*neighborhoodRadius)) {
				alert("Invalid input. Try again!");
				this.value = 3;
			} else {
				overpopulation = parseInt(this.value);
			}
		}
	};  

	document.getElementById("changeGMin").onkeypress = function(evt) {
		if (evt.keyCode === 13) {
			//enter pressed
			const input = parseInt(this.value);
			if (input <= 0 || input > gMax) {
				alert("Generation min must be > 0 and <= generation max threshold");
				this.value = 3;
			} else {
				gMin = parseInt(this.value);
			}
		}
	}; 

	document.getElementById("changeGMax").onkeypress = function(evt) {
		if (evt.keyCode === 13) {
			//enter pressed
			const input = parseInt(this.value);
			if (input < gMin || input >= (4*neighborhoodRadius*neighborhoodRadius + 4*neighborhoodRadius)) {
				alert("Invalid input. Try again!");
				this.value = 3;
			} else {
				gMax = parseInt(this.value);
			}
		}
	};  
	// set up game once page loads
	randomize(logicalGrid, squareWidth);
});
