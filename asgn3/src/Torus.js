class Torus {
    constructor() {
      this.type = "torus";
      this.color = [1, 1, 1, 1];
      this.matrix = new Matrix4();
  
      this.majorRadius = 0.5; 
      this.minorRadius = 0.1; 
      this.majorSegments = 24;
      this.minorSegments = 16;
  
      this._vertexBuffer = null;
      this._vertexCount = 0;
      this._dirty = true; 
    }
  
    buildMesh() {
      const R = this.majorRadius;
      const r = this.minorRadius;
      const M = this.majorSegments;
      const m = this.minorSegments;
  
      const verts = []; 
  
      function tri(ax, ay, az, bx, by, bz, cx, cy, cz) {
        verts.push(ax, ay, az, bx, by, bz, cx, cy, cz);
      }
  
      for (let i = 0; i < M; i++) {
        const u0 = (i / M) * Math.PI * 2;
        const u1 = ((i + 1) / M) * Math.PI * 2;
  
        const cu0 = Math.cos(u0), su0 = Math.sin(u0);
        const cu1 = Math.cos(u1), su1 = Math.sin(u1);
  
        for (let j = 0; j < m; j++) {
          const v0 = (j / m) * Math.PI * 2;
          const v1 = ((j + 1) / m) * Math.PI * 2;
  
          const cv0 = Math.cos(v0), sv0 = Math.sin(v0);
          const cv1 = Math.cos(v1), sv1 = Math.sin(v1);
  
          const x00 = (R + r * cv0) * cu0;
          const y00 = r * sv0;
          const z00 = (R + r * cv0) * su0;
  
          const x10 = (R + r * cv0) * cu1;
          const y10 = r * sv0;
          const z10 = (R + r * cv0) * su1;
  
          const x01 = (R + r * cv1) * cu0;
          const y01 = r * sv1;
          const z01 = (R + r * cv1) * su0;
  
          const x11 = (R + r * cv1) * cu1;
          const y11 = r * sv1;
          const z11 = (R + r * cv1) * su1;
  
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
  