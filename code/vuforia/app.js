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
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\na5yiuYgPRTfCkgER3xgp\n=LqFV\n-----END PGP MESSAGE-----"
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
