class Contour {
	constructor(dataArr, pointArr=[], cavasID, latIndex = 1, lonIndex = 2, dataIndex = 3, numSteps = 5, colorArray = ['#FFFF00', '#FF0080'], x_resolution = 3.5, y_resolution = 3.5) {
		this.data = dataArr; 						//dataArray is a 2D array. An array of points and each point holds an array of values for that point
		this.points = pointArr;
		this.x_res = x_resolution; 					//the resolution of the points in metres, 3.5 for most soiloptix
		this.y_res = y_resolution;					//the resolution of the points in metres, 3.5 for most soiloptix
		this.dataIdx = dataIndex;					//the index in the point array that holds the data to generate a contour heat map for
		this.latIdx = latIndex;						//the index in the point array that holds the Easting
		this.lonIdx = lonIndex;						//the index in the point array that hold the Longitude
		this.steps = numSteps;						//the number of colour intervals to use in the contour image
		this.colors = colorArray;					//an array of hex colour values [start colour, end colour]
		this.canvas = this.getCanvas(cavasID); 		//the canvas to draw on
		this.ctx = this.contextGet(this.canvas); 	//the canvas context
	}

	//The only function you need to worry about
	get drawContour() { 
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawBothAxis();
		this.reDraw();
		return;	 
	}
	get drawPoints() {
		this.drawAllPoints();
		return;	 
	}

	//Various internal calculation functions
	contextGet(canvas) {
		return canvas.getContext("2d");
	}
	getCanvas(canvasID) {
		return document.getElementById(canvasID);
	}
	x_min() {
		return this.minAtIndex(this.data, this.latIdx);
	}
	x_max() {
		return this.maxAtIndex(this.data, this.latIdx);
	}
	x_delta() {
		return this.x_max() - this.x_min();
	}
	y_min() {
		return this.minAtIndex(this.data, this.lonIdx);
	}
	y_max() {
		return this.maxAtIndex(this.data, this.lonIdx);
	}
	y_delta() {
		return this.y_max() - this.y_min();
	}
	z_min() {
		return this.minAtIndex(this.data, this.dataIdx);
	}
	z_max() {
		return this.maxAtIndex(this.data, this.dataIdx);
	}
	z_delta() {
		return this.z_max() - this.z_min();
	}
	//Offset is used to centre the map on the canvas
	x_offset() {
		return (this.canvas.width - (this.x_delta() / 3.5)) / 2 + this.canvas.width/10;
	}
	y_offset() {
		return (this.canvas.height - (this.y_delta() / 3.5)) / 2 - this.canvas.height/10;
	}

	maxAtIndex(data, index) {
		var max = Math.max.apply(null, data.map(function (e) { return e[index] }));
		return max;
	}

	minAtIndex(data, index) {
		var min = Math.min.apply(null, data.map(function (e) { return e[index] }));
		return min;
	}

	//////////////////////////////////////////////////////////////////////////
	//return the colour of the pixel based on it's value
	getColor(z, zDelta, zMin, steps, colors) {
		var c = colors[0];
		for (var i = 1; i <= steps; i++) {
			if (z > ((zDelta * ((1 / steps) * (i + 1))) + zMin)) { c = colors[i]; }
		}
		return c;
	}
	//drawing the pixel, x/y are the pixel coordinates on the canvas and z is a hex colour string '#FFFFFF'
	drawPixel(x, y, z) {
		this.ctx.beginPath();
		this.ctx.rect(x, y, 1, 1);
		//this.ctx.translate(50,-50);
		this.ctx.fillStyle = z;
		this.ctx.fill();
		
		this.ctx.closePath();	
		return;
	}
	//draws points with labels
	drawPoint(x,y,text=("("+x+", "+y+")")) {
		this.ctx.beginPath();
		this.ctx.fillStyle = '#000000';
		this.ctx.arc(x+2,y+2,2,0,2*Math.PI);
		this.ctx.fill();
        this.ctx.font = "12px Arial";
        this.ctx.fillText(text,x+7,y+5);	
		this.ctx.stroke();
		this.ctx.closePath();		
		return;
	}
	drawYAxisLabel(x,y,text=("("+"axis label"+")")) {
		this.ctx.beginPath();
		this.ctx.fillStyle = '#000000';
        this.ctx.font = "12px Arial";
        this.ctx.fillText(text,x+5,y+3);	
		this.ctx.stroke();
		this.ctx.closePath();		
		return;
	}
	drawXAxisLabel(x,y,text=("("+"axis label"+")")) {
		this.ctx.beginPath();
		this.ctx.translate(x,y);
		this.ctx.rotate(90*Math.PI/180);
		this.ctx.fillStyle = '#000000';
        this.ctx.font = "12px Arial";
        this.ctx.fillText(text,5,3);	
		this.ctx.stroke();
		this.ctx.closePath();
		this.ctx.rotate(-90*Math.PI/180);
		this.ctx.translate(-x,-y);		
		return;
	}
	//draws axis lines
	drawLine(x1,y1,x2,y2) {
		return;
		this.ctx.beginPath();
		this.ctx.moveTo(x1,y1);
		this.ctx.lineTo(x2,y2);	
		this.ctx.stroke();
		this.ctx.closePath();		
		return;
	}
	//Recalcuate the pixels for the canvas
	reDraw() {
		//Drawing code
		
		let gradient = this.gradientBuilder();
		let xMin = this.x_min();
		let xOffSet = this.x_offset();
		let yMin = this.y_min();
		let yDelta = this.y_delta();
		let yOffset = this.y_offset();
		let zDelta = this.z_delta();
		let zMin = this.z_min();
		let steps = this.steps;
		steps++;
		
		for (var point of this.data) {
			var x = ((point[this.latIdx] - xMin) / this.x_res) + xOffSet;
			var y = (-(((point[this.lonIdx] - yMin) / this.y_res)-(yDelta / this.y_res))) + yOffset;
			var z = point[this.dataIdx];
			var c = this.getColor(z, zDelta, zMin, steps, gradient);
			this.drawPixel(x, y, c);
		}
		
		return;
	}
	drawAllPoints() {
		let xMin = this.x_min();
		let xOffSet = this.x_offset();
		let yMin = this.y_min();
		let yDelta = this.y_delta();
		let yOffset = this.y_offset();
		let zDelta = this.z_delta();
		let zMin = this.z_min();
		
		for (var point of this.points) {
			var x = ((point[0] - xMin) / this.x_res) + xOffSet;
			var y = (-(((point[1] - yMin) / this.y_res)-(yDelta / this.y_res))) + yOffset;
			var pointText = point[2];
			console.log("("+x+", "+y+"): "+pointText)
			this.drawPoint(x, y, pointText);
		}
		
	}
	drawBothAxis(){
		//var canvasWidth = this.canvas.width;
		//var canvasHeight = this.canvas.height;
		var lineCount = 10;
		var xStep = this.canvas.width/lineCount;
		var yStep = this.canvas.height/lineCount;
		let yOffset = this.y_offset()+this.canvas.height/10;
		let yMin = this.y_min();
		let yDeltaStep = (this.canvas.height*this.y_res)/lineCount;
		let xOffset = this.x_offset()+this.canvas.width/10;
		let xMin = this.x_min();
		let xDeltaStep = (this.canvas.width*this.x_res)/lineCount;
		//this.drawLine(50,450,450,450);
		//this.drawLine(50,450,50,50);
		//draw Y axis lines
		this.ctx.font = "12px Arial";
		let textXOffset = this.ctx.measureText((yMin-yOffset*3.5)+(yDeltaStep*(1))).width
		this.drawLine(100,400,475,400);
		for (var i = 0; i < lineCount-2; i++){
			this.drawLine(100,400-(yStep*(i)),475,400-(yStep*(i)));
			console.log(textXOffset);
			this.drawYAxisLabel((90-textXOffset),450-(yStep*(i+1)),(yMin-yOffset*3.5)+(yDeltaStep*(i+1)));
		}
		//draw X axis lines
		this.drawLine(100,25,100,400);
		for (var i = 0; i < lineCount-2; i++){
			this.drawLine(100+(xStep*(i)),25,100+(xStep*(i)),400);
			this.drawXAxisLabel(0+(xStep*(i+2)),400,(xMin-xOffset*3.5));
		}
	}
	//Logic to build colour sets
	gradientBuilder() {
		let steps = this.steps;
		steps++;
		if (this.colors.length > 2 && this.colors.length == steps) {
			//to do custom gradients
			return;
		} else { return Contour.gradient(this.colors[0], this.colors[1], steps); }
	}
	//return an array of colours that progress from the first colour to the last colour in the specified amount of steps
	static gradient(startColor, endColor, steps) {
		var start = {
			'Hex': startColor,
			'R': parseInt(startColor.slice(1, 3), 16),
			'G': parseInt(startColor.slice(3, 5), 16),
			'B': parseInt(startColor.slice(5, 7), 16)
		}
		var end = {
			'Hex': endColor,
			'R': parseInt(endColor.slice(1, 3), 16),
			'G': parseInt(endColor.slice(3, 5), 16),
			'B': parseInt(endColor.slice(5, 7), 16)
		}
		var diffR = end['R'] - start['R'];
		var diffG = end['G'] - start['G'];
		var diffB = end['B'] - start['B'];

		var stepsHex = new Array();
		var stepsR = new Array();
		var stepsG = new Array();
		var stepsB = new Array();

		for (var i = 0; i <= steps; i++) {
			stepsR[i] = start['R'] + ((diffR / steps) * i);
			stepsG[i] = start['G'] + ((diffG / steps) * i);
			stepsB[i] = start['B'] + ((diffB / steps) * i);
			stepsHex[i] = '#' + Contour.decimalToHex(Math.round(stepsR[i])) + '' + Contour.decimalToHex(Math.round(stepsG[i]).toString(16)) + '' + Contour.decimalToHex(Math.round(stepsB[i]).toString(16));
		}

		return stepsHex;

	}
	//Formats the hex colour strings properly
	static decimalToHex(d, padding) {
		var hex = d.toString(16);
		var padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

		while (hex.length < padding) {
			hex = "0" + hex;
		}
		return hex;
	}
}
