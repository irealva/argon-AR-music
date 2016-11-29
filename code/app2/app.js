var SEPARATION = 20, AMOUNTX = 40, AMOUNTY = 4;
var container, stats;
var camera, scene, renderer;
var particles, particle, count = 0;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var bolAnimate = false;


// Argon stuff
var app;
var hud;
var stats;
var userLocation;


var minX = -1;
var maxX = -1;
var minY = -1;
var maxY = -1;

var getCoordinatesOnce = true;
init();

// animate();
function getTexture() {
    var canvas = document.createElement( 'canvas' );
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var ctx = canvas.getContext( '2d' );
    ctx.beginPath();
    ctx.arc(window.innerWidth / 2, window.innerHeight / 2, 70, 0, 2 * Math.PI, false);
    ctx.stroke();
    ctx.fill();
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}


function init() {
    // initialize Argon
    app = Argon.init();
    app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);


    ////container = document.createElement( 'div' );
    ////document.body.appendChild( container );
    // camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera = new THREE.PerspectiveCamera();
    // camera.position.z = 1000;

    userLocation = new THREE.Object3D;

    scene = new THREE.Scene();

    scene.add(camera);
    scene.add(userLocation);

    // let's show the rendering stats
    stats = new Stats();
    hud = new THREE.CSS3DArgonHUD();
    hud.hudElements[0].appendChild(stats.dom);
    app.view.element.appendChild(hud.domElement);
    console.log(hud.domElement);


    particles = new Array();
    var PI2 = Math.PI * 2;
    var material = new THREE.SpriteMaterial( {
        // color: 0xffffff,
        map: getTexture(),
        color: 0x000000
        // program: function ( context ) {
        // 	context.beginPath();
        // 	context.arc( 0, 0, 0.5, 0, PI2, true );
        // 	context.fill();
        // }
    } );
    var i = 0;
    for ( var ix = 0; ix < AMOUNTX; ix ++ ) {
        for ( var iy = 0; iy < AMOUNTY; iy ++ ) {
            particle = particles[ i ++ ] = new THREE.Sprite( material );
            particle.position.x = ix * SEPARATION - ( ( AMOUNTX * SEPARATION ) / 2 );
            // particle.position.z = iy * SEPARATION - ( ( AMOUNTY * SEPARATION ) / 2 ); // Original z controls distance to object
            particle.position.z = -400;
            // console.log(particle.position.x, particle.position.y, particle.position.z);
            scene.add( particle );
        }
    }


    // Argon renderer
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        logarithmicDepthBuffer: true
    });
    //Based off of: http://stackoverflow.com/questions/16177056/changing-three-js-background-to-transparent-or-other-color
    // renderer.setClearColor( 0xffffff, 0);
    renderer.setPixelRatio( window.devicePixelRatio );
    // renderer.setSize( window.innerWidth, window.innerHeight );

    ////container.appendChild( renderer.domElement ); // Append in general
    app.view.element.appendChild(renderer.domElement); // Append to argon

    // stats = new Stats();
    // container.appendChild( stats.dom );

    //TOUH EVENTS
    // document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    // document.addEventListener( 'touchstart', onDocumentTouchStart, false ); // mobile touch start
    // document.addEventListener( 'touchmove', onDocumentTouchMove, false );
    // document.addEventListener( 'click', onDocumentClick, false );
    //
}
//
function onDocumentClick(event) {
    let x = event.offsetX;
    let y = event.offsetY;

    if (x > minX && x < maxX && y > minY && y < maxY) {
        bolAnimate = !bolAnimate;
        console.log(bolAnimate);
    }
}
//
function onDocumentMouseMove( event ) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}
function onDocumentTouchStart( event ) {
    console.log(event);
    if ( event.touches.length === 1 ) {
        event.preventDefault();
        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfY;

        let x = event.touches[ 0 ].pageX;
        let y = event.touches[ 0 ].pageY;
        console.log(x,y);
        //Addition to stop the particle animation
        if (x > minX && x < maxX && y > minY && y < maxY) {
            bolAnimate = !bolAnimate;
            console.log(bolAnimate);
        }
    }
}
function onDocumentTouchMove( event ) {
    if ( event.touches.length === 1 ) {
        event.preventDefault();
        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfY;
    }
}


console.log("BEFORE VUFORIA");
app.vuforia.isAvailable().then(function (available) {
    // vuforia not available on this platform
    if (!available) {
        console.warn("vuforia not available on this platform.");
        return;
    }
    // tell argon to initialize vuforia for our app, using our license information.
    app.vuforia.init({
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\n0xVojik=\n=s9uR\n-----END PGP MESSAGE-----"
    }).then(function (api) {

        console.log("WITHIN VUFORIA");
        // the vuforia API is ready, so we can start using it.
        // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
        // in the web directory, even though we just provide the .xml file url here
        api.objectTracker.createDataSet("../resources/datasets/IxDMusic.xml").then(function (dataSet) {
            // the data set has been succesfully downloaded
            // tell vuforia to load the dataset.
            dataSet.load().then(function () {
                console.log("DATA LOAD");
                // when it is loaded, we retrieve a list of trackables defined in the
                // dataset and set up the content for the target
                var trackables = dataSet.getTrackables();
                // tell argon we want to track a specific trackable.  Each trackable
                // has a Cesium entity associated with it, and is expressed in a
                // coordinate frame relative to the camera.  Because they are Cesium
                // entities, we can ask for their pose in any coordinate frame we know
                // about.
                var gvuBrochureEntity = app.context.subscribeToEntityById(trackables["bluestone"].id);
                console.log(gvuBrochureEntity);

                // create a THREE object to put on the trackable
                var gvuBrochureObject = new THREE.Object3D;
                scene.add(gvuBrochureObject);
                // the updateEvent is called each time the 3D world should be
                // rendered, before the renderEvent.  The state of your application
                // should be updated here.
                app.context.updateEvent.addEventListener(function () {
                    // get the pose (in local coordinates) of the gvuBrochure target
                    var gvuBrochurePose = app.context.getEntityPose(gvuBrochureEntity);

                    /* SONG 1*/
                    // if the pose is known the target is visible, so set the
                    // THREE object to the location and orientation
                    if (gvuBrochurePose.poseStatus & Argon.PoseStatus.KNOWN) {
                        gvuBrochureObject.position.copy(gvuBrochurePose.position);
                        gvuBrochureObject.quaternion.copy(gvuBrochurePose.orientation);

                        // var v = document.getElementById('song');
                        // v.setAttribute("style", "display: block;");
                        // v.play();

                    }
                    // when the target is first seen after not being seen, the
                    // status is FOUND.  Here, we move the 3D text object from the
                    // world to the target.
                    // when the target is first lost after being seen, the status
                    // is LOST.  Here, we move the 3D text object back to the world
                    if (gvuBrochurePose.poseStatus & Argon.PoseStatus.FOUND) {
                        console.log("FOUND");

                        for (part of particles) {
                            gvuBrochureObject.add(part);
                            // part.position.z = 0;
                            part.position.z = -400;
                        }
                        bolAnimate = true;


                        // gvuBrochureObject.add(argonTextObject);
                        // argonTextObject.position.z = 0;

                        // var v = document.getElementById('song');
                        // v.setAttribute("style", "display: block;");
                        // v.play();
                    }
                    else if (gvuBrochurePose.poseStatus & Argon.PoseStatus.LOST) {
                        console.log("LOST");
                        //We don't have to delete it because it simply won't render?
                        // for (part of particles) {
                        //     // part.position.z = -0.50;
                        //     part.position.z = -400;
                        //     userLocation.add(part);
                        // }

                        bolAnimate = false;


                        // argonTextObject.position.z = -0.50;
                        // userLocation.add(argonTextObject);

                        // var v = document.getElementById('song');
                        // v.setAttribute("style", "display: none;");
                        // v.pause();
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





//
// function animate() {
// 	requestAnimationFrame( animate );
//
// 	if (bolAnimate) {
// 		render();
// 	}
// 	// stats.update();
// }
function render() {
    // camera.position.x += ( mouseX - camera.position.x ) * .05;
    // camera.position.y += ( - mouseY - camera.position.y ) * .05;
    // // camera.lookAt( scene.position );
    var i = 0;
    for ( var ix = 0; ix < AMOUNTX; ix ++ ) {
        for ( var iy = 0; iy < AMOUNTY; iy ++ ) {
            particle = particles[ i++ ];
            particle.position.y = ( Math.sin( ( ix + count ) * 0.3 ) * 50 ) +
                ( Math.sin( ( iy + count ) * 0.5 ) * 50 );
            particle.scale.x = particle.scale.y = ( Math.sin( ( ix + count ) * 0.3 ) + 1 ) * 4 +
                ( Math.sin( ( iy + count ) * 0.5 ) + 1 ) * 4;
        }
    }
    // renderer.render( scene, camera );
    count += 0.1;

    //Has to render before we can get sprite position
    if(getCoordinatesOnce) {
        for ( point of particles ) {
                let vector = screenXY(point);

                if(minX === -1 || vector.x < minX) {
                    minX = vector.x;
                }
                if(maxX === -1 || vector.x > maxX) {
                    maxX = vector.x;
                }
                if(minY === -1 || vector.y < minY) {
                    minY = vector.y;
                }
                if(maxY === -1 || vector.y > maxY) {
                    maxY = vector.y;
                }
        }
        console.log(minX, maxX, minY, maxY);

        getCoordinatesOnce = false;
    }
}
// Taken from: https://github.com/mrdoob/three.js/issues/78
function screenXY(obj){
    var vector = obj.position.clone();

    vector.project(camera);

    vector.x = ( vector.x + 1 ) * window.innerWidth / 2;
    vector.y = ( - vector.y + 1) *  window.innerHeight / 2;
    return vector;

};



// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.  Here, we call TWEEN.update()
app.updateEvent.addEventListener(function () {
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
    var userPose = app.context.getEntityPose(app.context.user);

    // assuming we know the user's pose, set the position of our
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    }

    if (bolAnimate) {
        render();
    }
});


// for the CSS renderer, we want to use requestAnimationFrame to
// limit the number of repairs of the DOM.  Otherwise, as the
// DOM elements are updated, extra repairs of the DOM could be
// initiated.  Extra repairs do not appear to happen within the
// animation callback.
var viewport = null;
var subViews = null;
var rAFpending = false;
var monoMode = null;

app.renderEvent.addEventListener(function () {
    // only schedule a new callback if the old one has completed
    if (!rAFpending) {
      rAFpending = true;
      viewport = app.view.getViewport();
      subViews = app.view.getSubviews();
      window.requestAnimationFrame(renderFunc);
    }
});


// the animation callback.
function renderFunc() {
    rAFpending = false;

    // update the rendering stats
    stats.update();
    monoMode = (app.view.getSubviews()).length == 1;

    // set the renderers to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    // var viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);
    // there is 1 subview in monocular mode, 2 in stereo mode
    for (var _i = 0, _a = app.view.getSubviews(); _i < _a.length; _i++) {
        var subview = _a[_i];
        var frustum = subview.frustum;
        // set the position and orientation of the camera for
        // this subview
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera.
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        // set the viewport for this view
        var _b = subview.viewport, x = _b.x, y = _b.y, width = _b.width, height = _b.height;
        // set the CSS rendering up, by computing the FOV, and render this view
        camera.fov = THREE.Math.radToDeg(frustum.fovy);
        // camera.position.z = 1000;
        // set the webGL rendering parameters and render this view
        renderer.setViewport(x, y, width, height);
        renderer.setScissor(x, y, width, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);

        // adjust the hud, but only in mono
        if (monoMode) {
            hud.setViewport(x, y, width, height, subview.index);
            hud.render(subview.index);
        }
    }
};
