function World() {
    this.springWidth = 0.2;
    this.springHeight = 1;
    this.springFarthest = 0.5;
    
    this.springX = [-0.5, 0, 0.5];
    this.springMesh = [];
    
    this.origin = [-this.springHeight, -this.springHeight, -this.springHeight];
    
    this.balls = [];
}

World.prototype = {
    // load spring model
    load: function(callback) {
        var loader = new THREE.OBJMTLLoader();
        var that = this;
        loader.addEventListener('load', function (event) {
            event.content.rotation.y = Math.PI / 2;
            
            var colors = [0xff3333, 0x33ff33, 0x3366ff];
            for (var i = 0; i < colors.length; ++i) {
                that.balls.push(new Ball(that.springX[i],
                        that.origin[i], colors[i]));
            
                that.springMesh[i] = event.content.clone();
                that.springMesh[i].position.x = that.springX[i];
                animator.scene.add(that.springMesh[i]);
                
                // move to farthest position
                that.move(i, -that.springFarthest);
            }
            
            if (callback) {
                callback();
            }
        });
        loader.load('model/spring.obj', 'model/spring.mtl');
    },
    
    move: function(index, x) {
        var scaleY = (this.springHeight - x) / this.springHeight;
        var scaleXZ = 1 / Math.sqrt(scaleY);
        this.springMesh[index].scale.set(scaleXZ, scaleY, scaleXZ);
        
        this.origin[index] = -this.springHeight + x;
        this.balls[index].mesh.position.y = this.origin[index];
    },
    
    start: function() {
        for (var i = 0; i < this.springMesh.length; ++i) {
            
        }
    }
}

function Ball(springX, origin, color) {
    this.a = 0;
    this.v = 0;
    this.s = 0;
    
    this.material = new THREE.MeshLambertMaterial({
        color: color
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8),
            this.material);
    this.mesh.position.x = springX;
    this.mesh.position.y = origin;
    animator.scene.add(this.mesh);
}
