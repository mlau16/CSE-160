class Cube {
    static posBuffer = null;
    static uvBuffer = null;
    static inited = false;
    static normalBuffer = null;

    static initBuffers() {
        if (Cube.inited) return;
        Cube.inited = true;
    

    const positions = new Float32Array([
        // FRONT 
        0,0,1,  1,1,1,  0,1,1,
        0,0,1,  1,0,1,  1,1,1,

        // BACK 
        1,0,0,  0,1,0,  1,1,0,
        1,0,0,  0,0,0,  0,1,0,

        // LEFT 
        0,0,0,  0,1,1,  0,1,0,
        0,0,0,  0,0,1,  0,1,1,

        // RIGHT 
        1,0,1,  1,1,0,  1,1,1,
        1,0,1,  1,0,0,  1,1,0,

        // TOP 
        0,1,1,  1,1,0,  0,1,0,
        0,1,1,  1,1,1,  1,1,0,

        // BOTTOM 
        0,0,0,  1,0,1,  0,0,1,
        0,0,0,  1,0,0,  1,0,1
    ]);

    // const normals = new Float32Array([
    //     // FRONT (z=1)
    //     0,0,1,  0,0,1,  0,0,1,
    //     0,0,1,  0,0,1,  0,0,1,

    //     // BACK (z=0)
    //     0,0,-1,  0,0,-1,  0,0,-1,
    //     0,0,-1,  0,0,-1,  0,0,-1,

    //     // LEFT (x=0)
    //     -1,0,0, -1,0,0, -1,0,0,
    //     -1,0,0, -1,0,0, -1,0,0,

    //     // RIGHT (x=1)
    //     1,0,0,  1,0,0,  1,0,0,
    //     1,0,0,  1,0,0,  1,0,0,

    //     // TOP (y=1)
    //     0,1,0,  0,1,0,  0,1,0,
    //     0,1,0,  0,1,0,  0,1,0,

    //     // BOTTOM (y=0)
    //     0,-1,0, 0,-1,0, 0,-1,0,
    //     0,-1,0, 0,-1,0, 0,-1,0,
    //   ]);

    const uv1 = [0,0, 1,1, 1,0];
    const uv2 = [0,0, 0,1, 1,1];
    const uvs = new Float32Array([
        ...uv1, ...uv2,
        ...uv1, ...uv2,
        ...uv1, ...uv2,
        ...uv1, ...uv2,
        ...uv1, ...uv2,
        ...uv1, ...uv2,
    ]);

    const normals = new Float32Array([
        // FRONT (z=1)
        0,0,1,  0,0,1,  0,0,1,
        0,0,1,  0,0,1,  0,0,1,

        // BACK (z=0)
        0,0,-1,  0,0,-1,  0,0,-1,
        0,0,-1,  0,0,-1,  0,0,-1,

        // LEFT (x=0)
        -1,0,0, -1,0,0, -1,0,0,
        -1,0,0, -1,0,0, -1,0,0,

        // RIGHT (x=1)
        1,0,0,  1,0,0,  1,0,0,
        1,0,0,  1,0,0,  1,0,0,

        // TOP (y=1)
        0,1,0,  0,1,0,  0,1,0,
        0,1,0,  0,1,0,  0,1,0,

        // BOTTOM (y=0)
        0,-1,0, 0,-1,0, 0,-1,0,
        0,-1,0, 0,-1,0, 0,-1,0,
    ]);

    Cube.posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    Cube.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

    Cube.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

}

    constructor() {
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
    }

    render() {
        Cube.initBuffers();
        var rgba = this.color;

        const centered = new Matrix4(this.matrix);
        centered.translate(-0.5, -0.5, -0.5);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, centered.elements);

        const normalMat = new Matrix4();
        normalMat.setInverseOf(centered);
        normalMat.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);

        gl.bindBuffer(gl.ARRAY_BUFFER, Cube.posBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, Cube.uvBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        gl.bindBuffer(gl.ARRAY_BUFFER, Cube.normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
}