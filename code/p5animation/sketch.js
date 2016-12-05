var tileCount = 12;
var rectSize = 50;

var actRandomSeed = 0;

var width = 320;
var height = 568;

var x = null;
var y = null;
var t;

function setup() {
    createCanvas(320, 568);
    background(255);
    t = 0;

    // frameRate(10);
}

function draw() {

    colorMode(HSB, 360, 100, 100, 100);
    background(360);
    smooth();
    noStroke();

    fill(192, 100, 64, 60);

    randomSeed(actRandomSeed);

    

    for (var gridY = 0; gridY < tileCount; gridY++) {
    	// x = ranNextX(x);
  			// y = ranNextY(y);

  			x = width * noise(t);
  			y = height * noise(t+10);
  			t = t + 0.001;

        for (var gridX = 0; gridX < tileCount; gridX++) {

            var posX = width / tileCount * gridX;
            var posY = height / tileCount * gridY;

            var shiftX1 = x / 20 * random(-1, 1);
            var shiftY1 = y / 15 * random(-1, 1);
            var shiftX2 = x / 10 * random(-1, 1);
            var shiftY2 = y / 6 * random(-1, 1);
            var shiftX3 = x / 10 * random(-1, 1);
            var shiftY3 = y / 6 * random(-1, 1);
            var shiftX4 = x / 17 * random(-1, 1);
            var shiftY4 = y / 22 * random(-1, 1);

            beginShape();
            vertex(posX + shiftX1, posY + shiftY1);
            vertex(posX + rectSize + shiftX2, posY + shiftY2);
            vertex(posX + rectSize + shiftX3, posY + rectSize + shiftY3);
            vertex(posX + shiftX4, posY + rectSize + shiftY4);
            endShape(CLOSE);
        }
    }
    // console.log(x,y);
}

function returnRan() {
	return Math.floor((Math.random() * 20) + 5);
}

function ranOne() {
	var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
	return plusOrMinus;
}


function ranNextX(int) {
	if (int === null) {
		return Math.floor((Math.random() * width) + 1);
	}
	else {
		var temp = int + ranOne();
		if (temp < 0) {
			temp = 0;
		}
		if (temp > width) {
			temp = width;
		}
		return temp;
	}
}


function ranNextY(int) {
	if (int === null) {
		return Math.floor((Math.random() * height) + 1);
	}
	else {
		var temp = int + ranOne();
		if (temp < 0) {
			temp = 0;
		}
		if (temp > height) {
			temp = height;
		}
		return temp;
	}
}


// void mousePressed() {
//   actRandomSeed = (int) random(100000);
// }