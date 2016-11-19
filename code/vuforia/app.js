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
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\nwcFMA+gV6pi+O8zeARAAu2WUhnQQ9oSFcApLVkYZgeo5EeHwN4zWnxz49dHh\niGLVwqzdiA3OngdaAuJOoXq8BGLhzX55tVQf+lDilTwfItB0LHR3SBtRGdbb\ntg+XTyhKTRmKEQ7W8GV5iZ9KGl6ECtzxsi922zvvB2oLlxr28PHn3fSIjelR\nub3yDUstQ0vxjKHLCx/dTqDwtUclBmczyIgLLxERLTCbxXNocw24HkMoDxLX\nmb4ZmOA17uj3sH05fjve0m0zSOybcXPHJ0+G/RFoWj2T/io0cUmvmZLiiLOX\n7EMeh1daBI6aR3ijhYRkfnDilWlUjdjipHOkAuoIDp7AKaHsIsvzdGlrLPOL\nB8VwCtAkgRK/v4MksLhuaxu2ofj+O+2hjwk71WlXtGNbUzYvV3DORXxW1m7b\nEaY8IncUOTVk3XbaLKILQvSXYh8AqmpbXTFi84XVooUnVXXvptcOYOSil0qH\nZbvXRELcFZixVdITa2G4vvDMFca0qQm0MqwQuNc0Q8zzYGhhF03BRatspBk9\no72zwykTrJ4LyOWvhL82uojTuw2+BV7zyi11vdThObgbXcEtlnyVCjFnTHq8\ntc3ZcmLv+AsYXOljaapFuoWCcmGyMtoXHgg5pqq6S2rQNmVzjq6Qxfrk24nS\nfVm6KLeGT0bwDht8cVSBBuI9A1ewfIjQcr9YMSeg2y/BwU4DAGn1enGTza0Q\nB/9i4a6L4xSKwmBDzzoQhnMMcjHRKbyR2BjpNXC6IfJ/qFghumqRz0uXLAy4\ns2e2Qb4gw2jeUswZWhfn4L20vIQoTBce/635PcFkaBoWqALg8747ZGPlx6CZ\nRf0mKXFIKl8nT5pO6B4AVRwxZ6JsUk2g8GRmC6+cDwghroS/BSTFeRiZ4ned\nnpVaF9n/6M5NgJabHtsMADyKH/p9C1bMsj/7bQxpTIH/eK/P54YzQxjqwbxM\nlpC/vLzJftklHdQ8sFZxxuGcT5oSKOAcZJjnVj8lYzzwg587jnVMLXXedGf2\nPe/yYr3O3JHaZ3dO3i25/CiDtgKn0s0Nkuj3erCTQ7C/CACPvrnBSDYEC1v0\nRZ3xoFgOGaiYVjOMGwe/CU+4Rai8VDK6Y4BA2cS+CGAJcEpa/jrDoRswrkaC\nk6kC5JFwPra1EOsS3nQAa2E+wY8Xm+gg2mMBZoJx2C3t8bK6oZH2JbbrwWoZ\nFAKRv5KyorGyArcjqpicBsqatKnNyneo80BeljUKxuzJfHVC8mhZULp5tLDo\ns0JTfcfOEi3nwP0cmIAyJkxHjY1B3bH5uCoixJEOI4GzwhzklvycHo9d8MwK\nS2NArXyIShHUXqznit1dDimQeik/QQjolMa555vX8J5HBCSPKGzudrGikROx\n57Vy1+u0VLtSgpUJTH+7OKBsHmq9wcFMA47tt+RhMWHyAQ//bRLzI69W79YF\npR8ljjNTtlALcil3khHAbGVt3y6D7mOoshsyCWUUEyHy1jeaF96hFEyyoAmA\nVVabW7vxzHDlqvIP9Wv5lG4ikKh52RRJIMitKOEJYcIcEbjon6KrN1GrzcS0\nMWY8BLNVCpwHO+1f91e2RkhbpW86mhSdzpqOjOVpOln9OWafmOgaK9fSKloF\nswTGrsQppcA5+NRHVdg8bbeEGHBo0P0ZLedt5U0NYcbc1KtLuH2UXe7Rta99\nTZA2WWv1kNdAIzdtep/4miMIplXd+wGLE60UlfUKjMFa6aaTljZJg2+eyod5\n4+OdBP9PC2xF7tUA/P7rnYyMXEkKMro864LjOmXAGPg0jLVdZIFDKECfZt/e\nw0yVbTqNupHSU8/NZdZRXRQyo5wJqJ1Sl0B40hpFNuevA31Jom7QUY13+8dn\nD0ssfzno5E2cNT3ujMI5FyvGn0IfmmQkv7hUq5xcT0RmhVrJ+xlqNYX47u2x\nUYvxa8o+8TxBpoWdx3ycEbezUSDFv43H3e1xM9/zdv7pQzmDkovpEtGwBTLr\ntrg9GnAc6/0ZSOfci8bcYf6n0SWDlOW6SuA/W7lZD55pHvk+iVIyjEtD+j3/\n25/3yfPf63xqzSHrO7iYpQgnhFutUwgRXWdIP1wEsEbQZgSE1r+JxGTWg+SS\n4ErMoLSS89TSwUwBmxMnhf2QsHbYZBuXsWNSGZq7OrFixv11zIE81APtlyYg\nA9OeXhwTthagx3nL8YswPmfRLTq5iNbBXgeSTVNX1JNSEpOeMYDU/Wen+bN1\nXr+tmZIefNlPnSaR/dhCrWFNPsbt9JhJdTCNCCGdGG2D58kaIINi24cSmhaO\nVUzVIeN9Ysxi4LGLara9752kzgTee/9QP4/BHF+UZUTtpZ9n56oRy+ZAQNkE\n4Nt6X0dcO6q2myz0rxCUMDC/Q2J5w2Bq1kXGrT03+CE/hhkBro45Cth7RFiQ\nkKycJHgNk19nuDP4FvsujDW3mfQFMK9etDGBe1pPKwRVNMKyTathRP2jcpiB\nxpje2snZKGsNBNtZzl1IW0c0AlNZfTNatCl7nu190Y6KJ2YFG+gVVDe3Tf0J\nqP4AkgLUXBDl1ZYIACXLsUPCX6odt9xSscSApNetHgsVyu3sW4XzN9yPtgWw\nCTLom7VHV0fuyVQ5OitqkSDt7j/DL8XOePtuH0Wa3qYNVCCi1oNRNYOd69dh\nPg6qEER7Zylu1SGLACY82t5P0NZluhH48lgpq1mLZHSVAIC1DIldadm+aQYc\nr4zcCuvBRy4voUCfQXx6CZbt6GOedv2JfdEUgwrCnJSbKpcRUsMAeZMyXIHg\nGSZRZhDQCpBskHsdEV8CVEMv8pmC858KWfo9tPd6SSnuT8+t9y1e9Q==\n=z00W\n-----END PGP MESSAGE-----"
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
