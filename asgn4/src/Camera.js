class Camera {
    constructor(canvas) {
        this.fov = 45;

        this.eye = new Vector3([0, 1.0, 6]);
        this.at = new Vector3([0, 1.5, 5]);
        this.up = new Vector3([0, 1, 0]);

        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();

        this.updateView();
        this.updateProjection(canvas);
    }

    updateView() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }

    updateProjection(canvas){
        this.projectionMatrix.setPerspective(
            this.fov,
            canvas.width / canvas.height,
            0.1,
            1000
        );
    }

    forward() {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();
        return f;
    }

    moveForward(speed = 0.2) {
        const f = this.forward();
        f.elements[1] = 0;
        f.mul(speed);
        this.eye.add(f);
        this.at.add(f);
        this.updateView();
    }

    moveBackwards(speed = 0.2) {
        const f = this.forward();
        f.elements[1] = 0;
        f.mul(speed);
        this.eye.sub(f);
        this.at.sub(f);
        this.updateView();
    }

    moveLeft(speed = 0.2) {
        const f = this.forward();
        f.elements[1] = 0;
        let s = Vector3.cross(this.up, f);
        s.normalize();
        s.mul(speed);
        this.eye.add(s);
        this.at.add(s);
        this.updateView();
    }

    moveRight(speed = 0.2) {
        const f = this.forward();
        f.elements[1] = 0;
        let s = Vector3.cross(f, this.up);
        s.normalize();
        s.mul(speed);
        this.eye.add(s);
        this.at.add(s);
        this.updateView();
    }

    panLeft(alpha = 3) {
        const f = this.forward();

        let rot = new Matrix4();
        rot.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

        let fPrime = rot.multiplyVector3(f);

        this.at.set(this.eye);
        this.at.add(fPrime);

        this.updateView();
    }

    panRight(alpha = 3) {
        this.panLeft(-alpha);
    }

    panUp(alpha = 3) {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();

        let right = Vector3.cross(f, this.up);
        right.normalize();

        let rot = new Matrix4();
        rot.setRotate(alpha, right.elements[0], right.elements[1], right.elements[2]);

        let fPrime = rot.multiplyVector3(f);

        this.at.set(this.eye);
        this.at.add(fPrime);
        this.updateView();
    }

    panDown(alpha = 3) {
        this.panUp(-alpha);
    }
}