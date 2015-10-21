$(document).ready(function(){
	var canvas = document.getElementById("grid");
	var context = canvas.getContext("2d");
	//creating a 2-D array that holds the squares in my canvas
	function create2DArr()
	{
		var arr = [];
		for (var i = 0; i < canvas.height / 10; i++) {
	    	arr[i] = [];
	  	}
	  	return arr;
	}
	var twoDarr = create2DArr();
	//fills up my 2D array
	function fillUp2DArr()
	{
		for (var i = 0; i < canvas.height / 10; i++)
		{
			for (var j = 0; j < canvas.height  / 10; j++)
			{
				twoDarr[i][j] = 0;
			}
		}
	}
	fillUp2DArr();
	
	//drawing the grid on the canvas
	function makeGrid(gridPxSize, color) 
	{
		context.save();
		context.lineWidth = 0.5;
	
		//drawing horizontal canvas lines
		for (var i = 0; i <= canvas.height; i += gridPxSize)
		{
			context.beginPath();
			context.moveTo(0, i);
			context.lineTo(canvas.width, i);
			context.closePath();
			context.stroke();
		}
	
		//drawing vertical canvas lines
		for (var k = 0; k <= canvas.width; k += gridPxSize)
		{
			context.beginPath();
			context.moveTo(k, 0);
			context.lineTo(k, canvas.width);
			context.closePath();
			context.stroke();
		}
	
		context.restore();
	
	}
	
	makeGrid(10, "black");
	
	//gets my square grid
	function getRect(canvas, anEvent)
	{
		var rect = canvas.getBoundingClientRect();
		return {
			x: 1 + (anEvent.clientX - rect.left) - (anEvent.clientX - rect.left)%10,
	        y: 1 + (anEvent.clientY - rect.top) - (anEvent.clientY - rect.top)%10
		};
	}
	
	//filling the squares in my grid
	//sets that square in the grid to "alive"
	function fillSquare(context, x, y)
	{
		context.fillStyle = "green";
		context.fillRect(x,y,9,9);
	}
	//unfilling the squares in my grid
	function killSquare(context, x, y)
	{
		context.fillStyle = "white";
		context.fillRect(x,y,9,9);
	}
	
	function makeLightGreen(context, x, y)
	{
		context.fillStyle = "LightGreen";
		context.fillRect(x,y,9,9);
	}
	
	
	//square turns black when user clicks them
	canvas.addEventListener('click', function(evt)
	{
		var mousePosition = getRect(canvas, evt);
		var mouseToGridX = Math.floor(mousePosition.y / 10);
		var mouseToGridY = Math.floor(mousePosition.x / 10);
		if (evt.shiftKey) {
			//forces cell to be alive if it isn't already
			if (twoDarr[mouseToGridX][mouseToGridY] === 0) {
				fillSquare(context, mousePosition.x, mousePosition.y);
				twoDarr[mouseToGridX][mouseToGridY] = 1;
			}
		}
		else if (evt.ctrlKey || evt.altKey)
		{
			//forces cell to be dead if it isn't already
			if (twoDarr[mouseToGridX][mouseToGridY] === 1) {
				makeLightGreen(context, mousePosition.x, mousePosition.y);
				twoDarr[mouseToGridX][mouseToGridY] = 0; 
			}
		}
		else if (twoDarr[mouseToGridX][mouseToGridY] === 0) {
			fillSquare(context, mousePosition.x, mousePosition.y);
			twoDarr[mouseToGridX][mouseToGridY] = 1;
		}
		else
		{
			makeLightGreen(context, mousePosition.x, mousePosition.y);
			twoDarr[mouseToGridX][mouseToGridY] = 0; 
		}
	
	}, false);
	
	
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
				twoDarr = create2DArr();
				fillUp2DArr();
				return false;
			}
		}
	};
	
	//determine which cells will die in the next time step
	//Default values
	var neighborhoodRadius = 1; //IMPORTANT //Default value
	var loneliness = 2;
	var overpopulation = 3;
	var gMin =3, gMax = 3;
	var speed = 200;
	
	function runAutomaton()
	{
		//need a temp array to determine which cells are destined to live
		//originaly array is kept the same
		var tempArr = [];
		for (var i = 0; i < twoDarr.length; i++)
		{
			tempArr[i] = twoDarr[i].slice();
		}
		for (var x = 0; x < tempArr.length; x++)
		{
			for (var y = 0; y < tempArr[x].length; y++)
			{
				var count = countLiveNeighbors(x,y);
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
								var gridLen = twoDarr.length;
								count += twoDarr[(col1 + gridLen)%gridLen][(row1 + gridLen)%gridLen];
							}
						}
					}
	
				}
				
				if (twoDarr[x][y] === 1)
				{
					//currently live cell
					/* if (equilibrium(count))
					{
						tempArr[x][y] = 1;
					} */
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
		twoDarr = [];
		for (var k = 0; k < tempArr.length; k++)
		{
			twoDarr[k] = tempArr[k].slice();
		}
		liveOrDie();
	}
	//fills in the square if it's alive
	function liveOrDie()
	{
		for (var x = 0; x < twoDarr.length; x++)
		{
			for (var y = 0; y < twoDarr[x].length; y++)
			{
				if (twoDarr[x][y] === 1)
				{
					fillSquare(context, y* 10, x * 10);
				}
				else if (twoDarr[x][y] === 0)
				{
					killSquare(context, y*10, x*10);
				} 
				else
				{
					makeLightGreen(context, y*10, x*10);
				}
	
			}
	
		}
	}
	
	//death by loneliness
	function deathByLoneliness(x)
	{
		return x < loneliness;
	}
	
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
	
	function countLiveNeighbors(x, y)
	{
	
		var liveNeighbors = 0;
		for (var r = x - neighborhoodRadius; r <= (x - neighborhoodRadius) + neighborhoodRadius*2; r++)
		{
			for (var c = y - neighborhoodRadius; c <= (y - neighborhoodRadius) + neighborhoodRadius*2; c++)
			{
				if (r === x && c === y) {
					//don't want to check myself
					continue;
				}
				if (checkCoordinates(r,c) && twoDarr[r][c] === 1) {
					liveNeighbors += 1;
				}
					
			}
		}
		return liveNeighbors;
	}
	
	function reset()
	{
		for (var x = 0; x < twoDarr.length; x++)
		{
			for (var y = 0; y < twoDarr[x].length; y++)
			{
				//if (twoDarr[x][y] === 1)
				{
					killSquare(context, y*10, x*10);
				}
				twoDarr[x][y] = 0;
			}
		}
	}
	
	function randomize()
	{
		for (var x = 0; x < twoDarr.length; x++)
		{
			for (var y = 0; y < twoDarr[x].length; y++)
			{
				var randNum = Math.floor(Math.random() * 2);
				if (randNum === 0) {
					twoDarr[x][y] = 0;
					killSquare(context, y*10, x*10);
				}
				else {
					twoDarr[x][y] = 1;
					fillSquare(context, y*10, x*10);
				}
				
				
			}
		}
	}
	
	function checkCoordinates(x, y)
	{
		if (x < 0 || y < 0 || x >= twoDarr.length || y >= twoDarr.length) {
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
	//var hasAdvanceButton = false;
	$("#startstop").click(function() {
		var now = new Date();
		if (startDate === null)
		{
			paused = false;
			canChangeSpeed = true;
			startDate = now;
			$(this).text("Stop");
			//BUG RUNNING AT THE SAME TIME AS MY OTHER INTERVAL TIMER
			interval_timer = setInterval(runAutomaton, speed); //global variable
			canAdvanceAutomaton = true;
		
		}
		else {
			paused = true;
			clearInterval(interval_timer);
			startDate = null;
			$(this).text("Start");
		
		}
	});
	
	$('#reset').click(function() {
		reset();	
	});
	
	$('#randomize').click(function() {
		randomize();
	});
	
	//advance automaton by one step
	$('#nextstep').click(function() {
		if (canAdvanceAutomaton) {
			runAutomaton();
		}
	});
	//reset default values
	$('#default').click(function() {
		neighborhoodRadius = 1; 
		loneliness = 2;
		overpopulation = 3;
		gMin =3, gMax = 3;
		alwaysAlive = false;
		toroidal = false;
		alwaysDead = true;
		document.getElementById("outsideMode").innerHTML = "Current mode: Always Dead!";
	});
	var alwaysAlive = false, toroidal = false, alwaysDead = true;
	//changing references outside grid
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
	$('#slider').click(function(){
		speed = parseInt($('#slider').val());
		if (!paused && canChangeSpeed){
			clearInterval(interval_timer);
			//BUG GAME IS RUNNING EVEN WHEN IT'S PAUSED
			interval_timer = setInterval(runAutomaton, speed);
		}
	
	});
	//var interval_timer = setInterval(runAutomaton, speed);
	
	
	//gets neigborhood radius
	document.getElementById("changeRadius").addEventListener("keydown", function()
	{
		neighborhoodRadius = this.value;
		neighborhoodRadius = parseInt(neighborhoodRadius);
	}, false); 
	//changes neigborhood radius
	document.getElementById("changeRadius").onkeypress = function(evt)
	{
		if (!evt) {
			evt = window.event;
		}
		var keyCode = evt.keyCode || evt.which;
		if (keyCode =='13') {
			if (neighborhoodRadius < 1 || neighborhoodRadius > 10) {
				alert("You must enter a number between 1 and 10. Try again!");
				alert("Neighborhood radius reset to default value!");
				neighborhoodRadius = 1;
			}
	
		}
	};
	//change loneliness threshold
	document.getElementById("changeLoneliness").addEventListener("keydown", function()
	{
		loneliness = this.value;
	}, false); 
	document.getElementById("changeLoneliness").onkeypress = function(evt)
	{
		if (!evt) {
			evt = window.event;
		}
		var keyCode = evt.keyCode || evt.which;
		if (keyCode =='13') {
			if (loneliness <= 0 || loneliness > overpopulation) {
				alert("Invalid input. Try again!");
				alert("Loneliness reset to default value!");
				loneliness = 2;
			}
	
		}
	};
	//change overpopulation threshold
	document.getElementById("changeOverpopulation").addEventListener("keydown", function()
	{
		overpopulation = this.value;
	}, false);
	
	document.getElementById("changeOverpopulation").onkeypress = function(evt)
	{
		if (!evt) {
			evt = window.event;
		}
		var keyCode = evt.keyCode || evt.which;
		if (keyCode =='13') {
			if (overpopulation < loneliness || overpopulation >= (4*neighborhoodRadius*neighborhoodRadius + 4*neighborhoodRadius))
	 		{
				alert("Invalid input. Try again!");
				alert("Overpopulation reset to default value");
				overpopulation = 3;
			}
	
		}
	};
	//change gMin and gMax
	document.getElementById("changeGMin").addEventListener("keydown", function()
	{
		gMin = this.value;
	}, false);
	document.getElementById("changeGMin").onkeypress = function(evt)
	{
		if (!evt) {
			evt = window.event;
		}
		var keyCode = evt.keyCode || evt.which;
		if (keyCode =='13') {
			if (gMin <= 0 || gMin > gMax)
	 		{
				alert("Invalid input. Try again!");
				alert("generation min reset to default value");
				gMin = 3;
			}
	
		}
	};
	
	document.getElementById("changeGMax").addEventListener("keydown", function()
	{
		gMax = this.value;
	}, false);
	document.getElementById("changeGMax").onkeypress = function(evt)
	{
		if (!evt) {
			evt = window.event;
		}
		var keyCode = evt.keyCode || evt.which;
		if (keyCode =='13') {
			if (gMax < gMin || gMax >=  (4*neighborhoodRadius*neighborhoodRadius + 4*neighborhoodRadius))
	 		{
				alert("Invalid input. Try again!");
				alert("generation min reset to default value");
				gMin = 3;
			}
		}
	};

});





