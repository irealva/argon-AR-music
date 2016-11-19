/// <reference types="@argonjs/argon" />
/// <reference types="three" />
/// <reference types="dat-gui" />
/// <reference types="stats" />
// set up Argon
var app = Argon.init();
// set up THREE.  Create a scene, a perspective camera and an object
// for the user's location
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D();
scene.add(camera);
scene.add(userLocation);
// We use the standard WebGLRenderer when we only need WebGL-based content
var renderer = new THREE.WebGLRenderer({
    alpha: true,
    logarithmicDepthBuffer: true
});
// account for the pixel density of the device
renderer.setPixelRatio(window.devicePixelRatio);
app.view.element.appendChild(renderer.domElement);
// to easily control stuff on the display
var hud = new THREE.CSS3DArgonHUD();
// We put some elements in the index.html, for convenience.
// Here, we retrieve the description box and move it to the
// the CSS3DArgonHUD hudElements[0].  We only put it in the left
// hud since we'll be hiding it in stereo
var description = document.getElementById('description');
hud.hudElements[0].appendChild(description);
app.view.element.appendChild(hud.domElement);
// let's show the rendering stats
var stats = new Stats();
hud.hudElements[0].appendChild(stats.dom);
// Tell argon what local coordinate system you want.  The default coordinate
// frame used by Argon is Cesium's FIXED frame, which is centered at the center
// of the earth and oriented with the earth's axes.
// The FIXED frame is inconvenient for a number of reasons: the numbers used are
// large and cause issues with rendering, and the orientation of the user's "local
// view of the world" is different that the FIXED orientation (my perception of "up"
// does not correspond to one of the FIXED axes).
// Therefore, Argon uses a local coordinate frame that sits on a plane tangent to
// the earth near the user's current location.  This frame automatically changes if the
// user moves more than a few kilometers.
// The EUS frame cooresponds to the typical 3D computer graphics coordinate frame, so we use
// that here.  The other option Argon supports is localOriginEastNorthUp, which is
// more similar to what is used in the geospatial industry
app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);
// create a bit of animated 3D text that says "argon.js" to display
var uniforms = {
    amplitude: { type: "f", value: 0.0 }
};
var argonTextObject = new THREE.Object3D();
argonTextObject.position.z = -0.5;
userLocation.add(argonTextObject);
var loader = new THREE.FontLoader();
loader.load('../resources/fonts/helvetiker_bold.typeface.js', function (font) {
    var textGeometry = new THREE.TextGeometry("argon.js", {
        font: font,
        size: 40,
        height: 5,
        curveSegments: 3,
        bevelThickness: 2,
        bevelSize: 1,
        bevelEnabled: true
    });
    textGeometry.center();
    var tessellateModifier = new THREE.TessellateModifier(8);
    for (var i = 0; i < 6; i++) {
        tessellateModifier.modify(textGeometry);
    }
    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify(textGeometry);
    var numFaces = textGeometry.faces.length;
    var bufferGeometry = new THREE.BufferGeometry().fromGeometry(textGeometry);
    var colors = new Float32Array(numFaces * 3 * 3);
    var displacement = new Float32Array(numFaces * 3 * 3);
    var color = new THREE.Color();
    for (var f = 0; f < numFaces; f++) {
        var index = 9 * f;
        var h = 0.07 + 0.1 * Math.random();
        var s = 0.5 + 0.5 * Math.random();
        var l = 0.6 + 0.4 * Math.random();
        color.setHSL(h, s, l);
        var d = 5 + 20 * (0.5 - Math.random());
        for (var i = 0; i < 3; i++) {
            colors[index + (3 * i)] = color.r;
            colors[index + (3 * i) + 1] = color.g;
            colors[index + (3 * i) + 2] = color.b;
            displacement[index + (3 * i)] = d;
            displacement[index + (3 * i) + 1] = d;
            displacement[index + (3 * i) + 2] = d;
        }
    }
    bufferGeometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    bufferGeometry.addAttribute('displacement', new THREE.BufferAttribute(displacement, 3));
    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: "\n            uniform float amplitude;\n            attribute vec3 customColor;\n            attribute vec3 displacement;\n            varying vec3 vNormal;\n            varying vec3 vColor;\n            void main() {\n                vNormal = normal;\n                vColor = customColor;\n                vec3 newPosition = position + normal * amplitude * displacement;\n                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );\n            }\n        ",
        fragmentShader: "\n            varying vec3 vNormal;\n            varying vec3 vColor;\n            void main() {\n                const float ambient = 0.4;\n                vec3 light = vec3( 1.0 );\n                light = normalize( light );\n                float directional = max( dot( vNormal, light ), 0.0 );\n                gl_FragColor = vec4( ( directional + ambient ) * vColor, 1.0 );\n            }\n        "
    });
    var textMesh = new THREE.Mesh(bufferGeometry, shaderMaterial);
    argonTextObject.add(textMesh);
    argonTextObject.scale.set(0.001, 0.001, 0.001);
    argonTextObject.position.z = -0.50;
    // add an argon updateEvent listener to slowly change the text over time.
    // we don't have to pack all our logic into one listener.
    app.context.updateEvent.addEventListener(function () {
        uniforms.amplitude.value = 1.0 + Math.sin(Date.now() * 0.001 * 0.5);
    });
});
app.vuforia.isAvailable().then(function (available) {
    // vuforia not available on this platform
    if (!available) {
        console.warn("vuforia not available on this platform.");
        return;
    }
    // tell argon to initialize vuforia for our app, using our license information.
    app.vuforia.init({
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\nwcFMA+gV6pi+O8zeARAAsBbtRPSNVmfFo66jyyzus00VjSuOIJCmD/dQX9Vs\nBU1bqe9SCva0DMifO/xWcgZ6NTtOfVlUMvf6ZmTvCj1QlOJZ9vCICDduSW/b\n/GVH0LRHszJQa4LI3NKZgyHbSjUE8OzDED6m2SUypXtGQ6HmaanWfRyKPyNI\nBX+4k47ejS4s4jaKg3gsphM8y7/ht8qoOm9TXMlW+O0LKhoq8En7O+90udu6\n9UvgemoQR/NaY5JyC/DfYmwuBmMHS2sxJMEC9Zy/0DJXC2J3tVSxjoY4zM3N\n7tcJdU06V4eaVsYxEFfM790moS3xIA9Xg0QD7s5Qt8CTWqDc4lzxQQC+Yjmt\nsahTT3PW+PDOwREssT5pIO4mICUDQDfHfr88R6eSdz2wbznyewXjyCTD8cPE\nVc4OoP0ws3MJ/KvXQJzrTV9P/Z46aL8UUF8g7ZlTkIC91dVtVnJTsduQa8qP\nRYYOX/qqCDSvV9uhwEwtcHBYeb7HPqKDrpuTFRJbRAHgalWPWJGOg4kg9OWW\ngzHMgluROY2uZP223gjlL/Tn1t0QgxttgAuiuzvTYxuYZ+KTxZWpzsP6fs5g\nOesaE3adhY1aCJHs//If+p5E/C2AmOAe1enkzL5fkg5KjV4A1lkHbZwR81HP\noSds1U9E2ahc4lNQvAI/ix6fVxUujrkH8R0VgMweXlnBwU4DAGn1enGTza0Q\nB/0YWqDqRpUiyWiUAbUoiU3BYCE4W2CQPRiuBLjaiDPMmJDxxSUnTuV9u43+\n15tD3ibe4j9azavNEddwYBKKabSlKrKRk3hm9D63fFkPGQ0KZ9yy6nTP0qnw\nwF/c7da5vnvDeHyY1DW1Pt5Mm0Tv4v8PFTaguwbSg+tKydzNFwehXEnWms5P\nToUPuj8qWRgzCwYORuvK+kC26SM0u0SlmKcq0VmqRmuM1zB8BiUWJHqCyhmH\n/FRz3s/gsXXs5qJvZBgIzm/jtbAYWJuHeyJ3X+qM+fO/cDSXGg1SnVzsxZBE\nS/mhA+XpYdb1jue7jx7WcM1L9XGkfcBREtikgnh8kvyVB/9OtKq0LLg7FY0f\n7bFXtNt6ok8dhb3zkZZTVkN2fgcxlU+coutPKhd7hi/1ayXvuMSs4y31KB3K\nDZIMOKjBw5rJfHpH2xlnDMD1QZqsQ9+hvVWNhFq2DevZv4dzquMz2YlwJiBH\nT+JA8hCLPkQ99rm5IJut6TXa9vDEOan/kSXUUrCcKcbAMTReSnkg+AX4xlA8\ni9e9QJeWpRcxxg6GaICafBlJiWEf336g+WV8TnXxMl7eeCC+Sm8ZE8Z1fotC\nvftKNsa7avvhjzzn7K6dS1EU3HMh3KNRS/VXPUeqYTY6TTzr8ZhABwPzqrxQ\n0sj3suDdedd4I5ph0PqxD6qZJ1uWwcFMA47tt+RhMWHyAQ/+N6UPFAVFfIeb\nsVBl366Fm3eZmWZK+2B32aXdcr3VdpcpRiHyYnGqPRJwa8n5RSPqODrXirwo\n68Lf/H55PIBnuAK7uTGgHw8RliD0YpwM6DI1XaX+GHonZ1KN8JNy0UyAtNQZ\njpfznCh3NeEJHNFBhvjNWCYxKulwMo0MQcgQbIrxLzRMh6j/9Q7Mq8JmNFcY\ntVY9pqHm05D3pHhRo9Hzyj0o7O/cIrSS6hII3ruuEUFFDVNL2Ks7GwP0i5y5\nEuweoBc1d26/4HgtF2gTbbO3Fgv9cFKnItSIvQutsVefLj/rU7fSJLLrpNaB\nGxD70Hvt2JzgP7gZQWLEeOl22ylSDCI0P8N9LAAzPMJdl0zgUrydS78mUYlJ\nEqfZxzskO9J24hw3Bt5LpQgHgSzT7vZVFLW4VucwnDw9K2AOkyPfyFxj+rYn\n1Sl2xzfObPfP8gutGMVrgJ1muFTcOc0qfUrW/euDHiA/li/+lF/RmdrQuwT6\npXkoM9ewBZVr4OWQ3b0Tyr+KkVF1FD7MhFHLJ1HCxthqvwOyKMsYdkqWaLfZ\n+UTa/5a89pJ2xp7uSVYLXmxCflmxY5i6NSiY4somo/2bJ20hYIEI6pgnQ64I\niurQXSrnUlwd7OdcwnN8+LknvTu4WMAR4odyCbe2HbRru7QrBQWjXMr+UN0c\nAzZNmotGobvSwUQBYvFe9QbvqOFjf1y5QBTHetrGZ/cMLxOiPMrxWH/jSyIo\ncvVY0L8eY0sREFENDHje8aH/zPRXCmmD3la2MNc1eGtRAZ45zq3Yc1j8vTvY\nnj8skepBxwfpe3jGLiTTe6YHtZVZsRb2rBK+W9ZUyzx519MZ24B20DmnKZNC\n5F4cOSHzv8TK9z2xJkqiLkahU0GLg6d782Hw/kFJ3cbcH6tMM4K1XvSabHYY\nCdvS/3q5qZR3jNtOu+fs2Bv0HVg5vGRPu3Kv0uGQwJWQXDlStD6EGqVnz1of\nBRhful876SeBURa3LtQvDMev+yd5vDnxhoHiyMzWt2jS2rZ0696Iy9pHkB/R\nbP6+Z+vRdTeC1SHjOPUP0bzJrtkfRdg7E8KSlVM/62DfUEU6pefZ9gf51yun\nBTO6iWi13Gy6IV3x7KIFIr/0CqwJf9Z7x2MKLAfTu3UVLFYMVGzZP9l5VXZW\n6F/qQ2uUNsj5ek5wL+HLxZdSk2pLmLxdz2v4CimVTzBiZB5MfWD+COevVp5K\n3e8em7mpSyXC/RcaoA0SHjbxX3VRLt3sbWPLHb5CKlCyrNYQQmOPKXa4I7M5\ng1xK9ruZpJU2FkvIp4de03tzAULu51sCvVPouEjNlJMbjyqj47Uc3Cs+xVkf\nbtQ2PA8uHJT0igOij/rcj5aX6Z4jVYf+lVYP6GJuK0A=\n=eYMH\n-----END PGP MESSAGE-----"
    }).then(function (api) {
        // the vuforia API is ready, so we can start using it.
        // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
        // in the web directory, even though we just provide the .xml file url here
        api.objectTracker.createDataSet("../resources/datasets/IxDMusic.xml").then(function (dataSet) {
            // the data set has been succesfully downloaded
            // tell vuforia to load the dataset.
            dataSet.load().then(function () {
                // when it is loaded, we retrieve a list of trackables defined in the
                // dataset and set up the content for the target
                var trackables = dataSet.getTrackables();
                // tell argon we want to track a specific trackable.  Each trackable
                // has a Cesium entity associated with it, and is expressed in a
                // coordinate frame relative to the camera.  Because they are Cesium
                // entities, we can ask for their pose in any coordinate frame we know
                // about.
                var gvuBrochureEntity = app.context.subscribeToEntityById(trackables["bluestone"].id);
                // create a THREE object to put on the trackable
                var gvuBrochureObject = new THREE.Object3D;
                scene.add(gvuBrochureObject);
                // the updateEvent is called each time the 3D world should be
                // rendered, before the renderEvent.  The state of your application
                // should be updated here.
                app.context.updateEvent.addEventListener(function () {
                    // get the pose (in local coordinates) of the gvuBrochure target
                    var gvuBrochurePose = app.context.getEntityPose(gvuBrochureEntity);
                    // if the pose is known the target is visible, so set the
                    // THREE object to the location and orientation
                    if (gvuBrochurePose.poseStatus & Argon.PoseStatus.KNOWN) {
                        gvuBrochureObject.position.copy(gvuBrochurePose.position);
                        gvuBrochureObject.quaternion.copy(gvuBrochurePose.orientation);
                    }
                    // when the target is first seen after not being seen, the
                    // status is FOUND.  Here, we move the 3D text object from the
                    // world to the target.
                    // when the target is first lost after being seen, the status
                    // is LOST.  Here, we move the 3D text object back to the world
                    if (gvuBrochurePose.poseStatus & Argon.PoseStatus.FOUND) {
                        gvuBrochureObject.add(argonTextObject);
                        argonTextObject.position.z = 0;
                    }
                    else if (gvuBrochurePose.poseStatus & Argon.PoseStatus.LOST) {
                        argonTextObject.position.z = -0.50;
                        userLocation.add(argonTextObject);
                    }
                });
            }).catch(function (err) {
                console.log("could not load dataset: " + err.message);
            });
            // activate the dataset.
            api.objectTracker.activateDataSet(dataSet);
        });
    }).catch(function (err) {
        console.log("vuforia failed to initialize: " + err.message);
    });
});
// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.
app.context.updateEvent.addEventListener(function () {
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
    var userPose = app.context.getEntityPose(app.context.user);
    // assuming we know the user's pose, set the position of our
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    }
});
// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.addEventListener(function () {
    // update the rendering stats
    stats.update();
    // if we have 1 subView, we're in mono mode.  If more, stereo.
    var monoMode = (app.view.getSubviews()).length == 1;
    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    var viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);
    // there is 1 subview in monocular mode, 2 in stereo mode
    for (var _i = 0, _a = app.view.getSubviews(); _i < _a.length; _i++) {
        var subview = _a[_i];
        // set the position and orientation of the camera for
        // this subview
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera.
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        // set the viewport for this view
        var _b = subview.viewport, x = _b.x, y = _b.y, width = _b.width, height = _b.height;
        renderer.setViewport(x, y, width, height);
        // set the webGL rendering parameters and render this view
        renderer.setScissor(x, y, width, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
        // adjust the hud, but only in mono
        if (monoMode) {
            hud.setViewport(x, y, width, height, subview.index);
            hud.render(subview.index);
        }
    }
});
