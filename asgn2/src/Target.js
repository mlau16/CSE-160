class Target {
    constructor(position, color, size, segments, velocity) {
        this.position = position;
        this.color = color;
        this.size = size;
        this.segments = segments;
        this.velocity = velocity;
    }

    radiusClip() {
        return this.size / 200;
    }

    update(dt) {
        this.position[0] += this.velocity[0] * dt;
        this.position[1] += this.velocity[1] * dt;

        const r = this.radiusClip();
        if (this.position[0] > 1 - r) { this.position[0] = 1 - r; this.velocity *= -1;}
        if (this.position[0] < -1 + r) { this.position[0] = -1 + r; this.velocity[0] *= -1; }
        if (this.position[1] > 1 - r) { this.position[1] = 1 - r; this.velocity[1] *= -1; }
        if (this.position[1] < -1 + r) { this.position[1] = -1 + r; this.velocity[1] *= -1; }
    }

    render() {
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

        const x = this.position[0];
        const y = this.position[1];
        const r = this.radiusClip();

        const step = (2 * Math.PI) / this.segments;
        for (let i = 0; i < this.segments; i++) {
            const a1 = i * step;
            const a2 = (i + 1) * step;

            const x1 = x + r * Math.cos(a1);
            const y1 = y + r * Math.sin(a1);
            const x2 = x + r * Math.cos(a2);
            const y2 = y + r * Math.sin(a2);

            drawTriangle([x, y, x1, y1, x2, y2]);
        }
    }
}
