class Sphere {
    constructor() {
      this.type = "sphere";
      this.color = [1, 1, 1, 1];
      this.matrix = new Matrix4();
  
      this.radius = 0.20;
      this.latSegments = 18; 
      this.lonSegments = 24;  
  
      this._vertexBuffer = null;
      this._vertexCount = 0;
      this._dirty = true;
    }
  
    buildMesh() {
      const r = this.radius;
      const lat = this.latSegments;
      const lon = this.lonSegments;
  
      const verts = [];
  
      function tri(ax, ay, az, bx, by, bz, cx, cy, cz) {
        verts.push(ax, ay, az, bx, by, bz, cx, cy, cz);
      }
  
      for (let i = 0; i < lat; i++) {
        const t0 = (i / lat) * Math.PI;
        const t1 = ((i + 1) / lat) * Math.PI;
  
        const st0 = Math.sin(t0), ct0 = Math.cos(t0);
        const st1 = Math.sin(t1), ct1 = Math.cos(t1);
  
        for (let j = 0; j < lon; j++) {
          const p0 = (j / lon) * Math.PI * 2;
          const p1 = ((j + 1) / lon) * Math.PI * 2;
  
          const sp0 = Math.sin(p0), cp0 = Math.cos(p0);
          const sp1 = Math.sin(p1), cp1 = Math.cos(p1);
  
          const x00 = r * st0 * cp0, y00 = r * ct0, z00 = r * st0 * sp0;
          const x10 = r * st0 * cp1, y10 = r * ct0, z10 = r * st0 * sp1;
          const x01 = r * st1 * cp0, y01 = r * ct1, z01 = r * st1 * sp0;
          const x11 = r * st1 * cp1, y11 = r * ct1, z11 = r * st1 * sp1;
  
          tri(x00,y00,z00,  x10,y10,z10,  x11,y11,z11);
          tri(x00,y00,z00,  x11,y11,z11,  x01,y01,z01);
        }
      }
  
      this._vertexCount = verts.length / 3;
  
      if (!this._vertexBuffer) this._vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  
      this._dirty = false;
    }
  
    render() {
      if (this._dirty) this.buildMesh();
  
      const rgba = this.color;
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);
  
      gl.drawArrays(gl.TRIANGLES, 0, this._vertexCount);
    }
  }
  