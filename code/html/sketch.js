// console.log(HSB);

var s = function( p ) {

    var tileCount = 12;
    var rectSize = 50;

    var actRandomSeed = 0;

    var width = 320;
    var height = 568;

    var x = null;
    var y = null;
    var t;

    p.setup = function() {
        p.createCanvas(320, 568);
        p.background(255);
        t = 0;

        // frameRate(10);
    }

    p.draw = function() {
        p.colorMode('hsb', 360, 100, 100, 100);
        // p.colorMode(0, 100);
        p.background(360);
        p.smooth();
        p.noStroke();

        p.fill(192, 100, 64, 60);

        p.randomSeed(actRandomSeed);

        for (var gridY = 0; gridY < tileCount; gridY++) {
            // x = ranNextX(x);
                // y = ranNextY(y);

                x = width * p.noise(t+10);
                y = height * p.noise(t+20);
                t = t + 0.001;

            for (var gridX = 0; gridX < tileCount; gridX++) {

                var posX = width / tileCount * gridX;
                var posY = height / tileCount * gridY;

                var shiftX1 = x / 20 * p.random(-1, 1);
                var shiftY1 = y / 15 * p.random(-1, 1);
                var shiftX2 = x / 10 * p.random(-1, 1);
                var shiftY2 = y / 6 * p.random(-1, 1);
                var shiftX3 = x / 10 * p.random(-1, 1);
                var shiftY3 = y / 6 * p.random(-1, 1);
                var shiftX4 = x / 17 * p.random(-1, 1);
                var shiftY4 = y / 22 * p.random(-1, 1);

                p.beginShape();
                p.vertex(posX + shiftX1, posY + shiftY1);
                p.vertex(posX + rectSize + shiftX2, posY + shiftY2);
                p.vertex(posX + rectSize + shiftX3, posY + rectSize + shiftY3);
                p.vertex(posX + shiftX4, posY + rectSize + shiftY4);
                p.endShape(p.CLOSE);
            }
        }
        // console.log(x,y);
    }

    // function mousePressed() {
    //     console.log("remove");
    //   remove(); // remove whole sketch on mouse press
    // }

    // function keyPressed() {
    //     console.log("redraw");
    //   if (keyCode == UP_ARROW) {
    //     setup();
    //     redraw();
    //   } 
    //   return false; // prevent default
    // }
}

var myp5 = new p5(s);

