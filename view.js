function View() {
	var controller;
	var rows, cols, mines;
}

View.prototype.setController = function(controller) {
	this.controller = controller;
}

View.prototype.startGame = function() {
	this.rows = $("#rows").val();
	this.cols = $("#cols").val();
	this.lastHiLite = undefined;
	var mines = $("#mines").val();
	var field = $("#field");
	var r,c;

	// Setup the field
	field.empty();
	for(r=1; r<= this.rows; r++) {
		field.append('<tr id="'+r+'"></tr>');
		for(c=1; c<=this.cols; c++) {
			$("#"+r).append('<td id="'+rc(r,c)+'"></td>');
			$("#"+rc(r,c)).data("row",r);
			$("#"+rc(r,c)).data("col",c);
		}
	}
	$("td").html("&nbsp;&nbsp;&nbsp;&nbsp;");
	$("td").addClass("covered");
	$("td").click( function () { view.leftClick($(this)); } );
	$("td").rightClick( function(e) { view.rightClick($(this)); } );
	$("td").noContext();

	// Notify the controller
	this.controller.onStartGame(this.rows, this.cols, mines);
}

View.prototype.leftClick = function(td) {
	var row = $(td).data("row");
	var col = $(td).data("col");
	this.controller.onLeftClick(row, col);
}

View.prototype.rightClick = function(td) {
	var row = $(td).data("row");
	var col = $(td).data("col");
	this.controller.onRightClick(row, col);
}

View.prototype.autoplay = function() {
	if($("#auto:checked").val()) {
		this.interval_id = setInterval("this.controller.autoplay.handleEvent()",100);
	} else {
		clearInterval(this.interval_id);
	}
}

// utility to get id of a cell
function rc(row, col) { return row+'-'+col; }


// classes: covered, flag, clear, clear1...clear8, boom
View.prototype.setState = function(row, col, state, mineCount) {
//	$("#log").html(row + "," + col + " " + state + " " + mineCount + "<br/>" + $("#log").html());
	var td = $("#"+rc(row,col));
	if(state == "Covered") {
		td.removeClass("flag");
		td.addClass("covered");
		td.html("&nbsp;&nbsp;&nbsp;&nbsp;");
		return;
	}
	if(state == "Flagged") {
		td.addClass("flag");
		td.addClass("covered");
		td.html("&nbsp;F&nbsp;");
		return;
	}
	if(state == "BOOM") {
		td.removeClass("flag");
		td.removeClass("covered");
		td.addClass("boom");
		td.html("&nbsp;*&nbsp;");
		return;
	}
	if(state == "Cleared") {
		td.removeClass("flag");
		td.removeClass("covered");
		td.addClass("clear");
		if(mineCount==0) {
			td.html("&nbsp;&nbsp;&nbsp;&nbsp;");
		} else {
			td.html("&nbsp;"+mineCount+"&nbsp;");
			td.addClass("clear"+mineCount);
		}
		return;
	}
	if(state == "UnFlaggedMine") {
		td.removeClass("covered");
		td.addClass("clear");
		td.addClass("flag");
		td.html("&nbsp;O&nbsp;");
		return;
	}
	if(state == "FalseFlaggedMine") {
		td.removeClass("covered");
		td.addClass("clear");
		td.addClass("flag");
		td.html("&nbsp;X&nbsp;");
		return;
	}
	return;
}

View.prototype.hilite = function(row, col) {
	var td = $("#"+rc(row,col));
	if(this.lastHiLite) {
		this.lastHiLite.removeClass("hilite");
	}
	td.addClass("hilite");
	this.lastHiLite = td;
}

View.prototype.setLog = function(txt) {
	$("#log").html(txt);
}
