class Point {
   constructor(position, color, size) {
     this.position = position;
     this.color = color;
     this.size = size;
   }
  
   render() {
     gl.disableVertexAttribArray(a_Position);
     //Set position
     gl.vertexAttrib3f(
       a_Position,
       this.position[0],
       this.position[1],
       0.0
     );

     //Set color
     gl.uniform4f(
       u_FragColor,
       this.color[0],
       this.color[1],
       this.color[2],
       this.color[3]
     );

     let M = new Matrix4();
     gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

     //Set size
     gl.uniform1f(u_Size, this.size);

     Draw
     gl.drawArrays(gl.POINTS, 0, 1);
   }
 }