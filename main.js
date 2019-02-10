$(document).ready(function() {
	const canvas = document.getElementById("grid");
	var context = canvas.getContext("2d");
	const squareWidth = 9;
	const $nextStepBtn = $("#nextstep");
	$nextStepBtn.hide();
    // create a 2-D array that holds the squares in my canvas
	const createLogicalGrid = canvas => {
		let arr = [];
		const numCellsInOneRow = canvas.height / 10;
		for (let i = 0; i < numCellsInOneRow; i++) {
			arr[i] = new Array(numCellsInOneRow).fill(0)
		}
		return arr;
	}
	const logicalGrid = createLogicalGrid(canvas);
	
	//drawing the grid on the canvas
	const makeGrid = (gridPxSize, color, canvas) => {
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
	const canvasClickHandler = (logicalGrid, squareWidth) => {
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
	}
	canvasClickHandler(logicalGrid, squareWidth);
	
	//getting the user inputted dimensions for canvas
	var newWidth;
	var realWidth; //this has to at least 20
	//listening for keyup events that change dimension of canvas
	document.getElementById("dimensions").addEventListener("keydown", function()
	{
		newWidth = this.value * 10;
		realWidth = this.value;
	}, false); 
	
	//creates a new canvas (with new user dimensions) and deletes the old one
	document.getElementById("dimensions").onkeypress = function(evt)
	{
		//getting the specific key that the user entered
		if (!evt) {
			evt = window.event;
		}
		var keyCode = evt.keyCode || evt.which;
		if (keyCode =='13') {
			//enter pressed
			if (realWidth < 20 || realWidth > 200) {
				alert("Must be between 20 and 200");
			}
			else {
				//clear out the old canvas
				context.clearRect(0,0, canvas.width, canvas.height);
				canvas.height = newWidth;
				canvas.width = newWidth;
				makeGrid(10, "black");
				//restructuring my 2D array to match the new Grid
				createLogicalGrid = create2DArr();
				fillUp2DArr();
				return false;
			}
		}
	};

	//user input for game parameters
	var $neighborhoodRadiusInput = $("#changeRadius");
	var changeLoneliness = document.getElementById("changeLoneliness");
	var changeOverpopulation = document.getElementById("changeOverpopulation");
	var changeGMin = document.getElementById("changeGMin");
	var changeGMax = document.getElementById("changeGMax");
	
	//Default values
	var neighborhoodRadius = parseInt($neighborhoodRadiusInput.val());
	var loneliness = parseInt(changeLoneliness.value);
	var overpopulation = parseInt(changeOverpopulation.value);
	var gMin = parseInt(changeGMin.value);
	var gMax = parseInt(changeGMax.value);
	var speed = 200;
	
	const runAutomaton = logicalGrid => {
		//need a temp array to determine which cells are destined to live
		//original array is kept the same
		var tempArr = [];
		for (var i = 0; i < logicalGrid.length; i++)
		{
			tempArr[i] = logicalGrid[i].slice();
		}
		for (var x = 0; x < tempArr.length; x++)
		{
			for (var y = 0; y < tempArr[x].length; y++)
			{
				var count = countLiveNeighbors(x,y, tempArr);
				if (alwaysAlive) {
					var insideNeighbors = 0;
					for (var col = x - neighborhoodRadius; col <= (x-neighborhoodRadius) + neighborhoodRadius*2; col++)
					{
						for (var row = y - neighborhoodRadius; row <= (y-neighborhoodRadius) + neighborhoodRadius*2; row++)
						{
							if (checkCoordinates(col, row)) {
								insideNeighbors++;
							}
						}
					}
					count += Math.pow(2*neighborhoodRadius + 1, 2) - insideNeighbors;
					
				}
				//CHECK THIS
				else if (toroidal) {
					var wrapAroundNeighbors = 0;
					for (var col1 = x - neighborhoodRadius; col1 <= (x-neighborhoodRadius) + neighborhoodRadius*2; col1++)
					{
						for (var row1 = y - neighborhoodRadius; row1 <= (y-neighborhoodRadius) + neighborhoodRadius*2; row1++)
						{ 
							if (!checkCoordinates(col1,row1)) {
								var gridLen = createLogicalGrid.length;
								count += createLogicalGrid[(col1 + gridLen)%gridLen][(row1 + gridLen)%gridLen];
							}
						}
					}
	
				}
				
				if (logicalGrid[x][y] === 1)
				{
		
					if (deathByLoneliness(count)) 
					{
						tempArr[x][y] = false;
					}
					else if (deathByOverpopulation(count))
					{
						tempArr[x][y] = false;
					}
				}
				else
				{
					//currently dead cell
					if (spawnNextGeneration(count))
					{
						tempArr[x][y] = 1;
					}
				}	
			}
		}
		//know which cells are destined to live, so copy temp back into main array
		for (var k = 0; k < tempArr.length; k++)
		{
			logicalGrid[k] = tempArr[k].slice();
		}
		liveOrDie(logicalGrid, squareWidth);
	}
	
	const liveOrDie = (logicalGrid, squareWidth) => {
		for (var x = 0; x < logicalGrid.length; x++)
		{
			for (var y = 0; y < logicalGrid[x].length; y++)
			{
				if (logicalGrid[x][y] === 1)
				{
					// fills in the square if it's alive
					fillSquare(context, y* 10, x * 10, squareWidth);
				}
				else if (logicalGrid[x][y] === 0)
				{
					killSquare(context, y*10, x*10, squareWidth);
				} 
				else
				{
					markOnceAliveSquares(context, y*10, x*10, squareWidth);
				}
	
			}
	
		}
	}
	
	//death by loneliness
	const deathByLoneliness = (x, loneliness) => x < loneliness;
	
	function deathByOverpopulation(x)
	{
		return x > overpopulation;
	}
	
	function equilibrium(x)
	{
		return (x === 2 || x === 3);
	}
	
	//only applies to currently dead cells
	function spawnNextGeneration(x)
	{
		return (x >= gMin && x <= gMax);
	}
		
	//search for neighbors within a neighborhood radius
	const countLiveNeighbors = (x, y, logicalGrid) => {
		var liveNeighbors = 0;
		for (var r = x - neighborhoodRadius; r <= (x - neighborhoodRadius) + neighborhoodRadius*2; r++)
		{
			for (var c = y - neighborhoodRadius; c <= (y - neighborhoodRadius) + neighborhoodRadius*2; c++)
			{
				if (r === x && c === y) {
					//don't want to check myself
					continue;
				}
				if (checkCoordinates(r,c) && logicalGrid[r][c] === 1) {
					liveNeighbors += 1;
				}
					
			}
		}
		return liveNeighbors;
	}
	
	const reset = (logicalGrid, squareWidth) => {
		for (var x = 0; x < logicalGrid.length; x++)
		{
			for (var y = 0; y < logicalGrid[x].length; y++)
			{
				killSquare(context, y*10, x*10, squareWidth);
				logicalGrid[x][y] = 0;
			}
		}
	}
	
	function randomize(logicalGrid, squareWidth)
	{
		for (var x = 0; x < logicalGrid.length; x++)
		{
			for (var y = 0; y < logicalGrid[x].length; y++)
			{
				var randNum = Math.floor(Math.random() * 2);
				if (randNum === 0) {
					logicalGrid[x][y] = 0;
					killSquare(context, y*10, x*10, squareWidth);
				}
				else {
					logicalGrid[x][y] = 1;
					fillSquare(context, y*10, x*10, squareWidth);
				}
				
				
			}
		}
	}
	
	function checkCoordinates(x, y)
	{
		if (x < 0 || y < 0 || x >= createLogicalGrid.length || y >= createLogicalGrid.length) {
			//ALWAYS DEAD- CHANGE THIS
			return false;
		}
		return true;
	}

	//run the automaton
	var startDate = null;
	var canAdvanceAutomaton = false, canChangeSpeed = false;
	var paused = false;
	var interval_timer;
	$("#startstop").click(function() {
		var now = new Date();
		if (startDate === null)
		{
			paused = false;
			canChangeSpeed = true;
			startDate = now;
			$(this).text("Stop");
			$nextStepBtn.fadeOut("fast");	
			interval_timer = setInterval(runAutomaton(logicalGrid), speed); //global variable
			canAdvanceAutomaton = true;
		
		}
		else {
			paused = true;
			clearInterval(interval_timer);
			startDate = null;
			$(this).text("Start");
			//displaying next step button
			$nextStepBtn.fadeIn(1000);
		
		}
	});
	
	//marks all cells as dead
	$('#reset').click(function() {
		reset(logicalGrid, squareWidth);	
	});
	
	$('#randomize').click(function() {
		randomize(logicalGrid, squareWidth);
	});
	
	//advance automaton by one step
	$('#nextstep').click(function() {
		if (canAdvanceAutomaton) {
			runAutomaton();
		}
	});
	//reset default values
	$('#default').click(function() {
		$neighborhoodRadiusInput.val(1);
		neighborhoodRadius = 1;
		changeLoneliness.value = 2;
		loneliness = 2;
		changeOverpopulation.value = 3;
		overpopulation = 3;
		changeGMin.value = 3;
		gMin = 3;
		changeGMax.value = 3;
		gMax = 3;
		alwaysAlive = false;
		toroidal = false;
		alwaysDead = true;
		document.getElementById("outsideMode").innerHTML = "Current mode: Always Dead!";
	});
	var alwaysAlive = false, toroidal = false, alwaysDead = true;
    // changing references outside grid
	$('#alwaysDead').click(function() {
		document.getElementById("outsideMode").innerHTML = "Current mode: Always Dead!";
		alwaysDead = true;
		alwaysAlive = false;
		toroidal = false;
	});
	$('#alwaysAlive').click(function() {
		document.getElementById("outsideMode").innerHTML = "Current mode: Always Alive!";
		alwaysAlive = true;
		alwaysDead = false;
		toroidal = false;
		
	});
	$('#toroidal').click(function() {
		document.getElementById("outsideMode").innerHTML = "Current mode: Wrap Around!";
		toroidal = true;
		alwaysAlive = false;
		alwaysDead = false;
	});
	
	//changes speed of program according to slider
	$('#slider').click(function() {
		speed = parseInt($('#slider').val());
		if (!paused && canChangeSpeed){
			clearInterval(interval_timer);
			interval_timer = setInterval(runAutomaton, speed);
		}
	
	});
	
	//changes neigborhood radius
	$("#changeRadius").keypress(function(evt) {
		if (evt.keyCode === 13) {
			//enter pressed 
			var $userRadius = $(this).val();
			if ($userRadius < 1 || $userRadius > 10) {
				alert("You must enter a number between 1 and 10. Try again!");
				$(this).val(1);
			}
			else
				neighborhoodRadius = $userRadius;
		}
	});

	//change loneliness threshold
	document.getElementById("changeLoneliness").onkeypress = function(evt)
	{
		if (evt.keyCode === 13) {
			//enter pressed
			var input = parseInt(this.value);
			if (input <= 0 || input > overpopulation) {
				alert("Loneliness must be > 0 and less than overpopulation threshold");
				this.value = 2;
			}
			else
				loneliness = parseInt(this.value);
		}
	};

	//change overpopulation threshold
	document.getElementById("changeOverpopulation").onkeypress = function(evt)
	{
		if (evt.keyCode === 13) {
			//enter pressed
			var input = parseInt(this.value);
			if (input < loneliness || input >= (4*neighborhoodRadius*neighborhoodRadius + 4*neighborhoodRadius)) {
				alert("Invalid input. Try again!");
				this.value = 3;
			}
			else
				overpopulation = parseInt(this.value);
		}
	};  

	document.getElementById("changeGMin").onkeypress = function(evt)
	{
		if (evt.keyCode === 13) {
			//enter pressed
			var input = parseInt(this.value);
			if (input <= 0 || input > gMax) {
				alert("Generation min must be > 0 and <= generation max threshold");
				this.value = 3;

			}
			else
				gMin = parseInt(this.value);
	
		}
	}; 

	document.getElementById("changeGMax").onkeypress = function(evt)
	{
		if (evt.keyCode === 13) {
			//enter pressed
			var input = parseInt(this.value);
			if (input < gMin || input >= (4*neighborhoodRadius*neighborhoodRadius + 4*neighborhoodRadius)) {
				alert("Invalid input. Try again!");
				this.value = 3;
			}
			else
				gMax = parseInt(this.value);
			
		}
	};  
	// set up game once page loads
	randomize(logicalGrid, squareWidth);
});




