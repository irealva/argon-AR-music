/// <reference types="@argonjs/argon" />

// set up Argon
const app = Argon.init();

// set our desired reality 
app.reality.setDesired({
    title: 'My Nearest Streetview',
    uri: Argon.resolveURL('../streetview-reality/index.html')
})