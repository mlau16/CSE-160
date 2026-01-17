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

        drawTriangle([
        x,     y + d,
        x - d, y - d,
        x + d, y - d
        ]);
    }
}