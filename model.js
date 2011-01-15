function Cell() {
	this.mineCount = 0;
	this.isClear = false;
	this.hasMine = false;
	this.hasFlag = false;
	return this;
}
//TODO add more comments
// CellState:
// These states are sent by the flag(), unflag(), clear() functions
//	"Covered"
//	"Cleared"
//	"Flagged"
//	"BOOM"
// These states are used by the reveal() function
//	"UnFlaggedMine"
//	"FalseFlaggedMine"
//
var CellStates = ["Covered", "Cleared", "Flagged", "BOOM", "UnFlaggedMine", "FalseFlaggedMine"];

function CellState(row, col, state, count) {
	this.type = "CellState";
	this.row = row;
	this.col = col;
	this.state = state;
	this.mineCount = count;
}

function Model() {
	var controller;
}

Model.prototype.setController = function(controller) {
	this.controller = controller;
}

Model.prototype.init = function(rows, cols, mines) {
	this.rows = rows;
	this.cols = cols;
	this.mines = mines;
	this.cells = new Array();

	this.cellsCleared = 0;
	this.cellsFlagged = 0;
	this.cellsTotal   = rows * cols;

	this.BOOM = false;
	
	// Init cells
	for(i=0;i<this.cellsTotal;i++) { this.cells[i] = new Cell(); }

	// Init mines
	var idx = Math.floor(Math.random() * this.cellsTotal);
	for(i=0;i<mines;i++) { 
		// Find a cell that doesn't already have a mine
		while(this.cells[idx].hasMine) { 
			idx = Math.floor(Math.random() * this.cellsTotal); 
		}

		// Put the mine in the cell
		this.cells[idx].hasMine = true;

		// Increment the mineCount for all the cell's neighbors
		var ncells = this.getNeighbors(idx);
		for(j=0;j<ncells.length;j++) {
			this.cells[ncells[j]].mineCount++;
		}
	}
}

Model.prototype.getNeighbors = function() {
	var use_idx = false;
	var row, col, idx;
	var result = new Array();

	// This function can be invoked as getNeighbors(row,col) or getNeighbors(idx)
	if(arguments.length==2) {
		row = arguments[0];
		col = arguments[1];
	} else {
		use_idx = true;
		idx = arguments[0];
		row = Math.floor(idx / this.cols);
		col = idx % this.cols;
	}

	// Iterate from row-1 to row+1, but don't go off the board
	var r, r0, r1;
	r0 = row - 1; if(r0<0){r0=0;}
	r1 = row + 2; if(r1>this.rows){r1=this.rows;}
	
	// Iterate from col-1 to col+1, but don't go off the board
	var c, c0, c1;
	c0 = col - 1; if(c0<0){c0=0;}
	c1 = col + 2; if(c1>this.cols){c1=this.cols;}

	for(r=r0;r<r1;r++) {
		for(c=c0;c<c1;c++) {
			// Don't include self as a neighbor
			if((r==row)&&(c==col)) { continue; }

			// Return either an array of indices, or an array of arrays
			if(use_idx) {
				result.push(r*this.cols + c);
			} else {
				result.push([r,c]);
			}
		}
	}
	return result;
}

Model.prototype.getState = function(row,col) {
	var cell = this.cells[(row)*this.cols + col];
	if(cell.isClear) {
		return new CellState(row,col,"Cleared", cell.mineCount);
	}
	if(cell.hasFlag) {
		return new CellState(row,col,"Flagged");
	}
	return new CellState(row,col,"Covered");
}

Model.prototype.getNeighborState = function(row,col) {
	var result = new Object();
	for(i=0; i<CellStates.length; i++) { 
		result[CellStates[i]] = new Array(); 
	}
	
	var ncells = this.getNeighbors(row,col);
	for(i=0; i<ncells.length; i++) {
		var cs = this.getState(ncells[i][0],ncells[i][1]);
		result[cs.state].push(cs);
	}

	return result;
}

Model.prototype.sendEvent = function(obj) { 
	this.controller.onEvent(obj);
}

Model.prototype.checkGameState = function() {
	if(this.BOOM) {
		this.sendEvent({type:"GameOver", win:false});
		this.reveal();
	}
	if(this.cellsCleared + this.cellsFlagged == this.cellsTotal) {
		this.sendEvent({type:"GameOver", win:true});
	}
}

Model.prototype.flag = function(row,col) {
	var cell = this.cells[(row)*this.cols + col];
	cell.hasFlag = true;
	this.cellsFlagged++;
	this.sendEvent(new CellState(row,col,"Flagged"));
	this.checkGameState();
}

Model.prototype.unflag = function(row,col) {
	var cell = this.cells[(row)*this.cols + col];
	cell.hasFlag = false;
	this.cellsFlagged--;
	this.sendEvent(new CellState(row,col,"Covered"));
	this.checkGameState();
}

Model.prototype.clear = function(row,col) {
	var cell = this.cells[(row)*this.cols + col];
	cell.isClear = true;

	if(cell.hasMine) { 
		this.sendEvent(new CellState(row,col,"BOOM"));
		this.BOOM = true;
	} else {
		this.cellsCleared++;
		this.sendEvent(new CellState(row,col,"Cleared", cell.mineCount));
	}
	this.checkGameState();
}

Model.prototype.reveal = function() {
	var cell, idx, row, col;

	for(idx=0;idx<this.cellsTotal;idx++) { 
		cell = this.cells[idx];

		// Clear cells don't need to be revealed
		if(cell.isClear) { continue; }

		// Flagged mines don't need to be revealed
		if(cell.hasFlag && cell.hasMine) { continue; }

		row = Math.floor(idx / this.cols);
		col = idx % this.cols;

		// False flags
		if(cell.hasFlag && !cell.hasMine) {
			this.sendEvent(new CellState(row,col,"FalseFlaggedMine"));
			continue;
		}

		// Unrevealed mines 
		if(cell.hasMine) {
			this.sendEvent(new CellState(row,col,"UnFlaggedMine"));
			continue;
		}
		
		this.sendEvent(new CellState(row,col,"Cleared", cell.mineCount));
	}
}
