var container;
var myShape;
var content = document.querySelector('#myP5');

$(function() {
    // LOAD SVG
    var svgObject = document.getElementsByTagName('object')[0];
    console.log(svgObject);

    svgObject.onload = function() {
        var mySvg = svgObject.contentDocument.getElementsByTagName('svg')[0];
        console.log(mySvg);
        console.log("loaded");

        // mySvg.onload = function() {
        //     var myShape = mySvg.contentDocument.getElementsByTagName('path')[0];
        //     console.log(myShape);
        // }



        var two = new Two();
        myShape = two.interpret(mySvg);
        myShape = myShape.children[0];
        // console.log(myShape);

        sketch();
    };

    // END LOAD SVG 
});

function sketch () {
    // function createSketch() {
    var colors = [
        'rgb(0, 191, 168)',
        'rgb(153, 102, 255)',
        'rgb(255, 100, 100)',
        'rgb(0, 200, 255)'
    ];

    var type = 'svg';
    var two = new Two({
        type: Two.Types[type],
        fullscreen: true,
        autostart: true
    }).appendTo(document.getElementById('myP5'));

    var background = two.makeRectangle(two.width / 2, two.height / 2, two.width, two.height);
    background.noStroke();
    background.fill = 'rgb(255, 255, 175)';
    background.name = 'background';

    container = two.makeGroup(background);

    var rows = Math.floor(two.height / 100);
    var cols = Math.floor(two.width / 100);
    var width = Math.round(two.height / Math.max(rows, cols));

    for (var i = 0; i < rows; i++) {

        var even = !!(i % 2);
        var vi = i / (rows - 1);

        for (var j = 0; j < cols; j++) {

            var k = j;

            if (even) {
                k += 0.5;
                if (j >= cols - 1) {
                    continue;
                }
            }

            var hi = k / (cols - 1);

            var type = !!(j % 2) ? 'Squiggle' : 'Nonagon';
            var height = !!(j % 2) ? width / 3 : width;
            var shape;
            // if (type === 'Squiggle') {
            //     shape = makeSquiggle.call(two, width, height, Math.floor(Math.random() * 3) + 3)
            //     // shape = two['make' + type](width, height, Math.floor(Math.random() * 3) + 3);
            // }
            // if (type === 'Nonagon') {
            //     shape = makeNonagon.call(two, width, height, Math.floor(Math.random() * 3) + 3)
            // }

            // shape = cloneNode(myShape);
            // console.log(shape);

            shape = myShape.clone();
            shape.id = '#two-' + i + j;
            // console.log(shape);

            var color = colors[Math.floor(Math.random() * colors.length)];

            shape.rotation = Math.floor(Math.random() * 4) * Math.PI / 2 + Math.PI / 4;
            shape.translation.set(hi * two.width, vi * two.height);

            if (j % 2) {
                shape.noFill();
                shape.stroke = color;
                shape.linewidth = 4;
                shape.cap = 'round';
            } else {
                shape.noStroke();
                shape.fill = color;
            }

            shape.step = (Math.floor(Math.random() * 8) / 8) * Math.PI / 60;
            shape.step *= Math.random() > 0.5 ? -1 : 1;

            container.add(shape);

        }

    }


    two.bind('update', function() {
        for (var k in container.children) {
            var child = container.children[k];
            if (child.name === 'background') {
                continue;
            }
            child.rotation += child.step;
        }

    });


    /* SAVING SVG STUFF */
    two.renderer.domElement.addEventListener('click', function() {
        window.open('data:image/svg+xml,' + content.innerHTML);
    }, false);

}

// createSketch();

function removeSketch() {
    console.log("removing two js sketch");
    container.remove();
}

function makeSquiggle(width, height, phi) {
    var amt = 64;

    var squiggle = this.makeCurve(
        _.map(_.range(amt), function(i) {
            var pct = i / (amt - 1);
            var theta = pct * Math.PI * 2 * phi + Math.PI / 2;
            var x = width * pct - width / 2;
            var y = height / 2 * Math.sin(theta);
            return new Two.Anchor(x, y);
        }),
        true
    );
    // console.log(squiggle);

    return squiggle;
};

function makeNonagon(width, height, sides) {
    width /= 2;
    height /= 2;

    var shape = this.makePath(
        _.map(_.range(sides), function(i) {
            var pct = i / sides;
            var theta = Math.PI * 2 * pct - Math.PI / 2;
            var x = width * Math.cos(theta);
            var y = height * Math.sin(theta);
            return new Two.Anchor(x, y);
        })
    );



    
    // console.log(shape);

    return shape;
};


function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        copy[attr] = obj[attr];
    }
    return copy;
}