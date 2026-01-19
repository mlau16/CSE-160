# Assignment 1 - Painting

## Overview

This project is an interactive WebGL application built using JavaScript and HTML. It allows users to draw geometric shapes (squares, triangles and circles) on a canvas, customize colors and sizes and interact with the scene using mouse input. The project also includes a custom drawing made entirely of triangles and an additional "awesomeness" feature: a target practice mini-game.

This application is built from the examples "ColoredPoints.js" and "HelloPoints1.js" in Matsuda & Lea's WebGL Programming Guide and refactored into a clean, object-oriented structure for scalability.

---
## Features

### Basic Drawing
- WebGL canvas initialized using custom shaders
- Click to draw shapes on the canvas
- Click and drag to continuously draw shapes
- Supports Squares, Triangles and Circles
- Shapes are stored in a single shapesList 

### Shape Controls
- RGB Sliders to control shape color
- Size Slider to control point size and shape scale
- Circle Segments Slider to control circle segments
- Buttons to switch between shapes
- Clear Canvas button to remove all drawn shapes on canvas

### Custom Triangle Picture

Created a reference drawing on Procreate on iPad and screenshotted. Using this reference, A detailed picture of a chicken was recreated using 20+ WebGL Triangles. The chicken's feet signs my initials 'ML'.
- Triggered by a button on the webpage
- Drawn using drawTriangle() calls
- Uses only computer graphics
- The reference image is displayed on page for comparison

---
## Mini Game

### Description

A target practice mini-game was added as an additional feature to fit the "awesomeness" requirement for the assignment.

### How it Works
- Click on Start Target Practice to begin the game
- Moving circular targets will spawn randomly on the screen
- Targets bounce around the canvas
- Click the targets to score a point
- Game lasts for 30 seconds
- Score and remaining time are displayed live
- Click Stop Game to return to painting mode

---
## Files
- ColoredPoints.html - HTML structure and UI
- ColoredPoints.js - main application logic
- Triangle.js - triangle shape class
- Circle.js - circle shape class
- Target.js - target practice game logic
- chicken.jpg - reference image

