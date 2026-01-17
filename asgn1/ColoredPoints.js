// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`


let canvas;
let gl;
let a_Position;

let u_FragColor;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];

let u_Size;
let g_selectedSize = 20.0;
var g_sizes = [];

function setupWebGL(){
   // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  gl = getWebGLContext(canvas);
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

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, "u_Size");
  if(!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function addActionsForHtmlUI() {
  const redSlider = document.getElementById('redSlide');
  const greenSlider = document.getElementById('greenSlide');
  const blueSlider = document.getElementById('blueSlide');
  const sizeSlider = document.getElementById('sizeSlide');

  function updateColorFromSliders() {
    const r = Number(redSlider.value) / 100;
    const g = Number(greenSlider.value) / 100;
    const b = Number(blueSlider.value) / 100;
    g_selectedColor = [r, g, b, 1.0];
  }

  function updateSizeFromSlider(){
    g_selectedSize = Number(sizeSlider.value);
  }

  updateColorFromSliders();
  updateSizeFromSlider();

  redSlider.addEventListener('input', updateColorFromSliders);
  greenSlider.addEventListener('input', updateColorFromSliders);
  blueSlider.addEventListener('input', updateColorFromSliders);
  sizeSlider.addEventListener('input', updateSizeFromSlider);
}

function main() {
  if(!setupWebGL()) return;
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_points = [];  // The array for the position of a mouse press
var g_colors = [];  // The array to store the color of a point

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

  var len = g_points.length;
  for(var i = 0; i < len; i++) {
    var xy = g_points[i];
    var rgba = g_colors[i];

    // Pass the position of a point to a_Position variable
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    //Pass the size of a point to u_Size variable
    gl.uniform1f(u_Size, g_sizes[i]);
    // Draw
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

function click(ev) {

  //Extract the event click and return it 
  let [x,y] = convertCoordinatesEventToGL(ev);

  // Store coordinates to array
  g_points.push([x, y]);
  g_colors.push([g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], 1.0]);
  g_sizes.push(g_selectedSize);

  //Draw every shape on the canvas
  renderAllShapes();
}
