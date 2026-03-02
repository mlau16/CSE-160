class Sphere {
    constructor(lat = 20, lon = 20, r = 0.5) {
      this.type = "sphere";
      this.color = [1, 1, 1, 1];
      this.matrix = new Matrix4();
  
      this.lat = lat;
      this.lon = lon;
      this.r = r;

      this._posBuffer = null;
      this._uvBuffer = null;
      this._normalBuffer = null;
      this._vertexCount = 0;

      this._built = false;
    }
  
    buildMesh() {
      const r = this.r;

      const pos = [];
      const nor = [];
      const uv = [];

      const pushV = (x, y, z, u, v) => {
        pos.push(x, y, z);

        uv.push(u, v);

        const invR = 1.0 / r;
        nor.push(x * invR, y * invR, z * invR);
      };

      const pushTri = (ax, ay, az, au, av,
                      bx, by, bz, bu, bv,
                      cx, cy, cz, cu, cv) => {
        pushV(ax, ay, az, au, av);
        pushV(bx, by, bz, bu, bv);
        pushV(cx, cy, cz, cu, cv);
      };

      for (let i = 0; i < this.lat; i++) {
        const v0 = i / this.lat;
        const v1 = (i + 1) / this.lat;

        const t0 = v0 * Math.PI;
        const t1 = v1 * Math.PI;

        const st0 = Math.sin(t0), ct0 = Math.cos(t0);
        const st1 = Math.sin(t1), ct1 = Math.cos(t1);

        for (let j = 0; j < this.lon; j++) {
          const u0 = j / this.lon;
          const u1 = (j + 1) / this.lon;

          const p0 = u0 * Math.PI * 2;
          const p1 = u1 * Math.PI * 2;

          const sp0 = Math.sin(p0), cp0 = Math.cos(p0);
          const sp1 = Math.sin(p1), cp1 = Math.cos(p1);

          const x00 = r * st0 * cp0, y00 = r * ct0, z00 = r * st0 * sp0;
          const x10 = r * st0 * cp1, y10 = r * ct0, z10 = r * st0 * sp1;
          const x01 = r * st1 * cp0, y01 = r * ct1, z01 = r * st1 * sp0;
          const x11 = r * st1 * cp1, y11 = r * ct1, z11 = r * st1 * sp1;

          const uv00 = [u0, 1.0 - v0];
          const uv10 = [u1, 1.0 - v0];
          const uv01 = [u0, 1.0 - v1];
          const uv11 = [u1, 1.0 - v1];

          pushTri(x00,y00,z00, uv00[0],uv00[1],
                  x10,y10,z10, uv10[0],uv10[1],
                  x11,y11,z11, uv11[0],uv11[1]);

          pushTri(x00,y00,z00, uv00[0],uv00[1],
                  x11,y11,z11, uv11[0],uv11[1],
                  x01,y01,z01, uv01[0],uv01[1]);
        }
      }

      this._vertexCount = pos.length / 3;

      if (!this._posBuffer) this._posBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._posBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);

      if (!this._normalBuffer) this._normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nor), gl.STATIC_DRAW);

      if (!this._uvBuffer) this._uvBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);

      this._built = true;
    }
  
    render() {
      if (!this._built) this.buildMesh();
  
      const rgba = this.color;
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

      const normalMat = new Matrix4();
      normalMat.setInverseOf(this.matrix);
      normalMat.transpose();
      gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, this._posBuffer);
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);

      // normal
      gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
      gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Normal);

      // uv
      gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
      gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_UV);

      gl.drawArrays(gl.TRIANGLES, 0, this._vertexCount);
    }
  }
  