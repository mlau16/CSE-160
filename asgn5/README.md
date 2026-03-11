# Assignment 5 - Exploring a High-Level Graphics Library

## Overview

This project is an interactive 3D cybercity block built using Three.js. The scene features a rainy nighttime environment with neon lights, procedural buildings, custom 3D models created in Blender, and atmospheric effects such as fog and lightning. The user can freely explore the scene using camera controls (RMB, LMB)

The goal of this project was to create a visually interesting envioronment while implementing multiple Three.js features such as lighting, textures, models, animation and environmental effects.

## Core Features

### Scene Setup
The scene uses a perspective camera with multiple 3D primitives and a directional light sources. The environment simulates a rainy street with buildings, neon signs and street lamps.

Primary shapes used:
- Cubes
- Cylinders
- Custom geometry
- Custom imported models

### Camera Controls
The scene uses Orbitcontrols which allows the user to explore the environment

Users can:
- Rotate around the scene (LMB)
- Zoom in and out (Scroll Wheel)
- Pan around the city (RMB)

### Lighting System
This scene contains multiple light sources, creating a dynamic nighttime environment.

-Directional Light-
Simulates moonlight or general illumination for the environment.

-Ambient Light-
Provides base lighting so objects remain visible in darker areas.

-Point Lights-
Used in:
- Neon signs
- Building windows
- Street lamps

these lights create the colorful glow in the scene

-Lighting Effect-
A randomized lightning flash periodically illuminates the entire scene using a high-intensity directional light. This briefly brightens the environment and enhances the storm atmosphere.

### Skybox
A cubemap skybox surrounds the scene to simulate a nighttime sky.

### Textured Objects
The scene has textured objects to improve realism

-Road Texture-
A custom asphalt texture created in Blender is applied to road models to simulate wet pavement.

-Building-
Windows use glowing materials to simulate illuminated rooms and one building model is textured from Blender.

### Skyline Generation
A procedural system generates distant skyscrapers around the main city block.

The skyline is generated using loops that create randomly sized buildings outside the central area. This creates a large urban environment without manually placing every structure.

Each building also receives randomly colored glowing windows to simulate city activity.

### Rain
A particle system was implemented using BufferGeometry and PointsMaterial to simulate falling rain.
The rain drops randomly above the scene, falls downward at varying speeds and resets when they reach the ground, creating a continuous rainfall effect.

### Fog
Exponential fog is used to give depth to the scene and create a misty, rainy atmosphere.

This helps distant buildings fade into the background and enhances the nighttime aesthetic.

### Wow! Features
- Rain particle system
- Random lighting storm effect
- Procedural skyline generation
- Neon lighting
- Reflective road

## Technologies Used
- Three.js
- JavaScript
- Blender

