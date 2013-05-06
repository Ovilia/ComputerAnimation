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
    this.azimuth = 0;
    this.elevation = Math.PI / 4;
    this.barrelLength = 120;
    
    this.projectiles = [];
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
            model.position.set(that.artilleryX, that.baseHeight, 0);
            animator.scene.add(model);
            
            ++loadedCnt;
            if (loadedCnt === 1) {
                that.mesh.barrel = model;
                that.setElevation(animator.guiValue['Elevation (deg)']);
            } else {
                that.mesh.base = model;
                if (typeof callback === 'function') {
                    callback();
                }
            }
        });
        loader.load('model/barrel.obj', 'model/barrel.mtl');
        loader.load('model/base.obj', 'model/base.mtl');
        
        // projectile
        var origin = this.getBarrelEndPostion();
        var projectile = new Projectile(origin, 0x3399ff);
        animator.scene.add(projectile.mesh);
        this.projectiles.push(projectile);
    },
    
    // set azimuth of barrel, azimuth should between -PI / 2 and PI / 2
    setAzimuth: function(azimuth) {
        this.azimuth = azimuth / 180 * Math.PI;
        
        this.mesh.barrel.rotation.y = -this.azimuth;
        this.mesh.base.rotation.y = -this.azimuth;
        
        this.resetProjectiles();
    },
    
    // set elevation of barrel, altitude should between 0 and PI / 2
    setElevation: function(elevation) {
        this.elevation = elevation / 180 * Math.PI;
        
        this.mesh.barrel.rotation.z = this.elevation;
        
        this.resetProjectiles();
    },
    
    setProjectileMass: function(mass) {
        //TODO
    },
    
    setPowderMass: function(mass) {
        //TODO
    },
    
    // reset projectiles according to current parameters
    resetProjectiles: function() {
        // get origin position of projectiles
        var origin = this.getBarrelEndPostion();
        console.log(origin);
        for (var i in this.projectiles) {
            this.projectiles[i].origin = origin;
        }
    },
    
    // get barrel end position, which is origin position for projectiles
    getBarrelEndPostion: function() {
        return {
            x: this.artilleryX + this.barrelLength * Math.cos(this.elevation)
                    * Math.cos(this.azimuth),
            y: this.baseHeight + this.barrelLength * Math.sin(this.elevation),
            z: this.barrelLength * Math.cos(this.elevation)
                    * Math.sin(this.azimuth)
        };
    }
}



function Projectile(origin, color, size) {
    var that = this;
    
    var _origin = {
        x: 0,
        y: 0,
        z: 0
    };
    this.__defineGetter__('origin', function() {
        return _origin;
    });
    this.__defineSetter__('origin', function(newOrigin) {
        _origin.x = newOrigin.x;
        _origin.y = newOrigin.y;
        _origin.z = newOrigin.z;
        
        if (that.mesh) {
            that.mesh.position.set(origin.x + this.s.x, origin.y + this.s.y,
                origin.z + this.s.z);
        }
    });
    _origin = origin;
    
    this.mass = 0;
    this.a = {
        x: 0,
        y: 0,
        z: 0
    };
    this.v = {
        x: 0,
        y: 0,
        z: 0
    };
    // s is relative to origin
    this.s = {
        x: 0,
        y: 0,
        z: 0
    };
    
    if (typeof size !== 'number' || size < 0) {
        size = 20;
    }
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 8),
            new THREE.MeshLambertMaterial({
                color: color
            }));
    this.mesh.position.set(origin.x, origin.y, origin.z);
}

Projectile.prototype = {
    
};
