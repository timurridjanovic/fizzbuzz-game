

var GameLogicClass = Class.extend({
	
	//dictionary containing fizzbuzz numbers and solutions
	numbers: {},

	//list containing the random numbers with their velocities (numbers to be displayed on the canvas)
	randomNumbers: [],

	//Number iterator to go through the random number list
	iterator: 0,

	score: 0,

	missed: 0,

	highscore: 0,

	username: 'anonymous',

	interval: 0
	


})


var gameLogic = new GameLogicClass();
