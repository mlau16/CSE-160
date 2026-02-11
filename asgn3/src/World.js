// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

var g_shapesList = [];

let canvas;
let gl;
let a_Position;

let u_FragColor;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];

let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;

let g_vertexBuffer = null;
let g_selectedType = "POINT";

let g_selectedSegments = 20;

let g_rotateAngle = 0;
let g_rotateNeck = 0;
let g_rotateHead = 0;

let g_modelAnimation = false;

let g_isDragging = false;
let g_lastX = 0;
let g_lastY = 0;

let g_pokeActive = false;
let g_pokeStart = 0;
let g_pokeDuration = 2;

let g_explodeDirs = null;

let g_perfLast = performance.now();
let g_perfFrames = 0;
let g_perfFps = 0;
let g_perfMs = 0;

let g_unitCube = null;
let g_torus = null;
let g_sphere = null;

function setupWebGL(){
   // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return false;
  }
  gl.enable(gl.DEPTH_TEST);
  return true;

}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if(!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if(!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if(!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  g_vertexBuffer = gl.createBuffer();
  if(!g_vertexBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }

  let identity = new Matrix4();
  let view = new Matrix4();
  let proj = new Matrix4();

  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, view.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, proj.elements);

}

function addActionsForHtmlUI() {

  document.getElementById('animationOnButton').onclick = function() {g_modelAnimation=true;};
  document.getElementById('animationOffButton').onclick = function() {g_modelAnimation=false;};

  document.getElementById('rotateSlide').addEventListener('input', function () {
    g_rotateAngle = this.value;
    renderAllShapes();
  });

  document.getElementById('neckSlide').addEventListener('input', function () {
    g_rotateNeck = this.value;
    renderAllShapes();
  });
  
  document.getElementById('headSlide').addEventListener('input', function () {
    g_rotateHead = this.value;
    renderAllShapes();
  })
 }

function addMouseControls() {

  canvas.onmousedown = (ev) => {
    if(ev.shiftKey) {
      triggerPoke();
      ev.preventDefault();
      return;
    }

    g_isDragging = true;
    g_lastX = ev.clientX;
    g_lastY = ev.clientY;
  }
  canvas.onmouseup = () => { g_isDragging = false; };
  canvas.onmouseleave = () => { g_isDragging = false; };

  canvas.onmousemove = (ev) => {
    if (!g_isDragging) return;

    const dx = ev.clientX - g_lastX;
    const dy = ev.clientY - g_lastY;

    g_lastX = ev.clientX;
    g_lastY = ev.clientY;

    const sens = 0.4;

    g_mouseRotY -= dx * sens;
    g_mouseRotX -= dy * sens;

  }
}

function triggerPoke(){
  g_pokeActive = true;
  g_pokeStart = g_seconds;

  g_explodeDirs = {
    body: randDir(), wool: randDir(), neck: randDir(), head: randDir(),
    face: randDir(), eyes: randDir(), earL: randDir(), earR: randDir(),
    nose: randDir(),
    legFL: randDir(), legFR: randDir(), legBL: randDir(), legBR: randDir(),
    tail: randDir(), ring: randDir(), bell: randDir()
  };
}

function randDir() {
  let x = (Math.random()*2 - 1);
  let y = (Math.random()*2 - 0.2);
  let z = (Math.random()*2 - 1);
  const len = Math.hypot(x,y,z) || 1;
  return [x/len, y/len, z/len];
}

function renderOneShape(shape) {
  shape.render();
}

function main() {
  if(!setupWebGL()) return;
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  addMouseControls();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  g_unitCube = new Cube();
  g_torus = new Torus();
  g_sphere = new Sphere();

  //renderAllShapes();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  
  console.log(g_seconds);

  if(g_pokeActive && (g_seconds - g_pokeStart) > g_pokeDuration) {
    g_pokeActive = false;
    g_explodeDirs = null;
  }

  const start = performance.now();
  renderAllShapes();
  const end = performance.now();

  g_perfMs = 0.9 * g_perfMs + 0.1 * (end - start);

  g_perfFrames++;
  const now = performance.now();
  if(now - g_perfLast >= 250) {
    g_perfFps = (g_perfFrames * 1000) / (now - g_perfLast);
    g_perfFrames = 0;
    g_perfLast = now;

    const perfDiv = document.getElementById("perf");
    if(perfDiv) {
      perfDiv.innerText = `FPS: ${g_perfFps.toFixed(1)} | ms/frame: ${g_perfMs.toFixed(2)}`;
    }
  }

  requestAnimationFrame(tick);
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

function applyExplosion(mat, dir, strength) {
  if (!g_pokeActive || !dir) return;

  const t = (g_seconds - g_pokeStart) / g_pokeDuration;
  const clamped = Math.max(0, Math.min(1, t));

  const ease = 1 - Math.pow(1 - clamped, 3);
  const grav = 0.6 * clamped * clamped;

  const dx = dir[0] * strength * ease;
  const dy = dir[1] * strength * ease - grav;
  const dz = dir[2] * strength * ease;

  mat.translate(dx, dy, dz);

  mat.rotate(360 * ease, dir[0], dir[1], dir[2]);
}
function renderAllShapes(){
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let pokeT = 0;
  if(g_pokeActive) {
    pokeT = (g_seconds - g_pokeStart) / g_pokeDuration;
    pokeT = Math.max(0, Math.min(1, pokeT));
  }

  let body = new Matrix4();
  body.translate(0, 0, 0.2);
  body.rotate(g_rotateAngle, 0, 0, 1);
  let bodyCoords = new Matrix4(body);
  applyExplosion(body, g_explodeDirs?.body, 1.8);
  body.scale(0.5, 0.45, 0.8);
  drawCube(body, [1,1,1,1]);

  let wool = new Matrix4(bodyCoords);
  applyExplosion(wool, g_explodeDirs?.wool, 1.5);
  wool.scale(0.65, 0.6, 0.6);
  drawCube(wool, [1,1,1,1]);

  let neck = new Matrix4(bodyCoords);
  neck.translate(0, 0.25, -0.35);

  neck.translate(0.5, 0.0, 0.0);
  if(g_modelAnimation){
  neck.rotate(15*Math.sin(g_seconds * 4) - 30, 1, 0, 0);
  } else {
    neck.rotate(g_rotateNeck, 1, 0, 0);
  }
  neck.translate(-0.5, -0.0, -0.0);
  applyExplosion(neck, g_explodeDirs?.neck, 2);
  neck.scale(0.45, 0.5, 0.35);
  let neckCoords = new Matrix4(neck);
  drawCube(neck, [1,1,1,1]);

  g_torus.color = [0.7, 0.1, 0.2, 1];
  g_torus.matrix = new Matrix4(neckCoords);
  g_torus.matrix.translate(0, -0.1, 0);
  g_torus.matrix.rotate(170, 1, 0, 0);
  applyExplosion(g_torus.matrix, g_explodeDirs?.ring, 1.9);
  g_torus.matrix.scale(1.2,1.2,1.3);
  let ringCoords = new Matrix4(g_torus.matrix);
  g_torus.render();

  g_sphere.color = [0.8, 0.7, 0.2, 1];
  g_sphere.matrix = new Matrix4(ringCoords);
  g_sphere.matrix.translate(0, 0.15, 0.5);
  applyExplosion(g_sphere.matrix, g_explodeDirs?.bell, 1.7);
  g_sphere.matrix.scale(0.5, 0.5, 0.5);
  g_sphere.render();

  let head = new Matrix4(neckCoords);
  head.translate(0, 0.25, -0.1);
  applyExplosion(head, g_explodeDirs?.head, 2);
  head.scale(0.8, 0.7, 1);
  head.rotate(g_rotateHead, 1, 0, 0);
  let headCoords = new Matrix4(head);
  drawCube(head, [1,1,1,1]);

  let face = new Matrix4(headCoords);
  face.rotate(350, 1, 0, 0);
  face.translate(0, -0.05, -0.45);
  applyExplosion(face, g_explodeDirs?.face, 2.2);
  face.scale(0.9, 0.65, 1.2);
  let faceCoords = new Matrix4(face);
  drawCube(face, [0.6, 0.6, 0.6, 1]);

  eyes = new Matrix4(faceCoords);
  eyes.translate(0.0, 0.2, -0.15);
  applyExplosion(eyes, g_explodeDirs?.eyes, 2);
  eyes.scale(1.05, 0.2, 0.15);
  drawCube(eyes, [0,0,0,1]);

  earL = new Matrix4(faceCoords);
  earL.translate(-0.65, 0.18, 0.17);
  earL.rotate(25, 0, 0, 1);
  applyExplosion(earL, g_explodeDirs?.earL, 1.9);
  earL.scale(0.8, 0.4, 0.4);
  drawCube(earL, [0.6,0.6,0.6,1]);

  earR = new Matrix4(faceCoords);
  earR.translate(0.65, 0.18, 0.17);
  earR.rotate(335, 0, 0, 1);
  applyExplosion(earR, g_explodeDirs?.earR, 1.9);
  earR.scale(0.8, 0.4, 0.4);
  drawCube(earR, [0.6, 0.6, 0.6, 1]);

  nose = new Matrix4(faceCoords);
  nose.translate(0, 0.2, -0.45);
  nose.scale(0.4, 0.2, 0.2);
  applyExplosion(nose, g_explodeDirs?.nose, 1.8);
  drawCube(nose, [0,0,0,1]);

  let bodyCoords2 = new Matrix4(body);

  const stride = 18;
  const speed = 5;
  const t = g_seconds * speed;

  let legFL = new Matrix4(bodyCoords2);
  legFL.translate(-0.33, -0.6, -0.37);
  if(g_modelAnimation){
    applyExplosion(legFL, g_explodeDirs?.legFL, 2);
    drawLeg(legFL, stride*Math.cos(t));
  } else {
    applyExplosion(legFL, g_explodeDirs?.legFL, 2);
    drawLeg(legFL, 0);
  }

  let legFR = new Matrix4(bodyCoords2);
  legFR.translate(0.33, -0.6, -0.37);
  if(g_modelAnimation){
    applyExplosion(legFR, g_explodeDirs?.legFR, 2);
    drawLeg(legFR, stride*Math.sin(t+Math.PI));
  } else {
    applyExplosion(legFR, g_explodeDirs?.legFR, 2);
    drawLeg(legFR, 0);
  }

  let legBL = new Matrix4(bodyCoords2);
  legBL.translate(-0.33, -0.6, 0.37);
  if(g_modelAnimation){
    applyExplosion(legBL, g_explodeDirs?.legBL, 2);
    drawLeg(legBL, stride*Math.sin(t+Math.PI));
  } else {
    applyExplosion(legBL, g_explodeDirs?.legBL, 2);
    drawLeg(legBL, 0);
  }

  let legBR = new Matrix4(bodyCoords2);
  legBR.translate(0.33, -0.6, 0.37);
  if(g_modelAnimation){
    applyExplosion(legBR, g_explodeDirs?.legBR, 2);
    drawLeg(legBR, stride*Math.cos(t));
  } else {
    applyExplosion(legBR, g_explodeDirs?.legBR, 2);
    drawLeg(legBR, 0);
  }

  tail = new Matrix4(bodyCoords2)

  tail.translate(0.0, 0.33, 0.5);

  if(g_modelAnimation){
  tail.rotate(15*Math.sin(g_seconds * 10), 0, 1, 0);
  } else {
    tail.rotate(0, 0, 1, 0);
  }
  tail.rotate(120, 1, 0, 0);
  applyExplosion(tail, g_explodeDirs?.tail, 1.8);
  tail.scale(0.5, 0.25, 0.25);
  
  drawCube(tail, [1,1,1,1]);

}

function drawCube(matrix, color){
  g_unitCube.matrix = matrix;
  g_unitCube.color = color;
  g_unitCube.render();
}

function drawLeg(baseMat, hipAngleDeg) {
  const upperColor = [1,1,1,1];
  const lowerColor = [1,1,1,1];
  const footColor = [0.3, 0.3, 0.3, 1];

  let hip = new Matrix4(baseMat);
  hip.rotate(hipAngleDeg, 1, 0, 0);

  let upper = new Matrix4(hip);
  upper.scale(0.35, 0.4, 0.25);
  drawCube(upper, upperColor);

  const forward = Math.max(0, hipAngleDeg);
  const kneeAngle = -forward * 0.7;

  let knee = new Matrix4(hip);
  knee.translate(0, -0.23, 0);
  knee.rotate(kneeAngle, 1, 0, 0);

  let lower = new Matrix4(knee);
  lower.scale(0.25, 0.35, 0.15);
  drawCube(lower, lowerColor);

  const ankleAngle = -(hipAngleDeg + kneeAngle) * 0.35;

  let ankle = new Matrix4(knee);
  ankle.translate(0, -0.25, 0);
  ankle.rotate(ankleAngle, 1, 0, 0);

  let foot = new Matrix4(ankle);
  foot.scale(0.25, 0.15, 0.1);
  drawCube(foot, footColor);

}

function updateHUD() { 
  const scoreText = document.getElementById('scoreText');
  const timeText = document.getElementById('timeText');

  if (scoreText) scoreText.innerText = String(g_score);
  if (timeText) timeText.innerText = g_timeLeft.toFixed(1);
}

