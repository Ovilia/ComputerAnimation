function World() {
    this.mass = 5;
    this.elasticK = 15;
    
    this.springWidth = 0.2;
    this.springHeight = 1;
    
    this.springX = [-0.5, 0, 0.5];
    this.springMesh = [];
    
    this.origin = [-this.springHeight, -this.springHeight, -this.springHeight];
    
    this.balls = [];
    this.lineMesh = [];
    this.lineHelpMesh = [];
    
    this.isPaused = true;
    this.frameCnt = 0;
    this.deltaTime = 50;
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
                
                // line to see position
                var material = new THREE.LineBasicMaterial({
                    color: colors[i]
                });
                var geometry = new THREE.Geometry();
                geometry.vertices.push(new THREE.Vector3(-5, 0, 0));
                geometry.vertices.push(new THREE.Vector3(5, 0, 0));
                var line = new THREE.Line(geometry, material);
                line.position.y = that.origin[i];
                animator.scene.add(line);
                that.lineMesh.push(line);
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
        if (x < this.springHeight) {
            this.springMesh[index].scale.set(scaleXZ, scaleY, scaleXZ);
        }
        
        this.origin[index] = -this.springHeight + x;
        this.balls[index].mesh.position.y = this.origin[index];
        this.lineMesh[index].position.y = this.origin[index];
    },
    
    setHelpLines: function() {
        var material = new THREE.LineBasicMaterial({
            color: 0x666666
        });
        
        // original position
        if (this.lineHelpMesh[0]) {
            animator.scene.remove(this.lineHelpMesh[0]);
        } 
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(
                -5, -this.springHeight, 0));
        geometry.vertices.push(new THREE.Vector3(5, -this.springHeight, 0));
        this.lineHelpMesh[0] = new THREE.Line(geometry, material);
        animator.scene.add(this.lineHelpMesh[0]);
        
        // farthest position
        if (this.lineHelpMesh[1]) {
            animator.scene.remove(this.lineHelpMesh[1]);
        }
        this.lineHelpMesh[1] = new THREE.Line(geometry, material);
        animator.scene.add(this.lineHelpMesh[1]);
    },
    
    start: function() {
        this.reset();
        
        this.isPaused = false;
    },
    
    reset: function() {
        animator.gui.revert(animator.guiValue);
        var dt = animator.world.deltaTime / 1000;
        for (var i = 0; i < this.springMesh.length; ++i) {
            this.move(i, 0);
            this.balls[i].a = -9.8 * dt;
            this.balls[i].v = 0;
            this.balls[i].s = 0;
        }
        this.setHelpLines();
        this.frameCnt = 0;
        this.isPaused = true;
    },
    
    update: function() {
        if (!this.isPaused) {
            this.frameCnt += 1;
            if (this.frameCnt >= this.deltaTime / animator.renderDeltaTime) {
                this.frameCnt = 0;
                for (var i = 0; i < this.springMesh.length; ++i) {
                    this.balls[i].next(i);
                    this.move(i, this.balls[i].s);
                }
            }
        }
    },
    
    pause: function() {
        this.isPaused = !this.isPaused;
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

Ball.prototype = {    
    next: function(algorithm) {
        var dt = animator.world.deltaTime / 1000;
        var k = animator.world.elasticK * dt;
        var g = 9.8 * dt;
        
        var s1 = this.s + this.v * dt;
        var v1 = this.v + this.a * dt;
        
        if (algorithm === 0) {
            // euler
            this.s = s1;
            this.v = v1;
            this.a = -k * s1 - g;
            
        } else if (algorithm === 1) {
            // mid point
            var midV = (v1 + this.v) / 2;
            var midS = (s1 + this.s) / 2;
            var midA = -k * midS - g;
            
            this.s = this.s + midV * dt;
            this.v = this.v + midA * dt;
            this.a = -k * this.s - g;
            
        } else if (algorithm === 2) {
            // forth-order runge-kutta
            var s1 = this.v * dt;
            var a1 = -k * this.s - g;
            var v1 = a1 * dt;
            
            var s2 = (this.v + v1 / 2) * dt;
            var a2 = -k * (this.s + s1 / 2) - g;
            var v2 = a2 * dt;
            
            var s3 = (this.v + v2 / 2) * dt;
            var a3 = -k * (this.s + s2 / 2) - g;
            var v3 = a3 * dt;
            
            var s4 = (this.v + v3) * dt;
            var a4 = -k * (this.s + s3) - g;
            var v4 = a4 * dt;
            
            this.s = this.s + (s1 + s4) / 6 + (s2 + s3) / 3;
            this.v = this.v + (v1 + v4) / 6 + (v2 + v3) / 3;
            this.a = -k * this.s - g;
            
            if (this.s < animator.world.lineHelpMesh[1].position.y) {
                animator.world.lineHelpMesh[1].position.y = this.s;
            }
        }
    }
}
