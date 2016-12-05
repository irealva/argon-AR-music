
/*
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
    

    */

/* buttons */

var saved = [];

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

var list = document.getElementById('music-list');
var main = document.getElementById('main');
var back1 = document.getElementById('back1');
var back2 = document.getElementById('back2');

$('#back').on('click', function(event) {
    hideMe(list);
    showMe(main);
    showMe(back1);
    showMe(back2);
});


var myp5;

$('#library').on('click', function(event) {
  hideMe(main);
  hideMe(back1);
  hideMe(back2);
    showMe(list);
});

$('#question').on('click', function(event) {
  loadSong("song3.mp3");
  console.log("hi");
});

function createSketch() {
  myp5 = new p5(s, 'myP5');
}

function destroySketch() {
  myp5.remove();
}


