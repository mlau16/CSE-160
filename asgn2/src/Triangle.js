class Triangle {
    constructor(position, color, size) {
        this.position = position;
        this.color = color;
        this.size = size;
    }

    render() {
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

        const d = this.size / 200;
        const x = this.position[0];
        const y = this.position[1];

        let M = new Matrix4();
        gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

        drawTriangle([
        x,     y + d,
        x - d, y - d,
        x + d, y - d
        ]);
    }
}

//Draw Triangles
function drawTriangle(verts) {
  const n = 3;

  const vertices = new Float32Array(verts);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0 , n);
}

function drawTriangle3D(verts) {
  const n = 3;

  const vertices = new Float32Array(verts);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0 , n);
}