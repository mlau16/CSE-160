// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;

  void main() {
    gl_Position = u_ModelMatrix * a_Position;
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


// class Point {
//   constructor(position, color, size) {
//     this.position = position;
//     this.color = color;
//     this.size = size;
//   }
  
//   render() {
//     gl.disableVertexAttribArray(a_Position);
//     //Set position
//     gl.vertexAttrib3f(
//       a_Position,
//       this.position[0],
//       this.position[1],
//       0.0
//     );

//     //Set color
//     gl.uniform4f(
//       u_FragColor,
//       this.color[0],
//       this.color[1],
//       this.color[2],
//       this.color[3]
//     );

//     let M = new Matrix4();
//     gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

//     //Set size
//     gl.uniform1f(u_Size, this.size);

//     //Draw
//     gl.drawArrays(gl.POINTS, 0, 1);
//   }
// }

function setupWebGL(){
   // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return false;
  }
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

  g_vertexBuffer = gl.createBuffer();
  if(!g_vertexBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }

  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);

}

function addActionsForHtmlUI() {
  const redSlider = document.getElementById('redSlide');
  const greenSlider = document.getElementById('greenSlide');
  const blueSlider = document.getElementById('blueSlide');
  const sizeSlider = document.getElementById('sizeSlide');
  const clearButton = document.getElementById('clearButton');
  const segSlider = document.getElementById('segSlide');

  document.getElementById('startGameButton').onclick = startGame;
  document.getElementById('stopGameButton').onclick = stopGame;

  document.getElementById('squareButton').onclick = () => {
    g_selectedType = "POINT";
  };

  document.getElementById('triangleButton').onclick = () => {
    g_selectedType = "TRIANGLE";
  };

  document.getElementById('circleButton').onclick = () => {
    g_selectedType = "CIRCLE";
  }

  clearButton.onclick = function () {
    g_shapesList = [];
    renderAllShapes();
  };

  function updateColorFromSliders() {
    const r = Number(redSlider.value) / 100;
    const g = Number(greenSlider.value) / 100;
    const b = Number(blueSlider.value) / 100;
    g_selectedColor = [r, g, b, 1.0];
  }

  function updateSizeFromSlider(){
    g_selectedSize = Number(sizeSlider.value);
  }

  function updateSegmentsFromSlider() {
    g_selectedSegments = Number(segSlider.value);
  }

  updateColorFromSliders();
  updateSizeFromSlider();
  updateSegmentsFromSlider();

  redSlider.addEventListener('input', updateColorFromSliders);
  greenSlider.addEventListener('input', updateColorFromSliders);
  blueSlider.addEventListener('input', updateColorFromSliders);
  sizeSlider.addEventListener('input', updateSizeFromSlider);
  segSlider.addEventListener('input', updateSegmentsFromSlider);
}

function handleClicks() {
  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;

  canvas.onmousemove = function (ev) {
    if (g_mode !== "PAINT") return;
    if (ev.buttons == 1) {
      click(ev);
    }
  }
}

function renderOneShape(shape) {
  shape.render();
}

function main() {
  if(!setupWebGL()) return;
  connectVariablesToGLSL();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  renderAllShapes();
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
  gl.clear(gl.COLOR_BUFFER_BIT);

  // var len = g_shapesList.length;
  // for(var i = 0; i < len; i++) {
  //   g_shapesList[i].render();
  // }

  //drawTriangle3D([-1.0,0.0,0.0, 0.5,-1.0,0.0, 0.0,0.0,0.0]);

  var body = new Cube();
  body.color = [1.0,0.0,0.0,1.0];
  body.matrix.translate(-0.25, -0.5, 0.0);
  body.matrix.scale(0.5, 1, 0.5);
  body.render();

  let head = new Cube();
  head.color = [1, 0.8, 0.6, 1];
  head.matrix.translate(-0.2, 0.2, 0);
  head.matrix.scale(0.4, 0.4, 0.3);
  head.render();

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

//Draw A Picture
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
