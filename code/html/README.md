AR Music App
======

This application triggers songs when certain image targets are recognized. Instead of having to navigate to a website, a user with a mobile phone can just scan his or her phone over a few images to start hearing songs. Once a song is played, users can seek to other sections of the song or choose to add them to a list of saved songs. 

## How to run this app

Because I am using Vuforia image targets that have been configured to work only for certain domains (with a PGP key), the app won't work completely on a local environment. It can be run using any kind of server and navigating to 'index.html', but the vuforia markers will nto work. 

To access an online version of the app:
1. Download the Argon browser for an iPhone (currently the only way to view AR content created with web technologies): https://itunes.apple.com/us/app/argon3/id944297993?mt=8
2. Navigate to https://irealva.github.io/argon-AR-music/code/html/

## Problems encountered

In consideration of time, there were a few things I wanted, but did not get a chance to implement

* A cleaner UI
* More p5.js animations. Where each song would have gotten a unique animation
* An "onboarding" or "help" modal to explain the functionality of the app
* A more customizable music list that would allow a user to delete songs or export to their music library

## Relevance to course topics



## Online sources used

The argon documentation site: http://docs.argonjs.io/tutorial/
The generative design processing book for references: http://www.generative-gestaltung.de/
The p5.js reference page: https://p5js.org/reference/