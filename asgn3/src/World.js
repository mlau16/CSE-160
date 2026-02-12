// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  varying vec2 v_UV;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;

  uniform sampler2D u_Sampler;
  uniform vec4 u_FragColor;
  uniform float u_texColorWeight;
 
  varying vec2 v_UV;

  void main() {
    vec4 texColor = texture2D(u_Sampler, v_UV);
    float t = u_texColorWeight;
    gl_FragColor = (1.0 - t) * u_FragColor + t * texColor;
  }`;

var g_shapesList = [];

let canvas;
var gl;
var a_Position;

var a_UV;

var u_FragColor;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];

var u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;

var u_texColorWeight;

var g_vertexBuffer = null;
let g_selectedType = "POINT";

var g_uvBuffer = null;

let g_selectedSegments = 20;

let g_rotateAngle = 0;
let g_rotateNeck = 0;
let g_rotateHead = 0;

let g_modelAnimation = false;

let g_isDragging = false;
let g_lastX = 0;
let g_lastY = 0;

let g_explodeDirs = null;

let g_perfLast = performance.now();
let g_perfFrames = 0;
let g_perfFps = 0;
let g_perfMs = 0;

let g_unitCube = null;
let g_torus = null;
let g_sphere = null;

let g_prevTime = performance.now()/1000.0;

let u_Sampler;
let g_texture0 = null;
let g_textureReady = false;

const keys = Object.create(null);
const cam = {
  pos: [0, 1.5, 6],
  yaw: 0,
  pitch: 0
};

const WORLD_W = 32;
const WORLD_D = 32;
let worldHeights = [];

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

  gl.useProgram(gl.program);

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
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

   u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');

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

  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage locationof u_Sampler');
    return;
  }

  window.g_vertexBuffer = gl.createBuffer();
  if(!window.g_vertexBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }

  window.g_uvBuffer = gl.createBuffer();
  if (!window.g_uvBuffer) {
    console.log('Failed to create the UV buffer object');
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

}

function initInput() {
  document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

  canvas.addEventListener("click", () => canvas.requestPointerLock());

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement !== canvas) return;

    const sens = 0.0025;
    cam.yaw += e.movementX * sens;
    cam.pitch -= e.movementY * sens;

    const maxPitch = Math.PI/2 -0.01;
    cam.pitch = Math.max(-maxPitch, Math.min(maxPitch, cam.pitch));
  });
}

function getForward(yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  return [sy*cp, sp, -cy*cp];
}

function getRight(yaw) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  return [cy, 0, sy];
}

function updateCamera(dt) {
  const speed = 4.0 * dt;
  const turn = 2.0 * dt;
  
  const f = getForward(cam.yaw, 0);
  const r = getRight(cam.yaw);

  if(keys["w"]) { cam.pos[0] += f[0]*speed; cam.pos[2] += f[2]*speed; }
  if(keys["s"]) { cam.pos[0] -= f[0]*speed; cam.pos[2] -= f[2]*speed; }
  if(keys["a"]) { cam.pos[0] -= r[0]*speed; cam.pos[2] -= r[2]*speed; }
  if(keys["d"]) { cam.pos[0] += r[0]*speed; cam.pos[2] += r[2]*speed; }

  if (keys["q"]) cam.yaw += turn;
  if (keys["e"]) cam.yaw -= turn;
}

function renderOneShape(shape) {
  shape.render();
}

function main() {
  if(!setupWebGL()) return;
  connectVariablesToGLSL();
  if (!gl.program) return; 
  initTextures();
  initInput();
  addActionsForHtmlUI();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  g_unitCube = new Cube();
  g_torus = new Torus();
  g_sphere = new Sphere();

  initWorld();

  //renderAllShapes();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  const now = performance.now()/1000.0;
  const dt = now - g_prevTime;
  g_prevTime = now;
  g_seconds = now - g_startTime;
  
  //console.log(g_seconds);

  const start = performance.now();
  updateCamera(dt);
  renderAllShapes();
  const end = performance.now();

  g_perfMs = 0.9 * g_perfMs + 0.1 * (end - start);

  g_perfFrames++;
  const nowMs = performance.now();
  if(nowMs - g_perfLast >= 250) {
    g_perfFps = (g_perfFrames * 1000) / (nowMs - g_perfLast);
    g_perfFrames = 0;
    g_perfLast = nowMs;

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

function initTextures() {
  g_texture0 = gl.createTexture();
  if(!g_texture0) {
    console.log('Faled to create the texture object');
    return false;
  }

  const image = new Image();
  image.onload = function() {
    loadTexture(g_texture0, u_Sampler, image);
    g_textureReady = true;
  };

  image.src = "img/sky.jpg";

  return true;
}

function loadTexture(texture, sample, image) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(sample, 0);
}

function initWorld() {
  worldHeights = [];
  const cx = WORLD_W /2;
  const cz = WORLD_D /2;

  for (let z = 0; z < WORLD_D; z++) {
    const row = [];
    for (let x = 0; x < WORLD_W; x++) {
      const dx = x - cx;
      const dz = z - cz;
      const d = Math.sqrt(dx*dx + dz*dz);

      let h = Math.floor((d-9) / 4);
      h = Math.max(0, Math.min(4,h));

      if (z > 20) h = Math.max(0, Math.min(4, h + 1));

      row.push(h);
    }
    worldHeights.push(row);
  }
}

function drawWorld() {
  for (let z = 0; z < WORLD_D; z++) {
    for(let x = 0; x < WORLD_W; x++) {
      const h = worldHeights[z][x];

      const wx = x - WORLD_W/2;
      const wz = z - WORLD_D/2;

      if (h === 0) {
        const w = new Matrix4();
        w.translate(wx, -0.05, wz);
        w.scale(1, 0.05, 1);
        drawCube(w, [0.1, 0.3, 0.8, 1]);
        continue;
      }

      for (let y = 0; y < h; y++) {
        const m = new Matrix4();
        m.translate(wx, y, wz);

        const c = (y === h - 1) ? [0.2, 0.7, 0.2, 1] : [0.45, 0.45, 0.45, 1];
        drawCube(m, c);
      }
    }
  }
}

function renderAllShapes(){
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let proj = new Matrix4();
  proj.setPerspective(60, canvas.width / canvas.height, 0.1, 300);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, proj.elements);

  const f = getForward(cam.yaw, cam.pitch);
  let view = new Matrix4();
  view.setLookAt(
    cam.pos[0],cam.pos[1],cam.pos[2], 
    cam.pos[0] + f[0],cam.pos[1] + f[1],cam.pos[2] + f[2], 
    0,1,0
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, view.elements);

  drawSky();
  drawGround();
  drawWorld();

  let body = new Matrix4();
  body.translate(0, 0, 0.2);
  body.rotate(g_rotateAngle, 0, 0, 1);
  body.scale(0.5, 0.45, 0.8);
  drawCube(body, [1,1,1,1]);
}

function drawCube(matrix, color){
  g_unitCube.matrix = matrix;
  g_unitCube.color = color;
  g_unitCube.render();
}

function drawGround() {
  const g = new Matrix4();
  g.translate(0, -0.55, 0);
  g.scale(32, 0.1, 32);
  drawCube(g, [0.2, 0.6, 0.2, 1]);
}

function drawSky() {
  const s = new Matrix4();
  s.translate(cam.pos[0], cam.pos[1], cam.pos[2]);
  s.scale(120, 120, 120);
  drawCube(s, [0.05, 0.08, 0.2, 1]);
}

function updateHUD() { 
  const scoreText = document.getElementById('scoreText');
  const timeText = document.getElementById('timeText');

  if (scoreText) scoreText.innerText = String(g_score);
  if (timeText) timeText.innerText = g_timeLeft.toFixed(1);
}

