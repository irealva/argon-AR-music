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
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\n=MFKc\n-----END PGP MESSAGE-----"
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
