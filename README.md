AR Music App
======

This application triggers songs when certain image targets are recognized. Instead of having to navigate to a website, a user with a mobile phone can just scan his or her phone over a few images to start hearing songs. Once a song is played, users can seek to other sections of the song or choose to add them to a list of saved songs. 

## How to run this app

Because I am using Vuforia image targets that have been configured to work only for certain domains (with a PGP key), the app won't work completely on a local environment. It can be run using any kind of server and navigating to 'index.html', but the vuforia markers will nto work. 

To access an online version of the app:
1. Download the Argon browser for an iPhone (currently the only way to view AR content created with web technologies): https://itunes.apple.com/us/app/argon3/id944297993?mt=8
2. Navigate to https://irealva.github.io/argon-AR-music/code/html/
3. Open one of the images in the 'imagetargets' folder and point your phone towards it

## Problems encountered

In consideration of time, there were a few things I wanted, but did not get a chance to implement

* A cleaner UI
* More p5.js animations. Where each song would have gotten a unique animation
* An "onboarding" or "help" modal to explain the functionality of the app
* A more customizable music list that would allow a user to delete songs or export to their music library

## Relevance to course topics

Because I was venturing into a medium that is not well developed yet, a lot of this project consisted in simply figuring out how to work within an AR context and what UI would make sense for a project like this. I was trying to keep in mind principles from the mobile & ubicomp lecture, in exploring new interaction techniques with the devices we carry everyday. Though the final code turned out to be not so long, I went through many many iterations to understand how the 3D world of AR works (the camera, user, and scene tracking are all in 3D), as well as how to add content that would be translucent to the scene and appropriately viewable. 

In using a frame to guide the user on how to position an image tracker, as well as a p5.js animation to signal when an image has been successfully recognized, I ventured into the topic of drawing, recovery from damage, and event handling. I had to make sure that all the elements were drawn in exactly the right order so as to not hide the reality behind all of the divs (i.e. a lot of transparent and clipped material). I also ended up clipping parts of my canvas to make it fit to the UI I was going for. 

I even encounctered issues of frame rates on mobile phones. The p5.js animation works much better on a desktop, but runs significantly slower on a phone, even after I spent some time optimizing it. 

One open question I have is how fitts law applies to a use case like this... I was trying to keep in mind how to make the interaction easy and error free for the user, but in many ways the Neilsen Heuristics proved to be more useful. 

## Online sources used

The argon documentation site: http://docs.argonjs.io/tutorial/
The generative design processing book for references: http://www.generative-gestaltung.de/
The p5.js reference page: https://p5js.org/reference/