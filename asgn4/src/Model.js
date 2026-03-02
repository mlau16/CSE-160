// Model.js

class Model {
  constructor(gl, objPath) {
    this.gl = gl;
    this.objPath = objPath;

    this.matrix = new Matrix4();
    this.color = [1, 1, 1, 1];

    this.posBuffer = null;
    this.uvBuffer = null;
    this.normBuffer = null;
    this.vertexCount = 0;

    this.loaded = false;
  }

  async load() {
    const res = await fetch(this.objPath);
    const text = await res.text();
    this._buildFromOBJ(text);
    this.loaded = true;
  }

  _buildFromOBJ(text) {
    const vs = [];
    const vts = [];
    const vns = [];

    const outPos = [];
    const outUV = [];
    const outNor = [];
    const triPosForNormals = [];

    const lines = text.split("\n");

    const toIndex = (i, len) => (i >= 0 ? i - 1 : len + i);

    const parseFaceVert = (tok) => {
      const parts = tok.split("/");
      const vi = parseInt(parts[0], 10);
      const ti = parts[1] ? parseInt(parts[1], 10) : 0;
      const ni = parts[2] ? parseInt(parts[2], 10) : 0;
      return { vi, ti, ni };
    };

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#")) continue;

      const parts = line.split(/\s+/);
      const tag = parts[0];

      if (tag === "v") {
        vs.push([+parts[1], +parts[2], +parts[3]]);
      } else if (tag === "vt") {
        vts.push([+parts[1], +parts[2]]);
      } else if (tag === "vn") {
        vns.push([+parts[1], +parts[2], +parts[3]]);
      } else if (tag === "f") {
        const face = parts.slice(1).map(parseFaceVert);

        // fan triangulation: (0, i, i+1)
        for (let i = 1; i + 1 < face.length; i++) {
          const tri = [face[0], face[i], face[i + 1]];

          const p = tri.map(v => vs[toIndex(v.vi, vs.length)]);
          outPos.push(...p[0], ...p[1], ...p[2]);

          // UVs (optional)
          if (tri[0].ti && vts.length) {
            const t0 = vts[toIndex(tri[0].ti, vts.length)];
            const t1 = vts[toIndex(tri[1].ti, vts.length)];
            const t2 = vts[toIndex(tri[2].ti, vts.length)];
            outUV.push(t0[0], t0[1], t1[0], t1[1], t2[0], t2[1]);
          } else {
            outUV.push(0, 0, 0, 0, 0, 0);
          }

          // Normals (optional)
          if (tri[0].ni && vns.length) {
            const n0 = vns[toIndex(tri[0].ni, vns.length)];
            const n1 = vns[toIndex(tri[1].ni, vns.length)];
            const n2 = vns[toIndex(tri[2].ni, vns.length)];
            outNor.push(...n0, ...n1, ...n2);
          } else {
            triPosForNormals.push(p);
            outNor.push(0, 0, 1, 0, 0, 1, 0, 0, 1); // placeholder
          }
        }
      }
    }

    // If no normals provided, compute flat normals per triangle
    if (vns.length === 0) {
      for (let t = 0; t < triPosForNormals.length; t++) {
        const p0 = triPosForNormals[t][0];
        const p1 = triPosForNormals[t][1];
        const p2 = triPosForNormals[t][2];

        const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2];
        const vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];

        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;

        const len = Math.hypot(nx, ny, nz) || 1.0;
        nx /= len; ny /= len; nz /= len;

        const base = t * 9;
        outNor[base + 0] = nx; outNor[base + 1] = ny; outNor[base + 2] = nz;
        outNor[base + 3] = nx; outNor[base + 4] = ny; outNor[base + 5] = nz;
        outNor[base + 6] = nx; outNor[base + 7] = ny; outNor[base + 8] = nz;
      }
    }

    const gl = this.gl;
    this.vertexCount = outPos.length / 3;

    this.posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(outPos), gl.STATIC_DRAW);

    this.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(outUV), gl.STATIC_DRAW);

    this.normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(outNor), gl.STATIC_DRAW);
  }

  render(a_Position, a_UV, a_Normal, u_ModelMatrix, u_NormalMatrix, u_FragColor) {
    if (!this.loaded) return;

    const gl = this.gl;

    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    const normalMat = new Matrix4();
    normalMat.setInverseOf(this.matrix);
    normalMat.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
  }
}