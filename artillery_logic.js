function World(width, height) {
    this.width = width;
    this.height = height;
    
    this.mesh = {
        barrel: null,
        base: null,
        
        grid: null
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
        // barrel and base
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
        
        if (!animator.isShooting && !animator.isShooted) {
            this.resetProjectiles();
        }
    },
    
    // set elevation of barrel, altitude should between 0 and PI / 2
    setElevation: function(elevation) {
        this.elevation = elevation / 180 * Math.PI;
        
        this.mesh.barrel.rotation.z = this.elevation;
        
        if (!animator.isShooting && !animator.isShooted) {
            this.resetProjectiles();
        }
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
        var s = {
            x: 0,
            y: 0,
            z: 0
        };
        for (var i in this.projectiles) {
            this.projectiles[i].origin = origin;
            this.projectiles[i].s = s;
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
    },
    
    // start shooting
    shoot: function() {
        animator.isShooting = true;
            
        for (var i in animator.world.projectiles) {
            animator.world.projectiles[i].clearTracks();
            animator.world.projectiles[i].isLanded = false;
            
            animator.world.projectiles[i].s = {
                x: 0,
                y: 0,
                z: 0
            };
            animator.world.projectiles[i].v = {
                x: 3,
                y: 5,
                z: 0
            };
            animator.world.projectiles[i].a.y = -0.03;
        }
    },
    
    // change projectile position if is shooting
    update: function() {
        if (animator.isShooting) {
            var time = new Date();
            var allLanded = true;
            for (var i in this.projectiles) {
                this.projectiles[i].next(time, 0);
                if (this.projectiles[i].isLanded === false) {
                    allLanded = false;
                }
            }
            if (allLanded) {
                animator.isShooting = false;
                animator.isShooted = true;
            }
        }
    },
    
    // reset to before shooting
    reset: function() {
        for (var i in this.projectiles) {
            this.projectiles[i].clearTracks();
        }
        this.resetProjectiles();
        animator.isShooted = false;
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
    var _s = {
        x: 0,
        y: 0,
        z: 0
    };
    this.__defineGetter__('s', function() {
        return _s;
    });
    this.__defineSetter__('s', function(newS) {
        _s.x = newS.x;
        _s.y = newS.y;
        _s.z = newS.z;
        
        if (that.mesh) {
            that.mesh.position.set(_origin.x + _s.x, _origin.y + _s.y,
                _origin.z + _s.z);
        }
    });
    
    if (typeof size !== 'number' || size < 0) {
        this.size = 20;
    } else {
        this.size = size;
    }
    this.material = new THREE.MeshLambertMaterial({
        color: color
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(this.size, 8, 8),
            this.material);
    this.mesh.position.set(origin.x, origin.y, origin.z);
    
    // boxes to show track
    this.tracks = [];
    this.isTracksVisble = true;
    this.trackSize = 10;
    
    // stopped because landed on grand
    this.isLanded = false;
}

Projectile.prototype = {
    // remove all from tracks
    clearTracks: function() {
        for (var i in this.tracks) {
            if (this.tracks[i] && this.tracks[i].mesh) {
                animator.scene.remove(this.tracks[i].mesh);
            }
        }
        this.tracks = [];
    },
    
    // set tracks visible in scene
    setTracksVisible: function(isVisible) {
        if (isVisible !== this.isTracksVisble) {
            this.isTracksVisble = isVisible;
            
            if (isVisible) {
                for (var i in this.tracks) {
                    if (this.tracks[i] && this.tracks[i].mesh) {
                        animator.scene.add(this.tracks[i].mesh);
                    }
                }
            } else {
                for (var i in this.tracks) {
                    if (this.tracks[i] && this.tracks[i].mesh) {
                        animator.scene.remove(this.tracks[i].mesh)
                    }
                }
            }
        }
    },
    
    // add track according to current position of projectile
    trackNow: function(time) {
        var mesh = new THREE.Mesh(new THREE.CubeGeometry(this.trackSize,
                this.trackSize, this.trackSize), this.material);
        mesh.position.set(this.origin.x + this.s.x,
                this.origin.y + this.s.y, this.origin.z + this.s.z);
        
        var track = {
            s: {
                x: this.s.x,
                y: this.s.y,
                z: this.s.z
            },
            v: {
                x: this.v.x,
                y: this.v.y,
                z: this.v.z
            },
            a: {
                x: this.a.x,
                y: this.a.y,
                z: this.a.z
            },
            time: time,
            
            mesh: mesh
        };
        this.tracks.push(track);
        
        if (this.isTracksVisble) {
            animator.scene.add(mesh);
        }
    },
    
    // move to next position, time is current time stamp, algorithm is either
    // 0 or 1, stands for euler and runge-kutta method respectively.
    next: function(time, algorithm) {
        if (this.isLanded) {
            // don't do anything if is landed
            return;
        }
        var len = this.tracks.length;
        if (len !== 0) { // first track needn't do anything
            var last = this.tracks[len - 1];
            var deltaTime = time - last.time;
            if (algorithm === 0) {
                // euler
                this.s.x += last.v.x * deltaTime;
                this.s.y += last.v.y * deltaTime;
                this.s.z += last.v.z * deltaTime;
                
                this.v.x += last.a.x * deltaTime;
                this.v.y += last.a.y * deltaTime;
                this.v.z += last.a.z * deltaTime;
                
            } else if (algorithm === 1) {
                // runge-kutta
                
            } else {
                console.error('Error in next: algorithm not exists.');
            }
            
            // check landed
            if (this.s.y + this.origin.y + this.size / 2 <= 0) {
                // move to ground
                this.s.y = -this.origin.y + this.size / 2;
                this.mesh.position.y = this.size / 2;
                console.log(this.mesh.position.y)
                this.isLanded = true;
                
                this.v.x = this.v.y = this.v.z = 0;
            }
        }
        this.mesh.position.set(this.origin.x + this.s.x,
                this.origin.y + this.s.y, this.origin.z + this.s.z);
        this.trackNow(time);
    }
};
