function World() {
    this.spring = new Spring();
    this.springMesh = null;
}

World.prototype = {
    // load spring model
    load: function(callback) {
        var loader = new THREE.OBJMTLLoader();
        var that = this;
        loader.addEventListener('load', function (event) {
            that.springMesh = event.content;
            that.springMesh.position.set(0, -that.spring.height / 2, 0);
            
            animator.scene.add(that.springMesh);
            
            if (callback) {
                callback();
            }
        });
        loader.load('model/spring.obj', 'model/spring.mtl');
    }
}



function Spring() {
    this.width = 0.2;
    this.height = 0.5;
}

