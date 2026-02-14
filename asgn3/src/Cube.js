class Cube {
    constructor() {
        this.type="cube";
        this.color = [1.0, 1.0, 1.0, 1.0];

        this.matrix = new Matrix4()
    }

    render() {
        var rgba = this.color;

        const uvTri1 = [0,0, 1,0, 1,1];
        const uvTri2 = [0,0, 1,1, 0,1];

        const centered = new Matrix4(this.matrix);
        centered.translate(-0.5, -0.5, -0.5);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, centered.elements);


        // FRONT (z=0)
        gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
        drawTriangle3DUV([0,0,0,  1,0,0,  1,1,0], uvTri1);
        drawTriangle3DUV([0,0,0,  1,1,0,  0,1,0], uvTri2);
        
        // BACK (z=1)
        gl.uniform4f(u_FragColor, rgba[0]*0.6, rgba[1]*0.6, rgba[2]*0.6, rgba[3]);
        drawTriangle3DUV([1,0,1,  0,0,1,  0,1,1], uvTri1);
        drawTriangle3DUV([1,0,1,  0,1,1,  1,1,1], uvTri2);

        // LEFT (x=0)
        gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
        drawTriangle3DUV([0,0,1,  0,0,0,  0,1,0], uvTri1);
        drawTriangle3DUV([0,0,1,  0,1,0,  0,1,1], uvTri2);

        // RIGHT (x=1)
        gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
        drawTriangle3DUV([1,0,0,  1,0,1,  1,1,1], uvTri1);
        drawTriangle3DUV([1,0,0,  1,1,1,  1,1,0], uvTri2);

        // TOP (y=1)
        drawTriangle3DUV([0,1,0,  1,1,0,  1,1,1], uvTri1);
        drawTriangle3DUV([0,1,0,  1,1,1,  0,1,1], uvTri2);

        // BOTTOM (y=0)
        drawTriangle3DUV([0,0,1,  1,0,1,  1,0,0], uvTri1);
        drawTriangle3DUV([0,0,1,  1,0,0,  0,0,0], uvTri2);
    }
}