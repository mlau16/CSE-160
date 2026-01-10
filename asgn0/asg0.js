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

function handleDrawOperationEvent() {
  const canvas = document.getElementById('example');
  const ctx = canvas.getContext('2d');

  ctx.fillStyle='black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const x = parseFloat(document.getElementById('xCoord').value);
  const y = parseFloat(document.getElementById('yCoord').value);

  let v1 = new Vector3([x, y, 0]);

  const x2 = parseFloat(document.getElementById('xCoord2').value);
  const y2 = parseFloat(document.getElementById('yCoord2').value);

  let v2 = new Vector3([x2, y2, 0]);

  drawVector(ctx, v1, "red");
  drawVector(ctx, v2, "blue");

  const op = document.getElementById('opSelect').value;
  const s = parseFloat(document.getElementById('scalar').value);

  if (op === "add") {
    //v3 = v1 + v2
    const v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.add(v2);
    drawVector(ctx, v3, "green");
  } else if (op === "sub") {
    //v3 = v1 - v2
    const v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.sub(v2);
    drawVector(ctx, v3, "green");
  } else if (op === "mul") {
    //v3 = v1 * scalar and v4 = v2 * scalar
    const v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    const v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);

    v3.mul(s);
    v4.mul(s);
    drawVector(ctx, v3, "green");
    drawVector(ctx, v4, "green");

  } else if (op === "div") {
    //v3 = v1 / scalar and v4 = v2 / scalar
    const v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    const v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);

    v3.div(s);
    v4.div(s);
    drawVector(ctx, v3, "green");
    drawVector(ctx, v4, "green");
  } else if (op === "angle") {
    const angle = angleBetween(v1, v2);
    console.log("Angle: " + angle);
    
  } else if (op === "area"){
    const area = areaTriangle(v1, v2);
    console.log("Area of the triangle: " + area);

  } else if (op === "mag"){
    console.log("Magnitude v1: " + v1.magnitude());
    console.log("Magnitude v2: " + v2.magnitude());
    
  } else if (op === "norm") {
    const v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    const v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);

    v3.normalize();
    v4.normalize();

    drawVector(ctx, v3, "green");
    drawVector(ctx, v4, "green");
  }
}

function angleBetween(v1, v2) { 
  const dot = Vector3.dot(v1,v2);
  const mag1 = v1.magnitude();
  const mag2 = v2.magnitude();

  const cosAlpha = dot / (mag1 * mag2);

  const clamp = Math.min(1, Math.max(-1, cosAlpha));

  const angleRad = Math.acos(clamp);
  const angleDeg = angleRad * 180 / Math.PI;

  return angleDeg;

}

function areaTriangle(v1, v2) {
  // area of triangle = ||v1 x v2|| / 2
  const crossVec = Vector3.cross(v1, v2);
  const parArea = crossVec.magnitude();

  return parArea / 2;
}