// DrawTriangle.js (c) 2012 matsuda
function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);        // Fill a rectangle with the color

}

function drawVector(ctx, v, color){
  const canvas = ctx.canvas;

  const originX = canvas.width / 2;
  const originY = canvas.height / 2;

  const scale = 20;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(originX, originY);

  ctx.lineTo(
    originX + v.elements[0] * scale,
    originY - v.elements[1] * scale
  );

  ctx.stroke();
}

function handleDrawEvent() {
  const canvas = document.getElementById('example');
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const x = parseFloat(document.getElementById('xCoord').value);
  const y = parseFloat(document.getElementById('yCoord').value);

  let v1 = new Vector3([x, y, 0]);

  const x2 = parseFloat(document.getElementById('xCoord2').value);
  const y2 = parseFloat(document.getElementById('yCoord2').value);

  let v2 = new Vector3([x2, y2, 0]);

  drawVector(ctx, v1, "red");
  drawVector(ctx, v2, "blue");
}