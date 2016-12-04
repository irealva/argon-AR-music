var ctx = document.createElement('canvas').getContext('2d');
    var linGrad = ctx.createLinearGradient(0, 64, 0, 200);
    linGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1.000)');
    linGrad.addColorStop(0.5, 'rgba(183, 183, 183, 1.000)');

var wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: linGrad,
      progressColor: 'hsla(200, 100%, 30%, 0.5)',
      cursorColor: '#fff',
      // This parameter makes the waveform look like SoundCloud's player
      barWidth: 1,
      height: 20
});

function loadSong(string) {
  wavesurfer.load(string);
}

loadSong("song2.mp3");

// Regions
    if (wavesurfer.enableDragSelection) {
        wavesurfer.enableDragSelection({
            color: 'rgba(0, 255, 0, 0.1)'
        });
    }
    

/* buttons */

$('#question').on('click', function(event) {
  loadSong("song3.mp3");
  console.log("hi");
});