
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
    v_Normal = normalize((u_ModelMatrix * vec4(a_Normal, 0.0)).xyz);
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
  uniform vec3 u_LightDir;
  uniform float u_LightIntensity;
  uniform float u_Emissive;

  varying vec3 v_WorldPos;
  varying vec2 v_UV;
  varying vec3 v_Normal;

  void main() {
    vec4 texColor = texture2D(u_Sampler, v_UV);
    float t = u_texColorWeight;
    vec4 base = (1.0 - t) * u_FragColor + t * texColor;

    vec3 N = normalize(v_Normal);
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

const keys = Object.create(null);

const WORLD_W = 32;
const WORLD_D = 32;
let worldHeights = [];

let map = drawDetails();

let u_Time, u_CamPos, u_IsWater;

let camera;
const WATER_Y = -0.2;
const EYE_HEIGHT = 1.0;

let lanterns = [];

let u_LightDir, u_LightIntensity;
let u_Emissive;

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

  u_LightDir = gl.getUniformLocation(gl.program, "u_LightDir");
  u_LightIntensity = gl.getUniformLocation(gl.program, "u_LightIntensity");
  u_Emissive = gl.getUniformLocation(gl.program, "u_Emissive");
  if(!u_Emissive) {
    console.log('Failed to get the storage location of u_Emissive');
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
  gl.uniform1f(u_IsWater, 0.0);

  gl.uniform3f(u_LightDir, -0.3, 1.0, 0.4);
  gl.uniform1f(u_LightIntensity, 0.9);
  gl.uniform1f(u_Emissive, 0.0);
}

function addActionsForHtmlUI() {

}

function initInput() {
  document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

  canvas.addEventListener("click", () => canvas.requestPointerLock());

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
  addActionsForHtmlUI();

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
  initLanterns(500);

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
  lockCameraToWater();
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

  image.src = "img/lanternSky.jpg";

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

function initLanterns(count = 120) {
  lanterns = [];
  const radius = 45;
  const minY = 4;
  const maxY = 60;

  for (let i = 0; i < count; i++){
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;

    const y = minY + Math.random() * (maxY - minY);

    lanterns.push({
      x, y, z,
      phase: Math.random() * Math.PI * 2,
      bob: 0.15 + Math.random() * 0.25,
      speed: 0.6 + Math.random() * 0.9,
      scale: 0.35 + Math.random() * 0.25,
      hue: Math.random()
    });
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

function drawLanterns() {
  for(let i = 0; i < lanterns.length; i++) {
    const L = lanterns[i];
    const bobY = Math.sin(g_seconds * L.speed + L.phase) * L.bob;

    gl.uniform1f(u_texColorWeight, 0.0);
    gl.uniform1f(u_Emissive, 0.35);

    let m = new Matrix4();
    m.translate(L.x, L.y + bobY, L.z);
    m.scale(L.scale * 0.6, L.scale, L.scale * 0.6);
    const c = [1.0, 0.55, 0.15, 1.0];
    drawCube(m,c);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthMask(false);

    gl.uniform1f(u_texColorWeight, 0.0);
    gl.uniform1f(u_Emissive, 1.0);

    const shells = [
      { s: 1.25, a: 0.20 },
      { s: 1.55, a: 0.12 },
      { s: 1.90, a: 0.07 },
      { s: 2.30, a: 0.04 },
    ];

    for (const sh of shells) {
      let g = new Matrix4();
      g.translate(L.x, L.y + bobY, L.z);
      g.scale(L.scale * sh.s, L.scale * sh.s * 1.6, L.scale * sh.s);
      drawCube(g, [1.0, 0.65, 0.25, sh.a]); 
    }

    gl.depthMask(true);
    gl.disable(gl.BLEND);

    gl.uniform1f(u_Emissive, 1);
    let top = new Matrix4();
    top.translate(L.x, L.y + bobY + L.scale * 0.55, L.z);
    top.scale(L.scale * 0.35, L.scale * 0.15, L.scale * 0.35);
    drawCube(top, [1.0, 0.95, 0.6, 1.0]);

    gl.uniform1f(u_Emissive, 0.0);
  }
}

function renderAllShapes(){
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  camera.updateProjection(canvas);

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  gl.uniform1f(u_Time, g_seconds);

  const e = camera.eye.elements;
  
  gl.uniform3f(u_CamPos, e[0], e[1], e[2]);

  gl.uniform1f(u_IsWater, 0.0);

  drawSky();

  gl.disable(gl.CULL_FACE);
  drawLanterns();
  gl.enable(gl.CULL_FACE);

  gl.disable(gl.CULL_FACE);
  drawWater();
  gl.enable(gl.CULL_FACE);
  drawMap(map);
  //drawGround();
  //drawWorld();

  drawBoat();
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

function drawWater() {
  if(!g_textureReady) return;

  gl.uniform1f(u_IsWater, 1.0);
  gl.uniform1f(u_texColorWeight, 1.0);

  const size = 120;

  const m = new Matrix4();
  const e = camera.eye.elements;

  m.translate(e[0], -0.2, e[2]);
  m.scale(size, 0.05, size);
  drawCube(m, [1,1,1,1]);

  gl.uniform1f(u_IsWater, 0.0);
  gl.uniform1f(u_texColorWeight, 0.0);
}

function drawSky() {
  if (!g_textureReady) return;

  gl.disable(gl.CULL_FACE);

  gl.depthMask(false);
  gl.uniform1f(u_IsWater, 0.0)
  gl.uniform1f(u_texColorWeight, 1.0);

  const s = new Matrix4();
  const e = camera.eye.elements;
  s.translate(e[0], e[1], e[2]);
  s.scale(120, 120, 120);

  drawCube(s, [0.05, 0.08, 0.2, 1]);

  gl.uniform1f(u_texColorWeight, 0.0);

  gl.depthMask(true);
  gl.enable(gl.CULL_FACE);
}

function drawDetails() {
  const H = 120;
  const W = 120;
  const m = Array.from({length:H}, () => Array(W).fill(0));

  const cx = (W - 1) / 2;
  const cz = (H - 1) / 2;

  const waterR = Math.min(W, H) * 0.3;
  const shoreBand = Math.min(W, H) * 0.08;

  for (let z = 0; z < H; z++) {
    for (let x = 0; x < W; x++) {
      const dx = x - cx;
      const dz = z - cz;

      const ang = Math.atan2(dz, dx);
      const wiggle = 2.5 * Math.sin(ang * 4.0) + 1.5 * Math.sin(ang * 7.0);

      const d = Math.sqrt(dx * dx + dz * dz);
      const shore = waterR + wiggle;

      if (d < shore) {
        m[z][x] = 0;
        continue;
      } 
      if (d < shore + shoreBand){
        m[z][x] = 1;
        continue;
      } 

      const t = (d - (shore + shoreBand));

      let inland = t / (Math.min(W,H) * 0.35);
      inland = Math.max(0, Math.min(1, inland));

      const mountainCenter = Math.min(W, H) * 0.18;
      const mountainWidth = Math.min(W,H) * 0.20;

      let bandShape = 1.0 - Math.abs((t- mountainCenter) / mountainWidth);
      bandShape = Math.max(0, Math.min(1, bandShape));
      bandShape = bandShape * bandShape;

      const base = bandShape

      const n =
        0.5
        + 0.25 * Math.sin(x * 0.12) * Math.cos(z * 0.11)
        + 0.18 * Math.sin((x + z) * 0.07)
        + 0.10 * Math.sin(x * 0.33 + z * 0.29);

      const ridges = 1.0 - Math.abs(2.0 * n - 1.0);

      const band = Math.max(0, Math.min(1, (inland - 0.25) / 0.75));

      let h =
        2
        + base * 10.0          
        + band * ridges * 12.0   
        + (n - 0.5) * 2.0;   

      h = Math.max(0, Math.min(15, h));
      m[z][x] = Math.floor(h);
    }
  }

  return m;
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

function drawBoat() {
  const e = camera.eye.elements;
  const a = camera.at.elements;

  const [fx, __, fz] = getCameraForwardFlat();

  const down = 0.9;
  const bob = 0.05 * Math.sin(g_seconds * 2.0);


  const dist = 2.0;
  const bx = e[0] + fx * dist;
  const by = (e[1] - down) + bob;
  const bz = e[2] + fz * dist;

  const yawDeg = 90 + (Math.atan2(fx, fz) * 180 / Math.PI);

  gl.uniform1f(u_IsWater, 0.0);
  gl.uniform1f(u_texColorWeight, 0.0);

  // --- Hull base (flat rectangle) ---
  let base = new Matrix4();
  base.translate(bx, by, bz);
  base.rotate(yawDeg, 0, 1, 0);
  base.scale(1.4, 0.1, 0.8);
  drawCube(base, [0.35, 0.20, 0.10, 1.0]);

  // side1 
  let side1 = new Matrix4();
  side1.translate(bx, by + 0.15, bz);
  side1.rotate(yawDeg, 0, 1, 0);
  side1.translate(0, -0.05, -0.45);   
  side1.scale(1.4, 0.18, 0.1);
  drawCube(side1, [0.32, 0.18, 0.09, 1.0]);

  // side 2
  let side2 = new Matrix4();
  side2.translate(bx, by + 0.15, bz);
  side2.rotate(yawDeg, 0, 1, 0);
  side2.translate(0, -0.05, 0.45);    
  side2.scale(1.4, 0.18, 0.1);
  drawCube(side2, [0.32, 0.18, 0.09, 1.0]);

  // --- Cabin/seat ---
  let seat = new Matrix4();
  seat.translate(bx, by + 0.22, bz);
  seat.rotate(yawDeg, 0, 1, 0);
  seat.translate(-0.15, -0.15, 0);
  seat.scale(0.1, 0.1, 0.8);
  drawCube(seat, [0.45, 0.28, 0.14, 1.0]);

  // boat tip (back)
  const tipSteps = 6;
  for (let i = 0; i < tipSteps; i++) {
    const t = i / (tipSteps - 1); // 0 -> 1
    const segW = 1 * (1.0 - 0.85 * t);   // width shrinks
    const segH = 1 * (1.0 - 0.20 * t);  // slight height shrink
    const segL = 0.15 * (1.0 - 0.65 * t);   // length shrinks
    const zOff = 3.0 + i * 0.065;  
    const yOff = 0.75 + i * 0.85;


    let seg = new Matrix4(base);
    seg.translate(zOff - 2.5, yOff, 0);
    seg.scale(segL, segH, segW);
    drawCube(seg, [0.35, 0.20, 0.10, 1.0]);
  }

  // boat tip (front)
  for (let i = 0; i < tipSteps; i++) {
    const t = i / (tipSteps - 1); // 0 -> 1
    const segW = 1 * (1.0 - 0.85 * t);   // width shrinks
    const segH = 1 * (1.0 - 0.20 * t);  // slight height shrink
    const segL = 0.15 * (1.0 - 0.65 * t);   // length shrinks
    const zOff = 3.0 + i * -0.065;  
    const yOff = 0.75 + i * 0.85;


    let seg2 = new Matrix4(base);
    seg2.translate(zOff - 3.5, yOff, 0);
    seg2.scale(segL, segH, segW);
    drawCube(seg2, [0.35, 0.20, 0.10, 1.0]);
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
