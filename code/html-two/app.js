/*
 * App.js 
 * Contains the core functionality for the application. 
 * Loads the AR library and Vuforia markers. 
 * Also decides when to play a song
 */

/* App setup */

var app = Argon.init();
// Create a scene, a perspective camera and an object for the user's location
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D;
scene.add(camera);
scene.add(userLocation);

// We need to include a renderer in this case for pure HTML content. 
var renderer = new THREE.CSS3DArgonRenderer();
app.view.element.appendChild(renderer.domElement);

var hud = new THREE.CSS3DArgonHUD();
app.view.element.appendChild(hud.domElement);
var hudContent = document.getElementById('hud');
hud.appendChild(hudContent);

// Have to set the type of coordinate frame to use in 3D graphics, even
// though our content will be in 2D. Still need to be able to detect where the Vuforia
// markers are in relation to user
app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);


/* Music section */

var frameText = document.getElementById('frame-text');
var frameMusic = document.getElementById('frame-music');
var mainSongPlaying = null;
// We have a song list
var songArray = [
    // {
    //     song: 'song1.mp3',
    //     trackable: 'bluestone',
    //     entity: null,
    //     status: 'lost',
    //     el: document.getElementById('song2'),
    //     artist: "Zende",
    //     title: "Cherry Cola"
    // },
    {
        song: 'song2.mp3',
        trackable: 'pattern2',
        entity: null,
        status: 'lost',
        el: document.getElementById('song3'),
        artist: "Nairobi",
        title: "Drownin"
    },
    {
        song: 'song3.mp3',
        trackable: 'pattern3',
        entity: null,
        status: 'lost',
        el: document.getElementById('song4'),
        artist: "E.L.B.A.",
        title: "Muse"
    },
    {
        song: 'song4.mp3',
        trackable: 'pattern4',
        entity: null,
        status: 'lost',
        el: document.getElementById('song4'),
        artist: "Shad Ali",
        title: "Sun-Son"
    },
    {
        song: 'song5.mp3',
        trackable: 'pattern5',
        entity: null,
        status: 'lost',
        el: document.getElementById('song4'),
        artist: "Zende",
        title: "Brownskin"
    },
    {
        song: 'song6.mp3',
        trackable: 'pattern6',
        entity: null,
        status: 'lost',
        el: document.getElementById('song4'),
        artist: "Charon-don",
        title: "I don't do that"
    }
];


/* Vuforia section */

var prev = 'found';

// Here we setup the main vuforia functionality
app.vuforia.isAvailable().then(function (available) {
    // Error checking if vuforia is avialable. This will show up in web browsers
    if (!available) {
        console.warn("vuforia not available on this platform.");
        return;
    }
    // Initialize the app with my own PGP key
    app.vuforia.init({
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\n0xVojik=\n=s9uR\n-----END PGP MESSAGE-----"
    }).then(function (api) {
        // Download the vuforia dataset from the resources folder
        api.objectTracker.createDataSet("../resources/datasets/IxDMusic.xml").then(function (dataSet) {
            
            // Load the data set
            dataSet.load().then(function () {
                // Define a list of trackables
                var trackables = dataSet.getTrackables();

                // Here we're trying to tell Vuforia which specific trackables to track
                // The song.trackable is actually the trackable id
                for (song of songArray) {
                    song.entity = app.context.subscribeToEntityById(trackables[song.trackable].id);
                }

                // Each time the world should be rerendered, we need to update our app
                app.context.updateEvent.addEventListener(function () {

                    // Iterate through our targets to see if any of them are seen.
                    for (var i = 0 ; i < songArray.length ; i++) {
                        var song = songArray[i];
                        // get the target pose
                        var gvuBrochurePose = app.context.getEntityPose(song.entity);

                        // If the target is seen then it's status is FOUND. 
                        if (gvuBrochurePose.poseStatus & Argon.PoseStatus.FOUND) {
                            console.log("Found " + i);

                            song.status = 'found';
                        }
                        // If the target is lost then it's status is LOST
                        else if (gvuBrochurePose.poseStatus & Argon.PoseStatus.LOST) {
                            console.log("Lost " + i);

                            song.status = 'lost';
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
                    // Change the UI based on whether a target is visible or not
                    if (found === null) {
                        if (prev === 'found') {
                            console.log("no song playing");

                            // if (myp5 !== undefined ){
                            if (container !== undefined) {
                                // destroySketch();
                                removeSketch();
                            }

                            // Change UI visible/non visible elements
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

                            // Change UI visible/non visible elements
                            hideMe(frameText);
                            showMe(frameMusic);

                            var temp = songArray[found];
                            showMe(temp.el);
                            temp.el.play();
                            createSketch();
                            prev = 'found'; 
                        } 
                    }
                });
            }).catch(function (err) {
                console.log("could not load dataset: " + err.message);
            });
            // Activate dataset
            api.objectTracker.activateDataSet(dataSet);
        });
    }).catch(function (err) {
        console.log("vuforia failed to initialize: " + err.message);
    });
});


/* Rendering section */

// Update is called each time the AR world should be rerendered
app.updateEvent.addEventListener(function () {
    // Get the position and orientation of the user
    var userPose = app.context.getEntityPose(app.context.user);
    // Set the position of our target in relation to user
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    }
});

// Limit the number of calls to the DOM by checking if there is a new 
// animation to render
var viewport = null;
var subViews = null;
var rAFpending = false;
app.renderEvent.addEventListener(function () {
    if (!rAFpending) {
        rAFpending = true;
        viewport = app.view.getViewport();
        subViews = app.view.getSubviews();
        window.requestAnimationFrame(renderFunc);
    }
});

// Animation callback
function renderFunc() {
    var monoMode = subViews.length == 1;
    rAFpending = false;

    // Renderer has to know size of viewport
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);

    for (var _i = 0, subViews_1 = subViews; _i < subViews_1.length; _i++) {
        var subview = subViews_1[_i];
        // Set position and orientation of camera
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        camera.fov = subview.frustum.fovy * 180 / Math.PI;

        // Set viewport
        var _a = subview.viewport, x = _a.x, y = _a.y, width = _a.width, height = _a.height;
        renderer.setViewport(x, y, width, height, subview.index);

        // Render view
        renderer.render(scene, camera, subview.index);
        if (monoMode) {
            hud.setViewport(x, y, width, height, subview.index);
            hud.render(subview.index);
        }
    }
}


/* Helper functions */

var list = document.getElementById('music-list');
var main = document.getElementById('main');
var back1 = document.getElementById('back1');
var back2 = document.getElementById('back2');
var myp5;

function hideMe(elem) {
    elem.style.display = 'none';
}  

function showMe(elem) {
    elem.style.display = 'block';
} 

// What happens when we add a song to our music list
$('#add').on('click', function(event) {
  var temp = null;
  for (var i = 0 ; i < songArray.length ; i++) {
      if (songArray[i].status === 'found') {
          temp = songArray[i];
          break;
      }
  }

  console.log("add song");
  if (temp != null) {
      var newSong = "<li class='list-group-item'>" + temp.artist + " - " + temp.title + "</li>";
      $('#song-list').append(newSong);
      console.log(temp.artist, temp.title);
  }
});

// What happens when we click the back button
$('#back').on('click', function(event) {
    hideMe(list);
    showMe(main);
    showMe(back1);
    showMe(back2);
});

// Clicking the music library icon renders the list
$('#library').on('click', function(event) {
  hideMe(main);
  hideMe(back1);
  hideMe(back2);
    showMe(list);
  // createSketch();
});

// Help button
$('#question').on('click', function(event) {
  // loadSong("song3.mp3");
  // console.log("hi");
  // removeSketch();
});

// Creates a processing animation when a song is tracked
// function createSketch() {
//   myp5 = new p5(s, 'myP5');
// }

// // Removes the processing sketch when we lose track of a song
// function destroySketch() {
//   myp5.remove();
// }


