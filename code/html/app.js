/// <reference types="@argonjs/argon"/>
/// <reference types="three"/>
// set up Argon
var app = Argon.init();
// set up THREE.  Create a scene, a perspective camera and an object
// for the user's location
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D;
scene.add(camera);
scene.add(userLocation);
// The CSS3DArgonRenderer supports mono and stereo views, and 
// includes both 3D elements and a place to put things that appear 
// fixed to the screen (heads-up-display) 
var renderer = new THREE.CSS3DArgonRenderer();
app.view.element.appendChild(renderer.domElement);
// to easily control stuff on the display
var hud = new THREE.CSS3DArgonHUD();
app.view.element.appendChild(hud.domElement);

var hudContent = document.getElementById('hud');
hud.appendChild(hudContent);
// We put some elements in the index.html, for convenience. 
// Here, we retrieve the description box and move it to the 
// the CSS3DArgonHUD hudElements[0].  We only put it in the left
// hud since we'll be hiding it in stereo
// var description = document.getElementById('description');
// hud.hudElements[0].appendChild(description);
// app.view.element.appendChild(hud.domElement);
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


/* VUFORIA SECTION */


var frameText = document.getElementById('frame-text');
var frameMusic = document.getElementById('frame-music');
var mainSongPlaying = null;
var songArray = [
    {
        song: 'song2.mp3',
        trackable: 'bluestone',
        entity: null,
        status: 'lost',
        el: document.getElementById('song2'),
        artist: "artist2",
        title: "song2"
    },
    {
        song: 'song3.mp3',
        trackable: 'whitestone',
        entity: null,
        status: 'lost',
        el: document.getElementById('song3'),
        artist: "artist3",
        title: "song3"
    }
];

var prev = 'found';

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
                // var gvuBrochureEntity = app.context.subscribeToEntityById(trackables["bluestone"].id);

                for (song of songArray) {
                    song.entity = app.context.subscribeToEntityById(trackables[song.trackable].id);
                }
                // entityArray.push(app.context.subscribeToEntityById(trackables["bluestone"].id));
                // entityArray.push(app.context.subscribeToEntityById(trackables["whitestone"].id));


                // create a THREE object to put on the trackable
                // var gvuBrochureObject = new THREE.Object3D;
                // scene.add(gvuBrochureObject);
                // the updateEvent is called each time the 3D world should be
                // rendered, before the renderEvent.  The state of your application
                // should be updated here.
                app.context.updateEvent.addEventListener(function () {


                    for (var i = 0 ; i < songArray.length ; i++) {
                        var song = songArray[i];
                        // get the pose (in local coordinates) of the gvuBrochure target
                        var gvuBrochurePose = app.context.getEntityPose(song.entity);


                        /* SONG 1*/
                        // if the pose is known the target is visible, so set the
                        // THREE object to the location and orientation
                        /*
                        if (gvuBrochurePose.poseStatus & Argon.PoseStatus.KNOWN) {
                            // gvuBrochureObject.position.copy(gvuBrochurePose.position);
                            // gvuBrochureObject.quaternion.copy(gvuBrochurePose.orientation);
                            console.log("Known");

                            // var v = document.getElementById('song');
                            // v.setAttribute("style", "display: block;");
                            // v.play();

                        }
                        */
                        // when the target is first seen after not being seen, the
                        // status is FOUND.  Here, we move the 3D text object from the
                        // world to the target.
                        // when the target is first lost after being seen, the status
                        // is LOST.  Here, we move the 3D text object back to the world
                        if (gvuBrochurePose.poseStatus & Argon.PoseStatus.FOUND) {
                            // gvuBrochureObject.add(argonTextObject);
                            // argonTextObject.position.z = 0;
                            console.log("Found " + i);

                            // var v = document.getElementById('song');
                            // v.setAttribute("style", "display: block;");
                            // v.play();

                            song.status = 'found';

                            // hideMe(frameText);
                            // loadSong(song.song);
                            // showMe(frameMusic);
                            // wavesurfer.play();
                            // break;


                        }
                        else if (gvuBrochurePose.poseStatus & Argon.PoseStatus.LOST) {
                            // argonTextObject.position.z = -0.50;
                            // userLocation.add(argonTextObject);
                            console.log("Lost " + i);

                            song.status = 'lost';

                            // var v = document.getElementById('song');
                            // v.setAttribute("style", "display: none;");
                            // v.pause();

                            // hideMe(frameMusic);
                            // wavesurfer.pause();
                            // showMe(frameText);
                        }                        
                    }

                    // Search through songs to see which one has been found
                    var found = null;
                    for (var i = 0 ; i < songArray.length ; i++) {
                        var temp = songArray[i];
                        if (temp.status === 'found') {
                            found = i;
                        }
                    }
                    // Change UI
                    if (found === null) {
                        if (prev === 'found') {
                            console.log("no song playing");
                            // wavesurfer.pause();
                            // hideMe(frameMusic);
                            // showMe(frameText);

                            // Hide all the audio divs
                            hideMe(frameMusic);
                            showMe(frameText);
                            for (var s of songArray) {
                                s.el.pause();
                                hideMe(s.el);
                            }

                            prev = 'lost';
                        }
                    }
                    else {
                        if (prev === 'lost') {
                            console.log(found + " is playing");
                            hideMe(frameText);

                            showMe(frameMusic);
                            var temp = songArray[found];
                            showMe(temp.el);
                            temp.el.play();
                            // loadSong(temp.song);
                            // showMe(frameMusic);
                            // wavesurfer.on('ready', function () {
                            //     wavesurfer.play();
                            // });
                            // wavesurfer.play();
                            prev = 'found'; 
                        } 
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

/* END VUFORIA SECTION*/




// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.
app.updateEvent.addEventListener(function () {
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
    var userPose = app.context.getEntityPose(app.context.user);
    // assuming we know the user's pose, set the position of our 
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
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
    // if we have 1 subView, we're in mono mode.  If more, stereo.
    var monoMode = subViews.length == 1;
    rAFpending = false;
    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);
    // there is 1 subview in monocular mode, 2 in stereo mode
    for (var _i = 0, subViews_1 = subViews; _i < subViews_1.length; _i++) {
        var subview = subViews_1[_i];
        // set the position and orientation of the camera for 
        // this subview
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera.  Use it, and then update the FOV of the 
        // camera from it (needed by the CSS Perspective DIV)
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        camera.fov = subview.frustum.fovy * 180 / Math.PI;
        // set the viewport for this view
        var _a = subview.viewport, x = _a.x, y = _a.y, width = _a.width, height = _a.height;
        renderer.setViewport(x, y, width, height, subview.index);
        // render this view.
        renderer.render(scene, camera, subview.index);
        // adjust the hud, but only in mono
        if (monoMode) {
            hud.setViewport(x, y, width, height, subview.index);
            hud.render(subview.index);
        }
    }
}

function hideMe(elem) {
    elem.style.display = 'none';
}  

function showMe(elem) {
    elem.style.display = 'block';
} 