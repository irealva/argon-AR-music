/// <reference types="@argonjs/argon" />
/// <reference types="three"/>
/// <reference types="googlemaps"/>

// save some local references to commonly used classes
const Cartesian3 = Argon.Cesium.Cartesian3;
const Quaternion = Argon.Cesium.Quaternion;
const Matrix3 = Argon.Cesium.Matrix3;
const CesiumMath = Argon.Cesium.CesiumMath;

// set up Argon (unlike regular apps, we call initReality instead of init)
const app = Argon.initReality({
    configuration: {
        'reality.handlesZoom':true,
        'app.disablePinchZoom':true
    }
});

const MIN_VERTICAL_FOV = 15 * Argon.Cesium.CesiumMath.RADIANS_PER_DEGREE;
const MAX_VERTICAL_FOV = 90 * Argon.Cesium.CesiumMath.RADIANS_PER_DEGREE;

function clampFov(fov:number, aspectRatio:number) {
    let fovy = fov;
    if (aspectRatio > 1) {
        fovy = fov / aspectRatio;
    }
    const adjustedFovY = Math.max(MIN_VERTICAL_FOV, Math.min(fov, MAX_VERTICAL_FOV));
    return aspectRatio < 1 ? adjustedFovY : adjustedFovY * aspectRatio;
}

app.reality.onZoom = function(data) {
    const fov = Argon.RealityService.prototype.onZoom.call(app.reality, data);
    const viewport = app.view.getViewport();
    if (!viewport) return fov;
    const aspectRatio = viewport.width / viewport.height;
    return clampFov(fov, aspectRatio);
}

const mapElement = document.createElement('div');
const subviewElements = [document.createElement('div'), document.createElement('div')];
mapElement.style.pointerEvents = 'auto';
// mapElement.style.visibility = 'hidden';
mapElement.style.width = '100%';
mapElement.style.height = '50%';
mapElement.style.bottom = '0px';
mapElement.id = 'map';
subviewElements[0].style.pointerEvents = 'auto';
subviewElements[0].style.width = '100%';
subviewElements[0].style.height = '100%';
subviewElements[1].style.width = '100%';
subviewElements[1].style.height = '100%';
(app.view.element as HTMLElement).appendChild(subviewElements[0]);
(app.view.element as HTMLElement).appendChild(subviewElements[1]);
app.view.containingElementPromise.then(function(container) {
    container.appendChild(mapElement);
})

class MapToggleControl {

    element = document.createElement('div');

    controlText:HTMLDivElement;

    _showing = false;

    constructor() {

        // Set CSS for the control border.
        const controlUI = document.createElement('div');
        controlUI.style.backgroundColor = '#222';
        controlUI.style.opacity = '0.8';
        controlUI.style.borderRadius = '3px';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginRight = '10px';
        controlUI.style.marginTop = '10px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'Click to toggle the map';
        this.element.appendChild(controlUI);

        // Set CSS for the control interior.
        const controlText = this.controlText = document.createElement('div');
        controlText.style.color = '#fff';
        controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
        controlText.style.fontSize = '12px';
        controlText.style.lineHeight = '38px';
        controlText.style.paddingLeft = '10px';
        controlText.style.paddingRight = '10px';
        controlText.innerHTML = 'Show Map';
        controlUI.appendChild(controlText);

        // Setup the click event listeners: simply set the map to Chicago.
        controlUI.addEventListener('click', () => {
            this.showing = !this.showing;
        });
    }

    set showing(value: boolean) {
        this._showing = value;
        if (value) {
            this.controlText.innerHTML = 'Hide Map';
        } else {
            this.controlText.innerHTML = 'Show Map';
        }
    }

    get showing() {
        return this._showing;
    }
}


// google street view is our "renderer" here, so we don't need three.js
let map:google.maps.Map;
let streetviews:Array<google.maps.StreetViewPanorama>;
let currentPanoData:google.maps.StreetViewPanoramaData;
const mapToggleControl = new MapToggleControl();

// The photosphere is a much nicer viewer, though it breaks if we 
// programmatically modify the POV while it is transitioning between panorams.
// For this reason, we will (later) restrict navigation to a manual panning mode.
google.maps.streetViewViewer = 'photosphere';

window.addEventListener('load', ()=>{
    
    map = new google.maps.Map(mapElement);
    
    streetviews = [
        new google.maps.StreetViewPanorama(subviewElements[0]), 
        new google.maps.StreetViewPanorama(subviewElements[1])
    ];

    map.setStreetView(streetviews[0]);
    
    // Enable the pan control so we can customize to trigger device orientation based pose
    streetviews[0].setOptions({panControl: true, zoomControl:false});
    streetviews[0].controls[google.maps.ControlPosition.TOP_RIGHT].push(mapToggleControl.element);
    

    // update the pano entity with the appropriate pose
    const elevationService = new google.maps.ElevationService();
    let elevation = 0;
    panoEntity.position.setValue()
    google.maps.event.addListener(streetviews[0], 'position_changed', ()=>{
        const position = streetviews[0].getPosition();
        // update the position with previous elevation
        const positionValue = Cartesian3.fromDegrees(position.lng(), position.lat(), elevation, undefined, scratchCartesian);
        panoEntity.position.setValue(positionValue, Argon.Cesium.ReferenceFrame.FIXED);
        const orientationValue = Argon.Cesium.Transforms.headingPitchRollQuaternion(positionValue, 0, 0, 0);
        panoEntity.orientation.setValue(orientationValue);
        // update the position with correct elevation as long as we haven't moved
        elevationService.getElevationForLocations({locations:[position]}, (results, status)=>{
            if (status = google.maps.ElevationStatus.OK) {
                if (google.maps.geometry.spherical.computeDistanceBetween(results[0].location, position) < 10) {
                    elevation = results[0].elevation;
                    const positionValue = Cartesian3.fromDegrees(position.lng(), position.lat(), elevation, undefined, scratchCartesian);
                    panoEntity.position.setValue(positionValue, Argon.Cesium.ReferenceFrame.FIXED);
                }
            }
        })
    })

    app.view.viewportChangeEvent.addEventListener(()=>{
        google.maps.event.trigger(map, 'resize');
        setTimeout(()=> google.maps.event.trigger(map, 'resize'));
        for (const streetview of streetviews) {
            google.maps.event.trigger(streetview, 'resize');
            setTimeout(()=> google.maps.event.trigger(streetview, 'resize'));
        }
    })

    const streetViewService = new google.maps.StreetViewService();

    navigator.geolocation.getCurrentPosition( (position)=>{
        const coords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        streetViewService.getPanorama({
            location: coords,
            radius: 1500, //Number.POSITIVE_INFINITY,
            preference: google.maps.StreetViewPreference.NEAREST,
        }, (data, status)=>{
            if (status === google.maps.StreetViewStatus.OK) {
                currentPanoData = data;
                map.setCenter(data.location.latLng);
                map.setZoom(18);
                map.setOptions({streetViewControl: true})
                elevation = position.coords.altitude || 0;
                streetviews[0].setPano(data.location.pano);
                // streetviews[1].setPano(data.location.pano);

                // Position the eye as a child of the pano entity
                eyeEntity.position = new Argon.Cesium.ConstantPositionProperty(Cartesian3.ZERO, panoEntity);
            } else if (status === google.maps.StreetViewStatus.ZERO_RESULTS) {
                // unable to find nearby panorama (what should we do?)
                alert('Unable to locate nearby streetview imagery.');
            } else {
                alert('Error retrieving panorama from streetview service');
            }
        })
    }, (e)=>{
        alert(e.message);
    }, {
        enableHighAccuracy:true
    })
});

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

// We need to define a projection matrix for our reality view
var perspectiveProjection = new Argon.Cesium.PerspectiveFrustum();
perspectiveProjection.fov = Math.PI / 2;

// Create an entity to represent the panorama
const panoEntity = new Argon.Cesium.Entity({
    position: new Argon.Cesium.ConstantPositionProperty(undefined, Argon.Cesium.ReferenceFrame.FIXED),
    orientation: new Argon.Cesium.ConstantProperty(Quaternion.IDENTITY)
})

// Create an entity to represent the eye
const eyeEntity = new Argon.Cesium.Entity({
    orientation: new Argon.Cesium.ConstantProperty(Quaternion.IDENTITY)
})

// Creating a lot of garbage slows everything down. Not fun.
// Let's create some recyclable objects that we can use later.
const scratchMatrix3 = new Matrix3;
const scratchCartesian = new Cartesian3;
const scratchQuaternion = new Quaternion;
const scratchQuaternionPitch = new Quaternion;
const scratchQuaternionHeading = new Quaternion;
const scratchArray = [];

const x90 = Quaternion.fromAxisAngle(Cartesian3.UNIT_X, Math.PI / 2);
const x90Neg = Quaternion.fromAxisAngle(Cartesian3.UNIT_X, - Math.PI / 2);

// disable location updates
app.device.locationUpdatesEnabled = false;

// keep track of our orientation mode
let deviceOrientationControlEnabled = true;
// was the last pose based on device orientation?
let manualPov = false;

// Reality views must raise frame events at regular intervals in order to 
// drive updates for the entire system. 
function onFrame(time, index:number) {

    // Get the current display-aligned device orientation relative to the device geolocation
    app.device.update();
    const deviceOrientation = Argon.getEntityOrientation(
        app.device.displayEntity, 
        time, 
        app.device.geolocationEntity, 
        scratchQuaternion
    );
    
    // Set the eye orientation according to the device orientation or directly from the streetview 
    if (deviceOrientation && deviceOrientationControlEnabled) {
        // First convert to EUS
        const deviceOrientationEUS = Quaternion.multiply(x90, deviceOrientation, deviceOrientation);
        // Then decompose into euler ZXY
        const rotMat = Matrix3.fromQuaternion(deviceOrientationEUS, scratchMatrix3);
        const eulerZXY = rotationMatrixToEulerZXY(rotMat, scratchCartesian);
        const heading = Math.PI - eulerZXY.y;
        const pitch = Math.PI + eulerZXY.x;
        const pitchValue = Quaternion.fromAxisAngle(Cartesian3.UNIT_X, pitch, scratchQuaternionPitch);
        const headingValue = Quaternion.fromAxisAngle(Cartesian3.UNIT_Y, heading, scratchQuaternionHeading)
        let orientationValue = Quaternion.multiply(headingValue, pitchValue, scratchQuaternionPitch);
        orientationValue = Quaternion.multiply(x90Neg, orientationValue, orientationValue);
        // const orientationValue = Quaternion.fromHeadingPitchRoll(heading, pitch, 0, scratchQuaternion);
        eyeEntity.orientation.setValue(orientationValue);
        manualPov = false;
    } else if (streetviews && streetviews[0].getPano()) {
        const pov = streetviews[0].getPov();
        const heading = - pov.heading * CesiumMath.RADIANS_PER_DEGREE;
        const pitch = pov.pitch * CesiumMath.RADIANS_PER_DEGREE;
        const pitchValue = Quaternion.fromAxisAngle(Cartesian3.UNIT_X, pitch, scratchQuaternionPitch);
        const headingValue = Quaternion.fromAxisAngle(Cartesian3.UNIT_Y, heading, scratchQuaternionHeading)
        let orientationValue = Quaternion.fromHeadingPitchRoll(-heading, 0, pitch + Math.PI/2, scratchQuaternion);
        // let orientationValue = Quaternion.multiply(headingValue, pitchValue, scratchQuaternionPitch);
        eyeEntity.orientation.setValue(orientationValue);
        manualPov = true;
    }

    let viewport = undefined;

    if (mapToggleControl.showing) {
        if (document.documentElement.clientWidth < document.documentElement.clientHeight) {
            viewport = app.reality.getMaximumViewport();
            viewport.height /= 2;
            viewport.y = viewport.height;
            mapElement.style.width = '100%';
            mapElement.style.height = '50%';
            mapElement.style.bottom = '0px';
        } else {
            viewport = app.reality.getMaximumViewport();
            viewport.width /= 2;
            mapElement.style.width = '50%';
            mapElement.style.height = '100%';
            mapElement.style.right = '0px';
        }
    }

    let frustum = undefined;

    if (app.focus.hasFocus) {
        const zoomLevel = streetviews[0].getZoom();
        const fovX = 90 * Math.pow(2,-zoomLevel+1) * CesiumMath.RADIANS_PER_DEGREE;
        const v = viewport || app.reality.getMaximumViewport(); 
        const aspect = v.width / v.height;
        frustum = {
            fov: aspect < 1 ? fovX / aspect : fovX, aspect
        }
    }
        
    // By raising a frame state event, we are describing to the  manager when and where we
    // are in the world, what direction we are looking, and how we are able to render. 
    app.reality.publishFrame({
        time,
        index,
        // A reality should pass an "eye" configuration to the manager. The manager will 
        // then construct an appropriate "view" configuration using the eye properties we 
        // send it and other factors unknown to the reality. 
        // For example, the manager may decide to ask applications (including this reality),
        // to render in stereo or in mono, based on wheter or not the user is using a 
        // stereo viewer. 
        // Technically, a reality can instead pass a view configuration to the manager, but 
        // the best practice is to use an eye configuration. Passing a view configuration 
        // is effectively the same thing as telling the manager:
        //      "I am going to render this way, like it or not, don't tell me otherwise"
        // Thus, a view configuration should only be used if absolutely necessary.
        eye: {
            // We provide a viewport when the map is visible
            viewport,
            // We provide a frustum when the user is manipulating the streetview directly
            frustum,
            // We must provide a pose representing where we are in world, 
            // and what we are looking at. The viewing direction is always the
            // -Z axis, assuming a right-handed cordinate system with Y pointing up
            // in the camera's local coordinate system. 
            pose: Argon.getSerializedEntityPose(eyeEntity, time),
            // The stereo multiplier tells the manager how we wish to render stereo
            // in relation to the user's interpupillary distance (typically around 0.063m).
            // In this case, since we are using a single panoramic image,
            // we can only render from the center of the panorama (a stereo view 
            // would have the same image in the left and right eyes): thus, we may prefer to use 
            // a stereo multiplier of 0. On the other hand, if our panorama presents a 
            // background that can be considered "far away" or at "infinity", we may prefer to 
            // allow stereo by passing a non-zero value as the multiplier. 
            stereoMultiplier:0,
        }
    })

    app.timer.requestFrame(onFrame);
}
// We can use requestAnimationFrame, or the builtin Argon.TimerService (app.timer),
// The TimerService is more convenient as it will provide the current time 
// as a Cesium.JulianDate object which can be used directly when raising a frame event. 
app.timer.requestFrame(onFrame)

let canvas:HTMLElement;
let compassControl:HTMLElement;

// set the reality into a reasonable state when not in focus
app.blurEvent.addEventListener(() => {
    mapToggleControl.showing = false;
    deviceOrientationControlEnabled = true; // ?
})

// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.addEventListener(() => {

    if (!streetviews || 
        streetviews[0].getStatus() !== google.maps.StreetViewStatus.OK || 
        !streetviews[0].getPano()) return;

    if (!canvas) {
        canvas = subviewElements[0].querySelector('canvas') as HTMLElement;
        canvas.addEventListener('touchstart', ()=>{
            deviceOrientationControlEnabled = false;
        });
    }
    
    if (!compassControl && streetviews[0].getVisible()) {
        compassControl = subviewElements[0].querySelector('.gm-compass') as HTMLElement;
        if (compassControl) {
            compassControl.style.overflow = 'hidden';
            compassControl.addEventListener('click',()=>{
                deviceOrientationControlEnabled = true;
            })
            var compassTurnControls = subviewElements[0].querySelectorAll('.gm-compass-turn');
            (compassTurnControls.item(0) as HTMLElement).style.display = 'none';
            (compassTurnControls.item(1) as HTMLElement).style.display = 'none';
        }
    } else {
        compassControl = null;
    }

    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    const viewport = app.view.getViewport();
    
    // there is 1 subview in monocular mode, 2 in stereo mode   
    const subviews = app.view.getSubviews();

    if (subviews.length < 2) {
        streetviews[1].setVisible(false);
        subviewElements[1].style.visibility = 'hidden';
    } else {
        mapToggleControl.showing = false;
        streetviews[1].setVisible(true);
        subviewElements[1].style.visibility = 'visible';
    }

    if (mapToggleControl.showing) {
        mapElement.style.visibility = 'visible';
    } else {
        mapElement.style.visibility = 'hidden';
    }

    for (let subview of subviews) {
        if (subview.index > 1) break;

        // set the viewport for this view
        const {x,y,width,height} = subview.viewport;
        const subviewElement = subviewElements[subview.index];
        const streetview = streetviews[subview.index];

        subviewElement.style.left = x + 'px';
        subviewElement.style.bottom = y + 'px';
        subviewElement.style.width = width + 'px';
        subviewElement.style.height = height + 'px';
        google.maps.event.trigger(streetview, 'resize');

        // get the heading / pitch / roll
        const rotMatrix = Matrix3.fromQuaternion(subview.pose.orientation, scratchMatrix3);
        const eulerZYX = rotationMatrixToEulerZXY(rotMatrix, scratchCartesian);

        // set the point of view appropriatley
        if (!manualPov) {
            streetview.setPov({
                heading: eulerZYX.y * CesiumMath.DEGREES_PER_RADIAN,
                pitch: - eulerZYX.x * CesiumMath.DEGREES_PER_RADIAN
            });

            // when in device orientation mode, hide pretty much all the UI
            subviewElement.style.visibility = 'hidden';
            (subviewElement.querySelector('canvas') as HTMLElement).style.visibility = 'visible';
            // make sure we don't hide the copyright / terms of use links / etc
            const alwaysShownElements = subviewElement.querySelectorAll('.gm-style-cc');
            for (let i = 0; i < alwaysShownElements.length; i++) {
                (alwaysShownElements.item(i) as HTMLElement).style.visibility = 'visible';
            }
        } else {
            subviewElement.style.visibility = 'visible';
            (subviewElement.querySelector('canvas') as HTMLElement).style.visibility = 'visible';
        }

        // set the fov
        if (!manualPov) {
            const fovy = subview.frustum.fovy * Argon.Cesium.CesiumMath.DEGREES_PER_RADIAN;
            const fovx = subview.frustum.aspectRatio * fovy;
            let zoomLevel = 1 - Math.log2(fovx / 90)
            // raise zoomLevel to 1.05 power because streetview is rendering slightly lower fov 
            // than expected, especially when zoomed in. 
            zoomLevel = Math.pow(zoomLevel,1.05);
            // apply the zoom level
            if (streetview.getZoom() !== zoomLevel)
                streetview.setZoom(zoomLevel); 
        }

        // apply the roll directly to the DOM elements... 
        // since the streetview api doesn't support setting the roll :(        
        // const transform = `rotate(${- eulerZYX.z * CesiumMath.DEGREES_PER_RADIAN}deg)`;
        // const canvas = subviewElement.querySelector('canvas') as HTMLCanvasElement;
        // const svg = subviewElement.querySelector('svg') as HTMLElement;
        // canvas.style.transform = transform;
        // svg.style.transform = transform;

        // apply the fov

    }
})

function rotationMatrixToEulerZXY(mat, result:Argon.Cesium.Cartesian3) { 

    const m11 = mat[Matrix3.COLUMN0ROW0];
    const m12 = mat[Matrix3.COLUMN0ROW1];
    const m13 = mat[Matrix3.COLUMN0ROW2];
    const m21 = mat[Matrix3.COLUMN1ROW0];
    const m22 = mat[Matrix3.COLUMN1ROW1];
    const m23 = mat[Matrix3.COLUMN1ROW2];
    const m31 = mat[Matrix3.COLUMN2ROW0];
    const m32 = mat[Matrix3.COLUMN2ROW1];
    const m33 = mat[Matrix3.COLUMN2ROW2];

    result.x = Math.asin( CesiumMath.clamp( m32, - 1, 1 ) );

    if ( Math.abs( m32 ) < 0.99999 ) {

        result.y = Math.atan2( - m31, m33 );
        result.z = Math.atan2( - m12, m22 );

    } else {

        result.y = 0;
        result.z = Math.atan2( m21, m11 );

    }

    return result;
}
