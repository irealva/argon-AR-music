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
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\nYTHJK9Uo2nwRr7eW7DJYdg==\n=cD5a\n-----END PGP MESSAGE-----"
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
