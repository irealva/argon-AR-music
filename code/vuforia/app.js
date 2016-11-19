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
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\nfuonUNA1gM//4YGukO/F\n=qLbk\n-----END PGP MESSAGE-----"
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
