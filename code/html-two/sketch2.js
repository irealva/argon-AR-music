
        $(function() {

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

          var container = two.makeGroup(background);

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
                if (j >=  cols - 1) {
                  continue;
                }
              }

              var hi = k / (cols - 1);

              var type = !!(j % 2) ? 'Squiggle' : 'Nonagon';
              var height = !!(j % 2) ? width / 3 : width;
              var shape = two['make' + type](width, height, Math.floor(Math.random() * 3) + 3);
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
              shape.step *= Math.random() > 0.5 ? - 1 : 1;

              container.add(shape);

            }

          }

          // var cursor = two.makeCircle(0, 0, Math.min(two.height, two.width) / 3);
          // cursor.outline = two.makeCircle(0, 0, Math.min(two.height, two.width) / 3);
          // cursor.target = new Two.Vector();

          // cursor.outline.noFill();
          // cursor.outline.stroke = 'rgba(0, 100, 255, 0.1)';
          // cursor.outline.linewidth = 40;

          // container.mask = cursor;
          // cursor.target.set(two.width / 2, two.height / 2);
          // cursor.translation.copy(cursor.target);

          // var center = _.debounce(function() {
          //   cursor.target.set(two.width / 2, two.height / 2);
          // }, 1000);

          // var drag = function(e) {
          //   cursor.target.set(e.clientX, e.clientY);
          //   center();
          // };

          // var touchDrag = function(e) {
          //   e.preventDefault();
          //   var touch = e.originalEvent.changedTouches[0];
          //   drag({
          //     clientX: touch.pageX,
          //     clientY: touch.pageY
          //   });
          //   return false;
          // };

          // $(window)
          //   .bind('mousemove', drag)
          //   .bind('touchmove', touchDrag);

          two.bind('update', function() {

            // cursor.translation.x += (cursor.target.x - cursor.translation.x) * 0.125;
            // cursor.translation.y += (cursor.target.y - cursor.translation.y) * 0.125;
            // cursor.outline.translation.copy(cursor.translation);

            for (var k in container.children) {
              var child = container.children[k];
              if (child.name === 'background') {
                continue;
              }
              child.rotation += child.step;
            }

          });

        });

        Two.prototype.makeSquiggle = function(width, height, phi) {

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

          return squiggle;

        };

        Two.prototype.makeNonagon = function(width, height, sides) {

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

          return shape;

        };