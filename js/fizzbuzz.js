var gameLogic = new GameLogicClass();


setup = function() {
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	
	canvas.width  = 960;
	canvas.height = 480;
	
	gameLogic.x = canvas.width/2;
	gameLogic.y = 0;
	gameLogic.frameRate = 40;

	// Let's create our dictionary of fizzbuzz numbers and solutions and our list of random numbers to be displayed on the canvas
	for (var i=1; i<101; i++) {
		if (i%3==0 && i%5==0) {gameLogic.numbers[i] = 'fizzbuzz';}
		else if (i%3==0) {gameLogic.numbers[i] = 'fizz';}
		else if (i%5==0) {gameLogic.numbers[i] = 'buzz';}
		else {gameLogic.numbers[i] = 'number';}
		gameLogic.randomNumbers.push(new create_number());
	}

	var interval = setInterval(function () {
		drawNumbers(ctx);
		drawScoreBoard(ctx);
		if (gameLogic.missed >= 10) {
			gameOver(ctx);
			clearInterval(interval);
		}
	}, gameLogic.frameRate);
}


drawNumbers = function(ctx) {

	clear_canvas(ctx);
	var number = gameLogic.randomNumbers[gameLogic.iterator];

	ctx.font = "60px proxima-nova-soft";
	ctx.fillStyle = "#444857";
	
	if (gameLogic.y > canvas.height || gameLogic.x > canvas.width || gameLogic.y < 0 || gameLogic.x < 0) {
		newNumber();
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

}


create_number = function() {
	this.number = Math.floor(Math.random()*100+1);
	this.vx = Math.random()*8-4;
	this.vy = Math.random()*4+2;

}


clear_canvas = function(ctx) {
	ctx.clearRect(0,0,canvas.width, canvas.height);
}


button_check = function(name) {
	var number = gameLogic.randomNumbers[gameLogic.iterator].number;
	
	var solution = gameLogic.numbers[number];

	console.log(solution)
	console.log(name)

	if (solution == name) {
		gameLogic.score += 1;
		newNumber();
	}
	else {
		gameLogic.missed += 1;
	}

}


newNumber = function() {
	gameLogic.y = 0;
	gameLogic.x = canvas.width/2;
	gameLogic.iterator += 1;
	number = gameLogic.randomNumbers[gameLogic.iterator];
	//create new number to keep the list long
	gameLogic.randomNumbers.push(new create_number());
}


gameOver = function(ctx) {
	if (gameLogic.score > gameLogic.highscore) {
		gameLogic.highscore = gameLogic.score;
	}
	clear_canvas(ctx);
	ctx.font = "bold 50px Arial Black";
	ctx.fillText('GAME OVER', 290, 170);
	ctx.fillText('SCORE: '+ gameLogic.score, 290, 270);
	ctx.fillText('HIGH SCORE: '+ gameLogic.highscore, 290, 220);
	
}

reset = function() {
	gameLogic.score = 0;
	gameLogic.missed = 0;
	setup();
}

setup();
