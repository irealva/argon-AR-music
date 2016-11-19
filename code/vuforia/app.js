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
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\nwcFLA+gV6pi+O8zeAQ/42xoNVRjVxF2H5ZZ9LJ7cfIef4jUZ80wkOBPmrmLE\nedqM/GVz0JNQVH/FETIAyPtwL/kgqQQ9JLfdh43oByJ0d8+if8LSavBNlB4p\no7otBi11v88P75lLnXlUN0lsrs3apT8LJUqKLmtSH3pxDlbJxYjDzvXbAmQ6\n1QOqNVQipxE9Txb+aySua2H41QWAiy8YpYNR9pOfnZjop/IQjcEhMpxaPoHv\nXeDzgs7QwLdu/rA3Zv+dPsFOHbb2QjISyOdRFAoVUGhgiwUdypWb4FDKw5P1\nZfyV5OPzi8TCA2LKrcL9V1gnFMvCv9ckWg6+sTryNRrcpbSbDt7ih1Ub9lI2\nYPMUZdzcT02uuJB25UQ9jyMDdzgZfapWx+/01yavnqWkZzfU8DLhyRCy4ZeA\nhPDRlU5mj+3vua37z0PefMqoGZu0KVb97XBRdn1x1MsyMFOqY1KtVux/dmsR\n1zSSx+z9NDZkkNgy2YaCHR1CtDtAnfc6vsFJJVSck7VsYtjeUXrVksjnMv17\nohJkqQ+zWfkqEovG4/Dnlb6ELIOKkFB3cCXmOUQENzrRm/xy7j8w/RyBMtYn\n9ujBTb9X1AG+Ev5F4CnF0D++wQJ8Jx4ByhaaKIHRnuH+oISeEywzwUlEw5lg\n4qb1ZXSZxdrWHR+aQ7sJtRxMG7aQjFWQFmEDln/rbMHBTgMAafV6cZPNrRAI\nAJNcxi/upnM01zYeCkf/dlapwCb6RNT5m9Sd0LiqrZmSSWUUC6AcT555rU+i\nosL/agfchIedr+39umEf5E2bjH/9DYJTGfKGsSNcuPQl52+xdph24Lt6dfWV\nawDQUtbZghGh0xYkZGiaWOXvkHOy376pn92JSLu8E3rWANCmaZKNK5OnL0tA\nU/6JU3QICVGeSGt0RoTVVtuDda6WajsQvDo2c/jgrGzt7dQEiADJ3Oyta6LJ\nWpYmrvMZmIw1RjOVbRwGaQnKnEzs3GoYACAnml80ohP99+pRDVuVX1CQTmjI\nEpNexQEWiPz35Z51TNXJFqB1leiOb93UDzVDuuZ0WZEIAIoP84kQXeZwJ/yz\nOVBmERm5ppEDY6f5Dk8SdKR/mcaIebsO6KKPK69BvJhPSSHBmx37huBxw5Y+\nOCzriNw+cUFc4JbjHq5XMo+Mkjy5yrjCuihrSHaQtclUMWFisLMN7s4Qv0td\nPYdPgiAOPw0A62HV/R36NrMjQXMDjFuB7HO5MUpfDKdJniqg5N9Nj6KkstmS\naAlPLKsaICoD7Bq/HdEbxgiItZOwz9Br6ufKdnwEaTpYf9uDbqpRTPiZsozR\nLQSzRYdeIqlbMK0I5k9s5rqcfQz8rfOVPtqwNgyxpV9X/LVtX031c07IOZn/\n/qR2hHRWrUsjXIJ3xHJYdA5ZugHBwUwDju235GExYfIBD/9r2APUL+siGQR0\nF0RhJjTuk5i6MSOUg6nFwzHWQzJ4hvg1uHb0ZpOtCmN6ZNN8LY4zwKVarmLL\nN8rP7hFfKA7fKNEs/HtvmhPo7rfUvj3Nj9MhzP6HS7EdmTucX43zDdFM8qwa\ndgXUTqRqRTM9A9MMJw27CvUfBeEdrhKysZ1P0MboUd9YKim/9AVSoFUDMcVw\nVWYqQxeLf2tTVxdnlUK3pC0yVYD46QdYaWALaeLOwPY2ld9G6ntboROzbx+Z\nS6tQQjO0okWS0jGGsI5bScGP5yTVzOStM61UPMNJVok7Pv8pqSDI537c9KDf\npf1zxbNkli2Vb/+l619slpmPv5JckJvQ/OsKgfA1vKpB5KATnuhJiaZDVrfZ\n0uyldLuzpzXck/fNThBL1bbP1ICbaTyXAAnrL23unLmfd9OG1NXPSAgVqvQW\n7YncFd2Ad9fRDxC/xmb8T+VkIkV2bX64G5TL+Y/Tr70nmef+TBeiNGME0wcU\n01hSpY5ngpO0pow8YT19JixpUsLFi+NDTEmaglDTsKQUKase7PwB1vZx3iP+\nlXbZq3aEMVLQiCDUvzT/8f8tvIMQksx+47qxwwtdJ7/+wdXKP2CdLjERyNeG\nVznKn1gZLlk0m9vlGVYx9QVN3lQYk++AkVb5FgjGilBr5SnET5lk5vyZPzWm\nW2s8+DNh39LBRwGxECoYy6CUacm9hTMKQhEH/R1m3Ikdt/YUVZc4VTtMSW/V\noOT9zkG5Xa436tjrpIwP/1TP1XHieI8pGpCeBfmuSSdlhQHlyxfoEJtJDXoZ\ndxWhIrTjyDtE3l0Bj3t4vs7mujK7GqKBNDyJehfSS6+xpV9XEHzD0QEHM4dn\nutvLVvqwQC80JgRPs48YZi8OJheVRsnEUOkL9H2ir8cKzMsL0to9z5iWE4c/\nw24cVRMnCo/FHRvZTFdl2J3FONOIaftFBtodUzGAj0OofOA5aOf7rsOSv3Ce\nawR4QvdWnk2yOzn9Qt7YN9TdRcu/BlKVg2tL3sM6+O4cGtwuWjg3SGhzhPZH\nnQT1QA6YM8W9zXEYjCqXv/eaiNMQpML6LC7LljD774/Y/wZR+AhwgcPwjBqW\njfHHuyM+ZZdjdmc9qONt6JoZkJ4LHaSuGEsmJU4eBuNKAhhyU5TyduL0k1G5\nwMRhBNOSrdO9a4phSq0sQv7T3uCqsagGdS0uF7pORT6WVtF5M8RYRqfTo+/J\n5xuMnazik8U3pWSGoC5YoBBpsmKD7K8zXv43FGqaJbUgKqycTDifboF92FSP\nBQ/EgNvRxDSWHOz1amfufw6gGHUuXdL6JQ+XSoYqP+0Y5bPRswE/+Va4PLyO\n620A1pr34OAV7vKEAwGegLfEzA794Mzhw742HSszTWHXzw==\n=YCMw\n-----END PGP MESSAGE-----"
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
