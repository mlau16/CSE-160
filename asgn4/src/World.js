
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  varying vec2 v_UV;
  varying vec3 v_WorldPos;
  varying vec3 v_Normal;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_WorldPos = (u_ModelMatrix * a_Position).xyz;
    v_Normal = a_Normal;
  }`;

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;

  uniform sampler2D u_Sampler;
  uniform vec4 u_FragColor;
  uniform float u_texColorWeight;
  uniform float u_Time;
  uniform vec3 u_CamPos;
  uniform float u_IsWater;
  uniform float u_IsSky;
  uniform vec3 u_SkyTint;
  uniform vec3 u_LightDir;
  uniform float u_LightIntensity;
  uniform float u_Emissive;
  uniform float u_ShowNormals;

  varying vec3 v_WorldPos;
  varying vec2 v_UV;
  varying vec3 v_Normal;

  void main() {
    vec3 N = normalize(v_Normal);

    if (u_ShowNormals > 0.5) {
      gl_FragColor = vec4(N, 1.0);
      return;
    }

    vec4 texColor = texture2D(u_Sampler, v_UV);
    float t = u_texColorWeight;
    vec4 base = (1.0 - t) * u_FragColor + t * texColor;

    vec3 L = normalize(u_LightDir);

    float ndotl = max(dot(N, L), 0.0);
    float ambient = 0.25;
    float diff = 0.8 * ndotl;

    float lit = ambient + u_LightIntensity * diff;
    lit = clamp(lit, 0.0, 1.0);

    if (u_IsWater > 0.5) {
      vec2 uv = v_UV;

      uv.x += 0.02 * sin(uv.y * 30.0 + u_Time * 1.5);
      uv.y += 0.02 * sin(uv.x * 25.0 + u_Time * 1.2);

      vec4 ripTex = texture2D(u_Sampler, uv);
      vec4 ripBase = (1.0 - t) * u_FragColor + t * ripTex;

      vec3 V = normalize(u_CamPos - v_WorldPos);
      float fresnel = pow(1.0 - abs(V.y), 3.0);

      vec4 skyTint = vec4(0.15, 0.20, 0.35, 1.0);
      vec4 watery = mix(ripBase, skyTint, fresnel * 0.75);

      vec3 outRgb = watery.rgb * lit + watery.rgb * u_Emissive;
      gl_FragColor = vec4(clamp(outRgb, 0.0, 1.0), watery.a);
    } else if (u_IsSky > 0.5) {
      vec3 tinted = base.rgb * u_SkyTint;
      gl_FragColor = vec4(tinted, base.a);
      return;
    } else {
      vec3 outRgb = base.rgb * lit + base.rgb * u_Emissive;
      gl_FragColor = vec4(clamp(outRgb, 0.0, 1.0), base.a);
    }
  }`;

var g_shapesList = [];

let canvas;
var gl;
var a_Position;

var a_UV;
var a_Normal;

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

let g_woodTexture = null;
let g_woodReady = false;

let u_ShowNormals;
let g_showNormals = false;
let g_normalBuffer = null;

const TEX_SKY = 0;
const TEX_WOOD = 1;

const keys = Object.create(null);

const WORLD_W = 32;
const WORLD_D = 32;
let worldHeights = [];

let u_Time, u_CamPos, u_IsWater;

let camera;
const WATER_Y = -0.2;
const EYE_HEIGHT = 1.0;


function setupWebGL(){
   // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return false;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
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

  a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  if (a_Normal < 0) {
    console.log("Failed to get the storage location of a_Normal");
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

  u_Time = gl.getUniformLocation(gl.program, "u_Time");
  u_CamPos = gl.getUniformLocation(gl.program, "u_CamPos");
  u_IsWater = gl.getUniformLocation(gl.program, "u_IsWater");

  u_IsSky = gl.getUniformLocation(gl.program, "u_IsSky");
  u_SkyTint = gl.getUniformLocation(gl.program, "u_SkyTint");

  u_LightDir = gl.getUniformLocation(gl.program, "u_LightDir");
  u_LightIntensity = gl.getUniformLocation(gl.program, "u_LightIntensity");
  u_Emissive = gl.getUniformLocation(gl.program, "u_Emissive");
  if(!u_Emissive) {
    console.log('Failed to get the storage location of u_Emissive');
    return;
  }

  u_ShowNormals = gl.getUniformLocation(gl.program, "u_ShowNormals");
  if(!u_ShowNormals) {
    console.log("Failed to get the storage location of u_ShowNormals");
    return;
  }

  g_normalBuffer = gl.createBuffer();
    if(!g_normalBuffer) {
      console.log("Failed to create the Normal buffer object");
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

  gl.uniform1f(u_texColorWeight, 0.0);
  gl.uniform1f(u_Time, 0.0);
  gl.uniform3f(u_CamPos, 0.0, 0.0, 0.0);
  
  gl.uniform1f(u_ShowNormals, 0.0);

}

function initInput() {
  document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

  //canvas.addEventListener("click", () => canvas.requestPointerLock());

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();

      if(document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      } else {
        g_clickPick = true;
      }
    
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement !== canvas) return;

    const sens = 0.2;
    camera.panRight(e.movementX * sens);
    camera.panDown(e.movementY * sens);

  });
}

function updateCamera(dt) {
  const moveSpeed = 2.0 * dt;
  const panDeg = 90 * dt

  if(keys["w"]) camera.moveForward(moveSpeed);
  if(keys["s"]) camera.moveBackwards(moveSpeed);
  if(keys["a"]) camera.moveLeft(moveSpeed);
  if(keys["d"]) camera.moveRight(moveSpeed);

  if (keys["q"]) camera.panLeft(panDeg);
  if (keys["e"]) camera.panRight(panDeg);
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

  document.getElementById("btnNormals").onclick = () => {
    g_showNormals = !g_showNormals;
    document.getElementById("btnNormals").innerText = 
    g_showNormals ? "Normals: ON" : "Normals: OFF"
  }
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  g_unitCube = new Cube();
  g_torus = new Torus();
  g_sphere = new Sphere();

  camera = new Camera(canvas);
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
    loadTexture(g_texture0, u_Sampler, image, TEX_SKY);
    g_textureReady = true;
  };

  image.src = "img/lanternSky.jpg";

  g_woodTexture = gl.createTexture();
  const woodImg = new Image();
  woodImg.onload = () => {
    loadTexture(g_woodTexture, u_Sampler, woodImg, TEX_WOOD);
    g_woodReady = true;
  };
  woodImg.src = "img/wood.jpg";

  return true;
}

function loadTexture(texture, sample, image, unit) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(sample, unit);
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

function renderAllShapes(){
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1f(u_ShowNormals, g_showNormals ? 1.0 : 0.0);

  camera.updateProjection(canvas);

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  gl.uniform1f(u_Time, g_seconds);

  const e = camera.eye.elements;
  
  gl.uniform3f(u_CamPos, e[0], e[1], e[2]);

  gl.uniform1f(u_IsWater, 0.0);

  drawGround();
  //drawWorld();
}

function drawCube(matrix, color){
  g_unitCube.matrix = matrix;
  g_unitCube.color = color;
  g_unitCube.render();
}

function drawGround() {
  const g = new Matrix4();
  g.translate(0, -0.55, 0);
  g.scale(120, 0.1, 120);
  drawCube(g, [0.2, 0.6, 0.2, 1]);
}

function drawSky() {
  if (!g_textureReady) return;

  gl.activeTexture(gl.TEXTURE0 + TEX_SKY);
  gl.bindTexture(gl.TEXTURE_2D, g_texture0);
  gl.uniform1i(u_Sampler, TEX_SKY);

  gl.disable(gl.CULL_FACE);

  gl.depthMask(false);
  gl.uniform1f(u_IsWater, 0.0)
  gl.uniform1f(u_texColorWeight, 1.0);
  gl.uniform1f(u_IsSky, 1.0);

  const s = new Matrix4();
  const e = camera.eye.elements;
  s.translate(e[0], e[1], e[2]);
  s.scale(120, 120, 120);

  drawCube(s, [1, 1, 1, 1]);

  gl.uniform1f(u_texColorWeight, 0.0);
  gl.uniform1f(u_IsSky, 0.0);

  gl.depthMask(true);
  gl.enable(gl.CULL_FACE);
}

function drawMap(map) {
  const H = map.length;
  const W = map[0].length;

  for (let z = 0; z < H; z++) {
    for (let x = 0; x < W; x++) {
      const h = map[z][x];
      if (h <= 0) continue;

        const m = new Matrix4();
        m.translate(x - W/2, (h/2) - 0.5, z - H/2);
        m.scale(1, h, 1);

        gl.uniform1f(u_texColorWeight, 0.0);
        drawCube(m, [0.08, 0.08, 0.12, 1]);
      
    }
  }
}

function getCameraForwardFlat() {
  const e = camera.eye.elements;
  const a = camera.at.elements;

  let fx = a[0] - e[0];
  let fz = a[2] - e[2];

  const len = Math.hypot(fx, fz) || 1.0;
  fx /= len;
  fz /= len;

  return [fx, 0, fz];
}

function lockCameraToWater() {
  const targetY = WATER_Y + EYE_HEIGHT;

  const oldY = camera.eye.elements[1];
  const dy = targetY - oldY;
  camera.eye.elements[1] = targetY;
  camera.at.elements[1] += dy;

  camera.updateView();
}

function getFrontCell(step = 1.6) {
  const e = camera.eye.elements;
  const [fx, _, fz] = getCameraForwardFlat();

  const px = e[0] + fx * step;
  const pz = e[2] + fz * step;

  const H = map.length;
  const W = map[0].length;

  const ix = Math.floor(px + W / 2);
  const iz = Math.floor(pz + H / 2);

  if(ix < 0 || ix >= W || iz < 0 || iz >= H) return null;
  return { ix, iz };
}

function topYAtCell(ix, iz) {
  const h = map[iz][ix] || 0;
  return -0.5 + h;
}

function cellCenterWorld(ix, iz) {
  const H = map.length;
  const W = map[0].length;
  return {
    x: (ix + 0.5) - W / 2,
    z: (iz + 0.5) - H / 2
  }
}

function worldToCell(x, z) {
  const H = map.length;
  const W = map[0].length;
  const ix = Math.floor(x + W / 2);
  const iz = Math.floor(z + H / 2);
  if (ix < 0 || ix >= W || iz < 0 || iz >= H) return null;
  return {ix, iz};
}
