
function Controller() {
	var view;
	var model;
}

Controller.prototype.setModel = function(model) {
	this.model = model;
	this.autoplay.setModel(model);
}

Controller.prototype.setView = function(view) {
	this.view = view;
	this.autoplay.setView(view);
}

Controller.prototype.init = function() {
	this.events = new Array();
	this.autoplay = new Autoplay();
	this.autoplay.init();
	this.autoplay.setController(this);
}

Controller.prototype.handleEvents = function() {
	while(this.events.length > 0) {
		var evt = this.events.shift();
		if(evt.type == "CellState") {
			var vrow = evt.row + 1;
			var vcol = evt.col + 1;
			var state = evt.state;
			var mineCount = evt.mineCount;
			
			// Update the view	
			this.view.setState(vrow, vcol, state, mineCount);
		
			// Notify listeners, unless game is over
			if(!this.gameOver) {
				if((state == "Cleared") && (mineCount == 0)) {
					this.cascade(evt);
				} else {
					this.autoplay.onEvent(evt);
				}
			}
		}
		if(evt.type == "GameOver") {
			this.gameOver = true;
		}
	}
		
}

Controller.prototype.onEvent = function(obj) {
	this.events.push(obj);
}

Controller.prototype.onStartGame = function(rows, cols, mines) {
	this.gameOver = false;
	this.model.init(rows, cols, mines);
	this.autoplay.init();
	this.handleEvents();
}

Controller.prototype.onLeftClick = function(vrow, vcol) {
	var row = vrow - 1;
	var col = vcol - 1;
	var state = this.model.getState(row,col);
	if(state.state == "Covered") {
		this.model.clear(row,col);
	}
	this.handleEvents();
}

Controller.prototype.onRightClick = function(vrow, vcol) {
	var row = vrow - 1;
	var col = vcol - 1;
	var state = this.model.getState(row,col);
	if(state.state == "Covered") {
		this.model.flag(row,col);
	}
	if(state.state == "Flagged") {
		this.model.unflag(row,col);
	}
	this.handleEvents();
}

Controller.prototype.cascade = function (evt) {
	var states = this.model.getNeighborState(evt.row, evt.col);
	var ncells = states["Covered"];
	for(i=0;i<ncells.length;i++) {
		model.clear(ncells[i].row, ncells[i].col);
	}
}

function Autoplay() {
	var model;
}

Autoplay.prototype.setModel = function(model) {
	this.model = model;
}

Autoplay.prototype.setView = function(view) {
	this.view = view;
}

Autoplay.prototype.setController = function(controller) {
	this.controller = controller;
}

Autoplay.prototype.init = function () {
	this.events = new Array();
}

Autoplay.prototype.onEvent = function (evt) {
	// Check status of cell if clear
	if(evt.state == "Cleared") {
		this.events.push(evt);
    }

	// Check the status of all the cleared neighbors
	var states = this.model.getNeighborState(evt.row, evt.col);
	var ncells = states["Cleared"];
	for(i=0;i<ncells.length;i++) { 
		this.events.push(ncells[i]);
	}
}

Autoplay.prototype.handleEvent = function () {
	var cs = this.events.pop();
	this.view.hilite(0,0);
	if(!cs) { return; }
	
	var nstates = this.model.getNeighborState(cs.row, cs.col);
	var flagCount = nstates["Flagged"].length;
	var coverCount = nstates["Covered"].length;

	this.view.hilite(cs.row + 1, cs.col + 1);
	
	// if the mineCount = the count of flagged neighbors, clear the covered neighbors
	if(cs.mineCount == flagCount) {
		for(j=0; j<coverCount; j++) {
			var ncs = nstates["Covered"][j];
			this.model.clear(ncs.row, ncs.col);
		}
	}
	// if the (mineCount - count of flagged neighbors) == count of Covered neighbors
	// then flag the covered neighbors
	if( (cs.mineCount - flagCount) == coverCount) {
		for(j=0; j<coverCount; j++) {
			var ncs = nstates["Covered"][j];
			this.model.flag(ncs.row, ncs.col);
		}
	}
	this.controller.handleEvents();
}
