class Circle {
    constructor(position, color, size, segments) {
        this.position = position;
        this.color = color;
        this.size = size;
        this.segments = segments;
    }

    render() {
        gl.uniform4f(u_FragColor,
            this.color[0], this.color[1], this.color[2], this.color[3]
        );

        let M = new Matrix4();
        gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

        const x = this.position[0];
        const y = this.position[1];

        const r = this.size / 200;

        const step = (2* Math.PI) / this.segments;

        for(let i = 0; i < this.segments; i++) {
            const angle1 = i * step;
            const angle2 = (i + 1) * step;

            const x1 = x + r * Math.cos(angle1);
            const y1 = y + r * Math.sin(angle1);
            const x2 = x + r * Math.cos(angle2);
            const y2 = y + r * Math.sin(angle2);

            drawTriangle([
                x, y,
                x1, y1,
                x2, y2
            ]);
        }
    }
}