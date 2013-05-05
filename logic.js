function World(width, height) {
    this.width = width;
    this.height = height;
    
    this.mesh = {
        barrel: null,
        base: null,
        framework: null
    };
    
    this.artilleryX = -750;
    this.baseHeight = 75;
    this.frameworkHeight = 500;
    this.barrelHeight = 200;
    this.azimuth = 0;
    this.altitude = 0;
};

World.prototype = {
    // load models, set meshes
    load: function(callback) {
        var loader = new THREE.OBJMTLLoader();
        var loadedCnt = 0;
        var that = this;
        loader.addEventListener('load', function (event) {
            // load models
            var model = event.content;
            model.position.set(that.artilleryX, that.barrelHeight, 0);
            animator.scene.add(model);
            
            ++loadedCnt;
            if (loadedCnt === 1) {
                that.mesh.barrel = model;
            } else {
                that.mesh.base = model;
                if (typeof callback === 'function') {
                    callback();
                }
            }
        });
        loader.load('model/barrel.obj', 'model/barrel.mtl');
        loader.load('model/base.obj', 'model/base.mtl');
        
        // framework
        var boxMat = new THREE.MeshLambertMaterial({
            color: 0x66ff22
        });
        this.mesh.framework = new THREE.Mesh(new THREE.CubeGeometry(
                200, this.frameworkHeight, 200), boxMat);
        this.mesh.framework.position.set(this.artilleryX, this.barrelHeight
                - this.baseHeight - this.frameworkHeight / 2, 0);
        animator.scene.add(this.mesh.framework);
    },
    
    // set elevation of barrel
    setElevation: function(elevation) {
        this.barrelHeight = elevation;
        
        this.mesh.barrel.position.y = elevation;
        this.mesh.base.position.y = elevation;
        this.mesh.framework.position.y = elevation
                - this.baseHeight - this.frameworkHeight / 2;
    },
    
    // set azimuth of barrel, azimuth should between -PI / 2 and PI / 2
    setAzimuth: function(azimuth) {
        this.azimuth = azimuth;
        
        this.mesh.barrel.rotation.y = azimuth;
        this.mesh.base.rotation.y = azimuth;
    },
    
    // set altitude of barrel, altitude should between 0 and PI / 2
    setAltitude: function(altitude) {
        this.altitude = altitude;
        
        this.mesh.barrel.rotation.z = altitude;
    }
}
