// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;

  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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
// let u_Size;
// let g_selectedSize = 20.0;

let g_vertexBuffer = null;
let g_selectedType = "POINT";

const g_circleSegments = 20;
let g_selectedSegments = 20;

let g_mode = "PAINT";

let g_score = 0;
let g_timeLeft = 30.0;
let g_gameLastTime = 0;
let g_spawnTimer = 0;

let g_targets = [];
const g_spawnInterval = 0.6;

let g_globalAngle = 0;
let u_GlobalRotateMatrix;

let g_rotateAngle = 0;
let g_rotateNeck = 0;

let g_modelAnimation = false;

let g_mouseRotX = 0;
let g_mouseRotY = 0;

let g_isDragging = false;
let g_lastX = 0;
let g_lastY = 0;

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

  //Get the storage location of u_Size
  // u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  // if(!u_Size) {
  //   console.log('Failed to get the storage location of u_Size');
  //   return;
  // }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if(!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if(!u_GlobalRotateMatrix){
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  g_vertexBuffer = gl.createBuffer();
  if(!g_vertexBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }

  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);

}

function addActionsForHtmlUI() {
  // const redSlider = document.getElementById('redSlide');
  // const greenSlider = document.getElementById('greenSlide');
  // const blueSlider = document.getElementById('blueSlide');
  // const sizeSlider = document.getElementById('sizeSlide');
  // const clearButton = document.getElementById('clearButton');
  // const segSlider = document.getElementById('segSlide');

  // document.getElementById('startGameButton').onclick = startGame;
  // document.getElementById('stopGameButton').onclick = stopGame;

  // document.getElementById('squareButton').onclick = () => {
  //   g_selectedType = "POINT";
  // };

  // document.getElementById('triangleButton').onclick = () => {
  //   g_selectedType = "TRIANGLE";
  // };

  // document.getElementById('circleButton').onclick = () => {
  //   g_selectedType = "CIRCLE";
  // }
  document.getElementById('animationOnButton').onclick = function() {g_modelAnimation=true;};
  document.getElementById('animationOffButton').onclick = function() {g_modelAnimation=false;};

  document.getElementById('angleSlide').addEventListener('input', function () {
    g_globalAngle = this.value;
    renderAllShapes();
  });

  document.getElementById('rotateSlide').addEventListener('input', function () {
    g_rotateAngle = this.value;
    renderAllShapes();
  });

  // clearButton.onclick = function () {
  //   g_shapesList = [];
  //   renderAllShapes();
  // };

  // function updateColorFromSliders() {
  //   const r = Number(redSlider.value) / 100;
  //   const g = Number(greenSlider.value) / 100;
  //   const b = Number(blueSlider.value) / 100;
  //   g_selectedColor = [r, g, b, 1.0];
  // }

  // function updateSizeFromSlider(){
  //   g_selectedSize = Number(sizeSlider.value);
  // }

  // function updateSegmentsFromSlider() {
  //   g_selectedSegments = Number(segSlider.value);
  // }

  // updateColorFromSliders();
  // updateSizeFromSlider();
  // updateSegmentsFromSlider();

  // redSlider.addEventListener('input', updateColorFromSliders);
  // greenSlider.addEventListener('input', updateColorFromSliders);
  // blueSlider.addEventListener('input', updateColorFromSliders);
  // sizeSlider.addEventListener('input', updateSizeFromSlider);
  // segSlider.addEventListener('input', updateSegmentsFromSlider);
}

// function handleClicks() {
//   // Register function (event handler) to be called on a mouse press
//   canvas.onmousedown = click;

//   canvas.onmousemove = function (ev) {
//     if (g_mode !== "PAINT") return;
//     if (ev.buttons == 1) {
//       click(ev);
//     }
//   }
// }

function addMouseControls() {
  canvas.onmousedown = (ev) => {
    g_isDragging = true;
    g_lastX = ev.clientX;
    g_lastY = ev.clientY;
  };

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

  //renderAllShapes();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  
  console.log(g_seconds);

  renderAllShapes();

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

function renderAllShapes(){
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);

  globalRotMat.rotate(g_mouseRotY, 0, 1, 0);
  globalRotMat.rotate(g_mouseRotX, 1, 0, 0);

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // var len = g_shapesList.length;
  // for(var i = 0; i < len; i++) {
  //   g_shapesList[i].render();
  // }

  //drawTriangle3D([-1.0,0.0,0.0, 0.5,-1.0,0.0, 0.0,0.0,0.0]);

  let body = new Matrix4();
  body.translate(0, 0, 0.2);
  body.rotate(g_rotateAngle, 0, 0, 1);
  let bodyCoords = new Matrix4(body);
  body.scale(0.5, 0.45, 0.8);
  drawCube(body, [1,1,1,1]);

  let wool = new Matrix4(bodyCoords);
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
  neck.scale(0.45, 0.5, 0.35);
  let neckCoords = new Matrix4(neck);
  drawCube(neck, [1,1,1,1]);

  let ring = new Torus();
  ring.color = [0.7, 0.1, 0.2, 1];
  ring.matrix = new Matrix4(neckCoords);
  ring.matrix.translate(0, -0.1, 0);
  ring.matrix.rotate(170, 1, 0, 0);
  ring.matrix.scale(1.2,1.2,1.3);
  let ringCoords = new Matrix4(ring.matrix);
  ring.render();

  let bell = new Sphere();
  bell.color = [0.8, 0.7, 0.2, 1];
  bell.matrix = new Matrix4(ringCoords);
  bell.matrix.translate(0, 0.15, 0.5);
  bell.matrix.scale(0.5, 0.5, 0.5);
  bell.render();

  let head = new Matrix4(neckCoords);
  head.translate(0, 0.25, -0.1);
  head.scale(0.8, 0.7, 1);
  let headCoords = new Matrix4(head);
  drawCube(head, [1,1,1,1]);

  let face = new Matrix4(headCoords);
  face.rotate(350, 1, 0, 0, 0);
  face.translate(0, -0.05, -0.45);
  face.scale(0.9, 0.65, 1.2);
  let faceCoords = new Matrix4(face);
  drawCube(face, [0.6, 0.6, 0.6, 1]);

  eyes = new Matrix4(faceCoords);
  eyes.translate(0.0, 0.2, -0.15);
  eyes.scale(1.05, 0.2, 0.15);
  drawCube(eyes, [0,0,0,1]);

  earL = new Matrix4(faceCoords);
  earL.translate(-0.65, 0.18, 0.17);
  earL.rotate(25, 0, 0, 1);
  earL.scale(0.8, 0.4, 0.4);
  drawCube(earL, [0.6,0.6,0.6,1]);

  earR = new Matrix4(faceCoords);
  earR.translate(0.65, 0.18, 0.17);
  earR.rotate(335, 0, 0, 1);
  earR.scale(0.8, 0.4, 0.4);
  drawCube(earR, [0.6, 0.6, 0.6, 1]);

  nose = new Matrix4(faceCoords);
  nose.translate(0, 0.2, -0.45);
  nose.scale(0.4, 0.2, 0.2);
  drawCube(nose, [0,0,0,1]);

  let bodyCoords2 = new Matrix4(body);

  const stride = 18;
  const speed = 5;
  const t = g_seconds * speed;

  let legFL = new Matrix4(bodyCoords2);
  legFL.translate(-0.33, -0.6, -0.37);
  if(g_modelAnimation){
    drawLeg(legFL, stride*Math.cos(t));
  } else {
    drawLeg(legFL, 0);
  }

  let legFR = new Matrix4(bodyCoords2);
  legFR.translate(0.33, -0.6, -0.37);
  if(g_modelAnimation){
    drawLeg(legFR, stride*Math.sin(t+Math.PI));
  } else {
    drawLeg(legFR, 0);
  }

  let legBL = new Matrix4(bodyCoords2);
  legBL.translate(-0.33, -0.6, 0.37);
  if(g_modelAnimation){
    drawLeg(legBL, stride*Math.sin(t+Math.PI));
  } else {
    drawLeg(legBL, 0);
  }

  let legBR = new Matrix4(bodyCoords2);
  legBR.translate(0.33, -0.6, 0.37);
  if(g_modelAnimation){
  drawLeg(legBR, stride*Math.cos(t));
  } else {
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

  tail.scale(0.5, 0.25, 0.25);
  
  drawCube(tail, [1,1,1,1]);

}

function drawCube(matrix, color){
  const c = new Cube();
  c.matrix = matrix;
  c.color = color;
  c.render();
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

//Game Mode Functions
function startGame() {
  g_mode = "GAME";
  g_score = 0;
  g_timeLeft = 30.0;
  g_targets = [];
  g_spawnTimer = 0;
  g_gameLastTime = performance.now();

  updateHUD();
  requestAnimationFrame(gameLoop);
}

function stopGame() {
  g_mode = "PAINT";
  updateHUD();
  renderAllShapes();
}

function spawnTarget() {
  const size = 18 + Math.random() * 18;
  const segments = 20;
  const r = size / 200;

  const x = (Math.random() * (2 - 2 * r)) - (1 - r);
  const y = (Math.random() * (2 - 2 * r)) - (1 - r);

  const speed = 0.4 + Math.random() *0.6;
  const angle = Math.random() * Math.PI * 2;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  const color = [Math.random(), Math.random(), Math.random(), 1.0];

  g_targets.push(new Target([x,y], color, size, segments, [vx, vy]));
}

function gameLoop(now) {
  if (g_mode !== "GAME") return;

  const dt = (now - g_gameLastTime) / 1000.0;
  g_gameLastTime = now;

  g_timeLeft -= dt;
  if (g_timeLeft <= 0) {
    g_timeLeft = 0;
    updateHUD();
    stopGame();
    return;
  }

  g_spawnTimer += dt;
  while (g_spawnTimer >= g_spawnInterval) {
    g_spawnTimer -= g_spawnInterval;
    spawnTarget();
  }

  for (const t of g_targets) t.update(dt);

  gl.clear(gl.COLOR_BUFFER_BIT);
  for (const t of g_targets) t.render();

  updateHUD();
  requestAnimationFrame(gameLoop);
}

//Click
function click(ev) {
  //Extract the event click and return it 
  let [x,y] = convertCoordinatesEventToGL(ev);

  if (g_mode === "GAME") {
    for (let i = g_targets.length - 1; i >= 0; i--) {
      const t = g_targets[i];
      const dx = x - t.position[0];
      const dy = y - t.position[1];
      const dist2 = dx*dx + dy*dy;
      const r = t.radiusClip();

      if (dist2 <= r*r) {
        g_targets.splice(i, 1);
        g_score += 1;
        updateHUD();
        break;
      }
    }
    return;
  }

  if (g_selectedType === "POINT") {
    let point = new Point(
      [x,y],
      [g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], 1.0],
      g_selectedSize
    );

    g_shapesList.push(point);
    point.render();
  } else if (g_selectedType === "TRIANGLE") {
    const t = new Triangle(
      [x,y],
      [g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], 1.0],
      g_selectedSize
    );
    g_shapesList.push(t);
    t.render();
  } else if (g_selectedType === "CIRCLE") {
    const c = new Circle(
      [x,y],
      [g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], 1.0],
      g_selectedSize,
      g_selectedSegments
    );
    g_shapesList.push(c);
    c.render();
  }
}

//Draw A Picture (asgn1)
function drawMyPicture() {
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
  //head
  drawTriangle([-0.2,  0.3,   0.0,  0.3,  -0.2,  0.5]);
  drawTriangle([ 0.0,  0.3,   0.0,  0.5,  -0.2,  0.5]);

  //neck
  drawTriangle([ -0.09,  0.3,   0.0,  0.3,  -0.09,  0.2]);
  drawTriangle([ 0.0,  0.2,   0.0,  0.3,  -0.09,  0.2]);
  drawTriangle([ 0.0,  0.2,   -0.045,  0.15,  -0.09,  0.2]);

  //body1
  drawTriangle([ 0.0,  0.25,   0.0,  0.4,  0.15,  0.25]);
  drawTriangle([ 0.15,  0.4,   0.0,  0.4,  0.15,  0.25]);

  //body2
  drawTriangle([ 0.15,  0.15, -0.045,  0.15,  0.0,  0.25]);
  drawTriangle([ 0.15,  0.15, 0.15,  0.25,  0.0,  0.25]);

  //tail
  drawTriangle([ 0.15,  0.15, 0.15,  0.25,  0.2,  0.2]);
  drawTriangle([ 0.2,  0.4, 0.15,  0.25,  0.2,  0.2]);
  drawTriangle([ 0.2,  0.4, 0.15,  0.25,  0.15,  0.4]);
  drawTriangle([ 0.2,  0.4, 0.2,  0.45,  0.15,  0.4]);
  drawTriangle([ 0.2,  0.2, 0.2,  0.45,  0.25,  0.35]);

  //gizzard
  gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
  drawTriangle([-0.2, 0.3, -0.15, 0.25, -0.09, 0.3]);
  drawTriangle([-0.2, 0.5, -0.23, 0.47, -0.2, 0.45]);
  drawTriangle([-0.2, 0.5, -0.15, 0.58, -0.06, 0.5]);

  //beak
  gl.uniform4f(u_FragColor, 1.0, 1.0, 0.0, 1.0);
  drawTriangle([-0.2, 0.3, -0.25, 0.35, -0.2, 0.4]);

  //f00t1(initials)
  drawTriangle([ -0.045,  0.08,   -0.045,  0.15,  -0.03,  0.11]);
  drawTriangle([ -0.044,  0.08,   0.037,  0.08,  0.0,  0.092]);
  drawTriangle([ -0.044,  0.08,   -0.045,  0.01,  -0.06,  0.05]);
  drawTriangle([ -0.045,  0.055,   -0.09,  0.01,  -0.06,  0.05]);
  drawTriangle([ -0.12,  0.05,   -0.075,  0.01,  -0.12,  0.08]);
  drawTriangle([ -0.12,  0.045,   -0.15,  0.01,  -0.12,  0.08]);

  //foot2
  drawTriangle([ 0.155,  0.08,   0.155,  0.15,  0.17,  0.11]);
  drawTriangle([ 0.156,  0.08,   0.237,  0.08,  0.2,  0.092]);
  drawTriangle([ 0.156,  0.08,   0.155,  0.01,  0.14,  0.05]);
  drawTriangle([ 0.155,  0.055,   0.11,  0.01,  0.14,  0.05]);
  drawTriangle([ 0.08,  0.05,   0.125,  0.01,  0.08,  0.08]);
  drawTriangle([ 0.08,  0.045,   0.05,  0.01,  0.08,  0.08]);

  //eye
  gl.uniform4f(u_FragColor, 0.0, 0.0, 0.0, 1.0);
  drawTriangle([ -0.13,  0.37,   -0.063,  0.43,  -0.13,  0.43]);
}
