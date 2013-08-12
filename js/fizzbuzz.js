
setup = function() {
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	var level = gameLogic.level;
	
	
	if (username) {
		gameLogic.username = username;
	}
	
	canvas.width  = 960;
	canvas.height = 480;
	
	gameLogic.x = canvas.width/2;
	gameLogic.y = 0;
	gameLogic.frameRate = 40;
	var highscore = document.getElementById("highscore");

	if (highscore !== null) {
		if (highscore.value > gameLogic.highscore) {
			gameLogic.highscore = highscore.value;
		}
	}

	createLevel(gameLogic.level);
	createLevel(gameLogic.level+1);

	// Let's create our dictionary of fizzbuzz numbers and solutions and our list of random numbers to be displayed on the canvas
	for (var i=1; i<101; i++) {
		if (i%3==0 && i%5==0) {gameLogic.numbers[i] = 'fizzbuzz';}
		else if (i%3==0) {gameLogic.numbers[i] = 'fizz';}
		else if (i%5==0) {gameLogic.numbers[i] = 'buzz';}
		else {gameLogic.numbers[i] = 'number';}
	}
	startGame(ctx);

}


startGame = function(ctx) {
	gameLogic.interval = setInterval(function () {
		drawNumbers(ctx);
		drawScoreBoard(ctx);
		drawLights(ctx);
		if (gameLogic.missed >= 10) {
			gameOver(ctx);
			clearInterval(gameLogic.interval);
		}
	}, gameLogic.frameRate);

}


drawNumbers = function(ctx) {

	clearCanvas(ctx);
	var level = gameLogic.level;
	var number = gameLogic.randomNumbers[level][gameLogic.iterator];

	ctx.font = "60px proxima-nova-soft";
	ctx.fillStyle = "#444857";
	
	if (gameLogic.y > canvas.height || gameLogic.x > canvas.width || gameLogic.y < 0 || gameLogic.x < 0) {
		newNumber(level);
		gameLogic.missed += 1;
	}
	ctx.fillText(number.number, gameLogic.x, gameLogic.y);

	gameLogic.y += number.vy;
	gameLogic.x += number.vx;
}


drawScoreBoard = function(ctx) {
	ctx.font = "bold 25px Arial Black";
	ctx.fillText('Score: '+ gameLogic.score, 10, 60);
	ctx.fillText('High Score: '+ gameLogic.highscore, 10, 30);
	ctx.fillText('Missed: ' + gameLogic.missed, 10, 90);
	ctx.fillText('Level: ' + gameLogic.level, 10, 120);

}


drawLights = function(ctx, color) {
	if (gameLogic.gameover !== 1) {
		color = color || 'default';

		// drawing light
		ctx.beginPath();
		ctx.arc(930, 25, 15, 0, 2*Math.PI, false);
		if (color === 'green' || (gameLogic.greenLight < 10 && gameLogic.greenLight > 0)) {
			ctx.fillStyle = 'green';
			gameLogic.greenLight += 1;
		}
		else if (color === 'red' || (gameLogic.redLight < 10 && gameLogic.redLight > 0)) {
			ctx.fillStyle = 'red';
			gameLogic.redLight += 1;
		}
		else {
			ctx.fillStyle = '#E5E8EF';
			gameLogic.greenLight = 0;
			gameLogic.redLight = 0;
		}
		ctx.fill();
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#444857';
		ctx.stroke();
	}

}


createLevel = function(level) {
	gameLogic.randomNumbers[level] = [];
	for (var i = 0; i < 20; i++) {
		gameLogic.randomNumbers[level].push(new createNumber(gameLogic.level));
	}
}

createNumber = function(level) {
	this.number = Math.floor(Math.random()*100+1);
	this.vx = Math.random()*8-4;
	this.vy = Math.random()*(3+level)+1+level;

}



clearCanvas = function(ctx) {
	ctx.clearRect(0,0,canvas.width, canvas.height);
}


buttonCheck = function(name) {
	var ctx = canvas.getContext('2d');
	var color;
	var level = gameLogic.level;
	var number = gameLogic.randomNumbers[level][gameLogic.iterator].number;
	
	var solution = gameLogic.numbers[number];

	if (solution == name) {
		gameLogic.score += 1;
		newNumber(level);
		color = 'green';
		drawLights(ctx, color);
	}
	else {
		gameLogic.missed += 1;
		color = 'red';
		drawLights(ctx, color);
	}
	
	if (gameLogic.score >= gameLogic.scoreMarker+10) {
		gameLogic.scoreMarker = gameLogic.score;
		gameLogic.level += 1;
		gameLogic.iterator = 0;
		createLevel(gameLogic.level+1);
	}

}


newNumber = function(level) {
	gameLogic.y = 0;
	gameLogic.x = canvas.width/2;
	gameLogic.iterator += 1;
	//create new number to keep the list long (in case someone presses twice on a button and the iterator becomes too high for the list
	gameLogic.randomNumbers[level].push(new createNumber(gameLogic.level));
}


gameOver = function(ctx) {
	if (gameLogic.score > gameLogic.highscore) {
		gameLogic.highscore = gameLogic.score;
		ajaxScoreUpdate(gameLogic.score);
	}
	gameLogic.gameover = 1;
	clearCanvas(ctx);
	ctx.font = "bold 50px Arial Black";
	ctx.fillStyle = '#444857';
	ctx.fillText('GAME OVER', 290, 170);
	ctx.fillText('SCORE: '+ gameLogic.score, 290, 270);
	ctx.fillText('HIGH SCORE: '+ gameLogic.highscore, 290, 220);
	
}


ajaxScoreUpdate = function(score) {
	$.ajax({
		type: 'POST',
		url: "/ajax",
		data: {
			highscore: score,
			username: username
		},
		success: showData
	});
}


showData = function(data) {
	console.log(data);

}



reset = function() {
	gameLogic.score = 0;
	gameLogic.missed = 0;
	gameLogic.iterator = 0;
	gameLogic.level = 1;
	gameLogic.scoreMarker = 0;
	gameLogic.gameover = 0;
	gameLogic.greenLight = 0;
	gameLogic.redLight = 0;
	gameLogic.reset = 1;
	clearInterval(gameLogic.interval);
	setup();
}


overlay = function () {
	var el = document.getElementById("overlay");
	el.style.visibility = (el.style.visibility == "visible") ? "hidden" : "visible";
}


closeOverlay = function () {
	overlay();
	setup();		
}

closeHighScoresOverlay = function () {
	var el = document.getElementById("highScoresOverlay");
	el.style.visibility = (el.style.visibility == "visible") ? "hidden" : "visible";

	$("#highscores").empty();	
}


viewHighScores = function() {
	var el = document.getElementById("highScoresOverlay");
	el.style.visibility = (el.style.visibility == "visible") ? "hidden" : "visible";

	$("#loadingImage").show();

	$.ajax({
		type: 'POST',
		url: "/highscores",
		data: {request: 'requesting top 20 high scores'},
		success: showHighScores,
		error: function(xhr, status) {
			$("#loadingImage").hide();
			alert('Unknown error ' + status);
		}
	});

}

showHighScores = function(response) {
	$("#loadingImage").hide();
	r = JSON.parse(response);
	console.log(r.result);
	for (var i=1; i < r.result.length+1; i++) {
		$("#highscores").append("<div id='highscoresBox'>" + '#' + i + '  ' + r.result[i-1] + ' points' + "</div>");
	}

	
}


