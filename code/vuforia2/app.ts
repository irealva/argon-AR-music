/// <reference types="@argonjs/argon" />
/// <reference types="three" />
/// <reference types="dat-gui" />
/// <reference types="stats" />

// set up Argon
const app = Argon.init();

// set up THREE.  Create a scene, a perspective camera and an object
// for the user's location
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const userLocation = new THREE.Object3D();
scene.add(camera);
scene.add(userLocation);

// We use the standard WebGLRenderer when we only need WebGL-based content
const renderer = new THREE.WebGLRenderer({
    alpha: true,
    logarithmicDepthBuffer: true
});
// account for the pixel density of the device
renderer.setPixelRatio(window.devicePixelRatio);
app.view.element.appendChild(renderer.domElement);

// to easily control stuff on the display
const hud = new (<any>THREE).CSS3DArgonHUD();

// We put some elements in the index.html, for convenience.
// Here, we retrieve the description box and move it to the
// the CSS3DArgonHUD hudElements[0].  We only put it in the left
// hud since we'll be hiding it in stereo
var description = document.getElementById( 'description' );
hud.hudElements[0].appendChild(description);
app.view.element.appendChild(hud.domElement);

// let's show the rendering stats
var stats = new Stats();
hud.hudElements[0].appendChild( stats.dom );

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
}

var argonTextObject = new THREE.Object3D();
argonTextObject.position.z = -0.5;
userLocation.add(argonTextObject);

var loader = new THREE.FontLoader();
loader.load( '../resources/fonts/helvetiker_bold.typeface.js', function ( font ) {
    var textGeometry = new THREE.TextGeometry( "argon.js", {
        font: <any>font,
        size: 40,
        height: 5,
        curveSegments: 3,
        bevelThickness: 2,
        bevelSize: 1,
        bevelEnabled: true
    });
    textGeometry.center();
    var tessellateModifier = new (<any>THREE).TessellateModifier( 8 );
    for ( var i = 0; i < 6; i ++ ) {
        tessellateModifier.modify( textGeometry );
    }
    var explodeModifier = new (<any>THREE).ExplodeModifier();
    explodeModifier.modify( textGeometry );
    var numFaces = textGeometry.faces.length;

    var bufferGeometry = new THREE.BufferGeometry().fromGeometry( textGeometry );
    var colors = new Float32Array( numFaces * 3 * 3 );
    var displacement = new Float32Array( numFaces * 3 * 3 );
    var color = new THREE.Color();
    for ( var f = 0; f < numFaces; f ++ ) {
        var index = 9 * f;
        var h = 0.07 + 0.1 * Math.random();
        var s = 0.5 + 0.5 * Math.random();
        var l = 0.6 + 0.4 * Math.random();
        color.setHSL( h, s, l );
        var d = 5 + 20 * ( 0.5 - Math.random() );
        for ( var i = 0; i < 3; i ++ ) {
            colors[ index + ( 3 * i )     ] = color.r;
            colors[ index + ( 3 * i ) + 1 ] = color.g;
            colors[ index + ( 3 * i ) + 2 ] = color.b;
            displacement[ index + ( 3 * i )     ] = d;
            displacement[ index + ( 3 * i ) + 1 ] = d;
            displacement[ index + ( 3 * i ) + 2 ] = d;
        }
    }
    bufferGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
    bufferGeometry.addAttribute( 'displacement', new THREE.BufferAttribute( displacement, 3 ) );

    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            uniform float amplitude;
            attribute vec3 customColor;
            attribute vec3 displacement;
            varying vec3 vNormal;
            varying vec3 vColor;
            void main() {
                vNormal = normal;
                vColor = customColor;
                vec3 newPosition = position + normal * amplitude * displacement;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vColor;
            void main() {
                const float ambient = 0.4;
                vec3 light = vec3( 1.0 );
                light = normalize( light );
                float directional = max( dot( vNormal, light ), 0.0 );
                gl_FragColor = vec4( ( directional + ambient ) * vColor, 1.0 );
            }
        `
    });

    var textMesh = new THREE.Mesh( bufferGeometry, shaderMaterial );
    argonTextObject.add( textMesh );
    argonTextObject.scale.set (0.001,0.001,0.001);
    argonTextObject.position.z = -0.50;

    // add an argon updateEvent listener to slowly change the text over time.
    // we don't have to pack all our logic into one listener.
    app.context.updateEvent.addEventListener(() => {
        uniforms.amplitude.value = 1.0 + Math.sin( Date.now() * 0.001 * 0.5 );
    });
});

app.vuforia.isAvailable().then(function(available) {
    // vuforia not available on this platform
    if (!available) {
        console.warn("vuforia not available on this platform.");
        return;
    }

    // tell argon to initialize vuforia for our app, using our license information.
    app.vuforia.init({
        encryptedLicenseData:
`-----BEGIN PGP MESSAGE-----
Version: OpenPGP.js v2.3.2
Comment: http://openpgpjs.org

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
0xVojik=
=s9uR
-----END PGP MESSAGE-----`
    }).then((api)=>{
        // the vuforia API is ready, so we can start using it.

        // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
        // in the web directory, even though we just provide the .xml file url here
        api.objectTracker.createDataSet("../resources/datasets/IxDMusic.xml").then( (dataSet)=>{
            // the data set has been succesfully downloaded

            // tell vuforia to load the dataset.
            dataSet.load().then(()=>{
                // when it is loaded, we retrieve a list of trackables defined in the
                // dataset and set up the content for the target
                const trackables = dataSet.getTrackables();

                // tell argon we want to track a specific trackable.  Each trackable
                // has a Cesium entity associated with it, and is expressed in a
                // coordinate frame relative to the camera.  Because they are Cesium
                // entities, we can ask for their pose in any coordinate frame we know
                // about.
                const gvuBrochureEntity = app.context.subscribeToEntityById(trackables["bluestone"].id)

                // create a THREE object to put on the trackable
                const gvuBrochureObject = new THREE.Object3D;
                scene.add(gvuBrochureObject);

                // the updateEvent is called each time the 3D world should be
                // rendered, before the renderEvent.  The state of your application
                // should be updated here.
                app.context.updateEvent.addEventListener(() => {
                    // get the pose (in local coordinates) of the gvuBrochure target
                    const gvuBrochurePose = app.context.getEntityPose(gvuBrochureEntity);

                    // if the pose is known the target is visible, so set the
                    // THREE object to the location and orientation
                    if (gvuBrochurePose.poseStatus & Argon.PoseStatus.KNOWN) {
                        gvuBrochureObject.position.copy(<any>gvuBrochurePose.position);
                        gvuBrochureObject.quaternion.copy(<any>gvuBrochurePose.orientation);
                    }

                    // when the target is first seen after not being seen, the
                    // status is FOUND.  Here, we move the 3D text object from the
                    // world to the target.
                    // when the target is first lost after being seen, the status
                    // is LOST.  Here, we move the 3D text object back to the world
                    if (gvuBrochurePose.poseStatus & Argon.PoseStatus.FOUND) {
                        gvuBrochureObject.add(argonTextObject);
                        argonTextObject.position.z = 0;
                    } else if (gvuBrochurePose.poseStatus & Argon.PoseStatus.LOST) {
                        argonTextObject.position.z = -0.50;
                        userLocation.add(argonTextObject);
                    }
                })
            }).catch(function(err) {
                console.log("could not load dataset: " + err.message);
            });

            // activate the dataset.
            api.objectTracker.activateDataSet(dataSet);
        });
    }).catch(function(err) {
        console.log("vuforia failed to initialize: " + err.message);
    });
});

// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.
app.context.updateEvent.addEventListener(() => {
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
    const userPose = app.context.getEntityPose(app.context.user);

    // assuming we know the user's pose, set the position of our
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(<any>userPose.position);
    }
});

// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.addEventListener(() => {
    // update the rendering stats
    stats.update();

    // if we have 1 subView, we're in mono mode.  If more, stereo.
    var monoMode = (app.view.getSubviews()).length == 1;

    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    const viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);

    // there is 1 subview in monocular mode, 2 in stereo mode
    for (let subview of app.view.getSubviews()) {
        // set the position and orientation of the camera for
        // this subview
        camera.position.copy(<any>subview.pose.position);
        camera.quaternion.copy(<any>subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera.
        camera.projectionMatrix.fromArray(<any>subview.projectionMatrix);

        // set the viewport for this view
        let {x,y,width,height} = subview.viewport;
        renderer.setViewport(x,y,width,height);

        // set the webGL rendering parameters and render this view
        renderer.setScissor(x,y,width,height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);

        // adjust the hud, but only in mono
        if (monoMode) {
            hud.setViewport(x,y,width,height, subview.index);
            hud.render(subview.index);
        }
    }
})
