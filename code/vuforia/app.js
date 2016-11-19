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
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\nwcFMA+gV6pi+O8zeAQ//XKLOAt6UWyTKuBlaMQ0eRMsp7u1Q+KVSli1vD+Jd\n+ax5ophWYRv6S80mo54wSPLUrKQyjuU7+fEqgLmHvXWSpi/Yq+ANFi28oz+2\n48cmK6FguXDsl72/U7yYuEAfN0kczDMA4GOsfLPUWhLyjzCMhSxeIr1ujDB2\nOyqVmUL+sE1yAIJSSljHtcbmlV2cWiHwi9zVeRYPnQDMKly0hhC+uVC8pDuQ\nmcbXbw8lvZwUXMA+zJ8ef/Z65hs+nG4RSKE9NKSQ9YX8jIYN4mc8PsLLdsNO\nxbATjMhHZK2BJKtxnVJPIqws2DJe1GnsKn6bg476wmaMfAutez5uULWCwW+r\nA/taI0xVMKn1eHkOUN7QPN6+EMU3MfMnk5z2ZIisebqve7RefIUHq2l32VHx\n+aRe4wgaspV+LwaDRklfYjBUK6PZ9km9qRELpgpaxyxLAIEytnUTtCpJkIzw\nz4EMwvYHnu9hmn6ACjXFrs/s65tieDQfmsk9OtHYtn9jrAiqJzvOY2BkMPf4\nZ3JlG2Aa2ZFkJigrGZiI/zo95WlojhDcz6ep+i9hK6eofNITBpDHesx8hExD\nux6uQ2fOgSkTGIng2VXUoXPyXFDvvWWXjY9BsX7ZCV3YMikifS4mB013IXBD\nNgyZN5PLm+EzWiX9JrWUudnwzav4TCGo4/bSy1H3xMfBwU4DAGn1enGTza0Q\nB/9AtZQ2C7VguKHxJVMHuHG/fe9xOSKzzO4KyX+/eNC8NGMPyRZvHsxUt1rP\nX1gtLb3A8wwFveXaDlbkr+2VmWFzybkaXOUoniQ+z5ndlbgQbOQWs6/yRSXi\nemSnqtDPjH6cNwtwWhgyW52oSNqvORhDmCSTI6qsjpxPe2jf2RNRgI+dvogO\nTzVS3NC6Yg+dUojyEJITHRSo4Ht5xEyqyV1a3ST1V33Z4hWXW9PCK3AOdh6b\n4rWJZGmZsMn1IWb7tATe/Y4QWTkfbabckQu8rHy2mtIK8M3SaN9MX3vB8r1o\ntFIKAng3QS6UbbqVOFaJ0l4RVIZfKWezySlrI5Vg9PxDB/9ckW4MDfgkWqB/\njt8pl5Pr57XnuEDl1XmixR1v4UOeeDx/bGgRkIw0KP3YiVrKinjINqHFcoiR\nnsHwwExabIWyyn+oAL5agcH9zEUzNhLmmV8iTLNjgMSpp2wEPR+DLuYWddGK\nWHwLUqPWQsaumdSA/qwluRNqaHzSibJgsJTYLaOaVexqvmL8gHAZxc9hsJ8F\nR4kmaA5StovJz3w2gim4tKCm1Est7N2pyih8KlxfWRb33jVfgYD00WeUF7L4\nGIPx+LpRrTSJwdhA8/j7rD/vstwqVKENR2Y36oBTPqRcsc/0OccT7+Ck/Yx6\nA2FG3q5b4Vna+ZYi3SvSNR8tMqnVwcFMA47tt+RhMWHyARAA2q2u5+wwClND\n1tejk1tUyfr0atjseVMeDX4RtItSyLqqE4hoJkQHBTPnKB5OG2DKthMdE0eA\nw6VzNQoik/3ttRU2Q//ZBZekSswaWG0pXJ9lWyoABJCD9ne6YzVLZKr/q7lE\n9wFq74v5jDmdIZM+D922+vkB/fCvq4sYnYLawCm4vGzt9pPBlwfWDHRDxvDC\nCehqooR0mIBQHcKEqEd6hsbI5ZY/Lm7z4IZasZFEdUtKSwEUs0YzON11YRdG\npCBN+Dgnr0YzmYzlC3aJcswQ8tYUGA3nb4S+ed/ynuBb0lfXu1s70eXGWsiP\nZCubR6HbCNLcoVn42sXzkY7g7kLuHJHFcpjonUenO8dwTUmA3ISQaw+Kkly9\nuCsQrfhGntj2cZNVjlvBeP2HV9nMrseE3XS54VT1vrwaT/bPTt69WfBb9Zri\n2Gm2UE3Wsb/BFz/0f1Xva14uxtb8ebQnQI8xK8A05BZW2kNX0A3mUzppqnTj\nAFfs/dlY/PeLoNnrwT+gQU26yCA/orjK1kG58h0XzLgJ0oLO4SmbC9zLMJ8p\nGteEl3vK3E3b/gUuGCgkNZ1VgFQ/edQUIdIXDMnpqCBvdQ4iM9gN7+nUPpjO\nk64YQHMnuE+ZKs3qbZywhx3+dXqcTHWshgSMrfSCxWBnF+BCTmdnjrk3fbG7\nqfJrTGO0u0LSwUQB/VN5oFtOtWMNM2N/QEkZ2gqFuW+yokkWAm5Crjh+0b3i\nqA7m6E/4BCFSZbKpG4NICj2XqHMptHcr9ygTaUK0uMf3c4yk5tW8Qe/NFLJZ\nv9T2Ch2p3SMR0h0O3ULhuGLVK/Z3Nx5enwYoVqKRYZ5GaIQBF3v9/ckmwGec\nWpN19kT9jfcwFE7/bOnUSpFzcwoonNrWcX4G9vptUtQqw46dr1SIp1Vz36HL\nI6ZsZPxC2adEZEqB0biC1vX4eld9MhOT+yPS5sN96OtKVoEfcC1rCMc8oJTM\nhM3KgDMrhJOF4Q1NM0OtiYHPL9Dc53EKZmOCyEXs/ubd3z4uExbJp1cWzZMF\nbYvtNK4UpYMsD2n3oeQDCP6EBLLT0aG4IZiqg0vSBGb9LKO/+33bmO2ZiyAg\nTr+upj00nJMVGDGD0zH1mh0F/tkfGTBoTi9GxcoQXvYsB7ntm77BnDCtMEdi\nW0XYGlVNEdSTlRgg8nUZbaYRTLCl94RH1DEIJcNAEB8DAJafI6d0oEZ6aeh6\nIG4RXcMgK5r6wEphai3HRsoSgujw9dr6yTisofK+ASsW6iKD5pDMRyWsMpRU\n6exWsCjFgz1ACgZeQq3hol/7X3hoJOyPi6RAAlHgnwRucBrkldxoRwhUZ+Bi\n9wEN+YKw+eUXMTR3Db/M14vrvPYQDCb6Mvv0+tAIUik=\n=Gq1O\n-----END PGP MESSAGE-----\n"
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
