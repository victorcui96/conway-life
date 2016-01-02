$(document).ready(function() {

	var rightBlockId = 1;
	var numClicks = 0;
	var Game = function(size) {
		this.size = size;
	};

	Game.prototype.makeDiv = function() {
		var body = $(".divHolder");
		for (var i = 0; i < this.size; ++i) {
			var div = document.createElement('div');
			div.className = 'block';
			div.style.backgroundColor = getRandomColor();
			body.append(div);
		}
	};

	Game.prototype.displayPattern = function() {
		var blocks = document.getElementsByClassName('block'); //all the currently displayed blocks based on the current level
		animate(); 
		
	};

	/* resets the game to four blocks */
	Game.prototype.reset = function() {
		$('.block').remove();
		var $score = $("#score");
		var $level = $("#level");
		if ($score.length === 0  && $level.length === 0) {
			$('.info p').remove();
			var scoreTxt = $("<p></p>").text("Score: ");
			var score = $("<span></span>").text("0");
			score.attr('id',"score");
			scoreTxt.append(score);
			var levelTxt = $("<p></p>").text("Level: ");
			var level = $("<span></span>").text("1");
			level.attr('id','level');
			levelTxt.append(level);
			$('.info').append(scoreTxt, levelTxt);
			if (simulate !== undefined) {
				simulate = new Game(4);
				simulate.makeDiv();
			} 

		}
		else {
			$score.text(0);
			$level.text(1);
			if (simulate !== undefined) {
				simulate = new Game(4);
				simulate.makeDiv();
			} 
		}
		rightBlockId = 0;       //reset the correct id
		numClicks = 0;		
	}

	
	function animate() {
		var blocks = document.getElementsByClassName('block'); //all the currently displayed blocks based on the current level
		var i = 0;
		var randIdxs = [];
		for (var j = 0; j < blocks.length; j++) {
			randIdxs.push(j);
		}
		shuffle(randIdxs);
		var id = 1; 									//used as a unique identifier for each block (for when the user clicks on a block)
		var interval = setInterval(function() {
			var randIdx = randIdxs[i];
			lightUp(blocks[randIdx], id);
			i++;
			id++;
			if (i >= randIdxs.length) {
				clearInterval(interval);
			}
		}, 600);
	}

	function playKirbySound() {
		var audio = $('<audio autoplay></audio>');
		audio.append('<source src= "http://rpg.hamsterrepublic.com/wiki-images/f/fb/KirbyStyleLaser.ogg" type="audio/ogg">');
		$("#sounds").html(audio);

	}

	function playCollisionSound() {
		var audio = $('<audio autoplay></audio>');
		audio.append('<source src= "http://rpg.hamsterrepublic.com/wiki-images/2/21/Collision8-Bit.ogg" type="audio/ogg">');
		$("#sounds").html(audio);
	}

	$('.divHolder').on('click', '.block', function() {
		playCollisionSound();
		numClicks++;
		if (numClicks == simulate.size && parseInt($(this).attr('id')) === rightBlockId) {
			if (simulate.size === 5) {
				//user beat the game
				$('.info p').remove();
				var $winner = $("<p></p>").text("Congratulations, you beat the game!", "Yes or no");
				$(".info").prepend($winner);
				var ans = prompt("Play again?", "Answer yes or no");
				if (ans === "yes" || ans === "Yes") {
					simulate.reset(4);
				}
				else {
					var cgol = prompt("Play a different game?", "Answer yes or no");
					if (cgol === "yes" || cgol === "Yes") {
						window.location.assign("http://victorcui96.github.io/conway-life/");
					}
				}
				
			}
			else {
				//user beat the current level
				var $score = $("#score");
				var currScore = parseInt($("#score").text());
				$score.text(currScore+10);
				var $level = $("#level");
				$level.text(parseInt($level.text())+1);	
				if (simulate !== undefined) {
					$('.block').remove();
					var newSize = simulate.size+1;
					simulate = new Game(newSize);
					simulate.makeDiv();
				}		
			}
			rightBlockId = 0;       //reset the correct id
			numClicks = 0;		
		}

		else if (parseInt($(this).attr('id')) !== rightBlockId) {
			var loserMsg = document.getElementById('loser');
			if (loserMsg !== null) {
				return;
			}
			var $loserMsg = $("<p></p>").text("Sorry, you lost after ");
			$loserMsg.attr('id', 'loser');
			var $level = $("#level").text();
			$loserMsg.append($level + " levels");
			$(".info").append($loserMsg);
			//TODO: reset game to 4 tiles
			simulate.reset(4);

		}
		rightBlockId++;
	}); 

	function lightUp(divBlock, id) {
		var $block = $(divBlock).addClass("lit");
		$block.attr("id", id);
		playKirbySound();
		window.setTimeout(function() {
			$block.removeClass('lit');
		}, 300);
	}

	var simulate = new Game(4);
	simulate.makeDiv();
	$("#start").on('click', function() {
		$('#loser').remove();
		simulate.displayPattern();
	});
	

	function getRandomColor() {
		var letters = '0123456789ABCDEF'.split('');
	    var color = '#';
	    for (var i = 0; i < 6; i++ ) {
	        color += letters[Math.floor(Math.random() * 16)];
	    }
	    return color;
	}
   
    /* Fisher-Yates Shuffle */
	function shuffle(array) {
		var currentIndex = array.length, temporaryValue, randomIndex;
		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
		    randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}
		  return array;
	}
});
