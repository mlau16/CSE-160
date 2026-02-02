# Assignment 2 - Blocky Animal (Sheep)

## Overview

This project renders a blocky 3D sheep using WebGL. The sheep is built primarily from cubes with hierarchical transformations for body parts. The scene supports camera rotation, mouse drag rotation, rotation sliders, animation toggles (Shift + click) and includes a non-cube primitive as a collar. A performance indicator displays FPS and ms/frame.

---
## Features

### Sliders
- Camera Angle: rotates the entire scene around the Y-axis.
- Rotate: rotates the sheep body
- Neck: rotates the neck joint (manual control when animation is OFF)
- Head: rotates the head joint.

### Buttons
- ON: Starts the sheep's galloping animation.
- OFF: Stops animation and manual sliders can be used.

### Mouse
- Click + Drag: rotates the sheep in the canvas.
- Shift + Click: triggers a special "poke" animation

---
## Files
- BlockyAnimal.html: Main webpage UI, canvas, sliders, buttons and FPS display
- BlockyAnimal.js: Main program logic - shaders, WebGL setup, UI hooks, rendering, animation and mouse controls
- Cube.js: Cube primitive built from triangles
- Sphere.js: Sphere primitive used for bell of collar
- Torus.js: Torus primitive used for sheep collar
- Triangle.js, Square.js, Circle.js, Target.js: asgn1 files
