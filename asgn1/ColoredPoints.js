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

var g_shapesList = [];

let canvas;
let gl;
let a_Position;

let u_FragColor;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];

let u_Size;
let g_selectedSize = 20.0;

let g_vertexBuffer = null;
let g_selectedType = "POINT";

const g_circleSegments = 20;

class Point {
  constructor(position, color, size) {
    this.position = position;
    this.color = color;
    this.size = size;
  }
  
  render() {
    gl.disableVertexAttribArray(a_Position);
    //Set position
    gl.vertexAttrib3f(
      a_Position,
      this.position[0],
      this.position[1],
      0.0
    );

    //Set color
    gl.uniform4f(
      u_FragColor,
      this.color[0],
      this.color[1],
      this.color[2],
      this.color[3]
    );

    //Set size
    gl.uniform1f(u_Size, this.size);

    //Draw
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

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

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, "u_Size");
  if(!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

  g_vertexBuffer = gl.createBuffer();
  if(!g_vertexBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }
}

function addActionsForHtmlUI() {
  const redSlider = document.getElementById('redSlide');
  const greenSlider = document.getElementById('greenSlide');
  const blueSlider = document.getElementById('blueSlide');
  const sizeSlider = document.getElementById('sizeSlide');
  const clearButton = document.getElementById('clearButton');

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

  updateColorFromSliders();
  updateSizeFromSlider();

  redSlider.addEventListener('input', updateColorFromSliders);
  greenSlider.addEventListener('input', updateColorFromSliders);
  blueSlider.addEventListener('input', updateColorFromSliders);
  sizeSlider.addEventListener('input', updateSizeFromSlider);
}

function handleClicks() {
  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;

  canvas.onmousemove = function (ev) {
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
  addActionsForHtmlUI();
  handleClicks();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
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

  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
}

function drawTriangle(verts) {
  const n = 3;

  const vertices = new Float32Array(verts);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0 , n);
}

function click(ev) {
  //Extract the event click and return it 
  let [x,y] = convertCoordinatesEventToGL(ev);

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
      g_circleSegments
    );
    g_shapesList.push(c);
    c.render();
  }
}
