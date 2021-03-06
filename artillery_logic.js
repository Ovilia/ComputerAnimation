function World(width, height) {
    this.width = width;
    this.height = height;
    
    this.mesh = {
        barrel: null,
        base: null,
        
        grid: null
    };
    
    this.deltaTime = 50;
    this.barrelLength = 2.5;
    this.elevation = Math.PI / 4;
    this.azimuth = 0;
    this.projectileMass = 1;
    this.powderMass = 1;
    this.airFriction = 50;
    
    this.artilleryX = -7.5;
    this.baseHeight = 0.75;
    this.barrelModelLength = 1.2;
    
    this.projectiles = [];
    
    this.frameCnt = 0;
}

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
            model.scale.set(0.01, 0.01, 0.01);
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
        
        // projectiles
        var origin = this.getBarrelEndPostion();
        var colors = [0xff3333, 0x33ff33, 0x3366ff];
        for (var i in colors) {
            var projectile = new Projectile(origin, colors[i]);
            animator.scene.add(projectile.mesh);
            this.projectiles.push(projectile);
        }
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
            x: this.artilleryX + this.barrelModelLength
                    * Math.cos(this.elevation) * Math.cos(this.azimuth),
            y: this.baseHeight + this.barrelModelLength
                    * Math.sin(this.elevation),
            z: this.barrelModelLength * Math.cos(this.elevation)
                    * Math.sin(this.azimuth)
        };
    },
    
    // start shooting
    shoot: function() {
        animator.isShooting = true;
        this.frameCnt = 0;
        
        var newtonPerKg = 10000;
        var v = Math.sqrt(2 * newtonPerKg * this.powderMass
                / this.projectileMass * this.barrelLength)
                / 1000 * this.deltaTime;
        var vx = v * Math.cos(this.elevation) * Math.cos(this.azimuth);
        var vy = v * Math.sin(this.elevation);
        var vz = v * Math.cos(this.elevation) * Math.sin(this.azimuth);
        
        var origin = this.getBarrelEndPostion();
            
        for (var i in animator.world.projectiles) {
            animator.world.projectiles[i].clearTracks();
            this.projectiles[i].origin = origin;
            animator.world.projectiles[i].isLanded = false;
            
            animator.world.projectiles[i].s = {
                x: 0,
                y: 0,
                z: 0
            };
            animator.world.projectiles[i].v = {
                x: vx,
                y: vy,
                z: vz
            };
            animator.world.projectiles[i].a = {
                x: 0,
                y: -0.098 / (1000 / animator.renderDeltaTime)
                        / (1000 / animator.renderDeltaTime),
                z: 0
            };
        }
    },
    
    // change projectile position if is shooting
    update: function() {
        if (animator.isShooting) {
            this.frameCnt += 1;
            
            var fps = 50;
            if (this.frameCnt >= this.deltaTime / animator.renderDeltaTime) {
                this.frameCnt = 0;
                var allLanded = true;
                var len = this.projectiles.length;
                for (var i = 0; i < len; ++i) {
                    this.projectiles[i].next(i);
                    if (this.projectiles[i].isLanded === false) {
                        allLanded = false;
                    }
                }
                if (allLanded) {
                    animator.isShooting = false;
                    animator.isShooted = true;
                }
            }
            
        }
    },
    
    // reset to before shooting
    reset: function() {
        for (var i in this.projectiles) {
            this.projectiles[i].clearTracks();
        }
        
        animator.isShooted = false;
        animator.isShooting = false;
        
        animator.gui.revert(animator.guiValue);
        this.setAzimuth(0);
        this.setElevation(45);
        
        animator.camera.position.set(7.5, 10, 7.5);
        animator.camera.lookAt(new THREE.Vector3(0, 2.5, 0));
        animator.cameraLookX = 0;
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
        this.size = 0.25;
    } else {
        this.size = size;
    }
    this.material = new THREE.MeshLambertMaterial({
        color: color,
        side: THREE.DoubleSide
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(this.size, 8, 8),
            this.material);
    this.mesh.position.set(origin.x, origin.y, origin.z);
    
    // boxes to show track
    this.tracks = [];
    this.isTracksVisble = true;
    this.trackSize = 0.1;
    
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
    trackNow: function() {
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(this.trackSize,
                    this.trackSize), this.material);
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
            
            mesh: mesh
        };
        this.tracks.push(track);
        
        if (this.isTracksVisble) {
            animator.scene.add(mesh);
        }
    },
    
    // move to next position, algorithm is either
    // 0 or 1, stands for euler and runge-kutta method respectively.
    next: function(algorithm) {
        if (this.isLanded) {
            // don't do anything if is landed
            return;
        }
        var len = this.tracks.length;
        var dt = animator.world.deltaTime / 1000;
        if (len !== 0) { // first track needn't do anything
            var last = this.tracks[len - 1];
            
            var ak = -animator.world.airFriction / 1000
                    * animator.world.deltaTime;
            // first result using euler algorithm
            var sx1 = this.s.x + last.v.x * dt;
            var sy1 = this.s.y + last.v.y * dt;
            var sz1 = this.s.z + last.v.z * dt;
            var vx1 = this.v.x + last.a.x * dt;
            var vy1 = this.v.y + last.a.y * dt;
            var vz1 = this.v.z + last.a.z * dt;
            var ax1 = ak * vx1;
            var ay1 = ak * vy1 - 9.8 / 1000 * animator.world.deltaTime;
            var az1 = ak * vz1;
            
            if (algorithm === 0) {
                // euler
                this.s.x = sx1;
                this.s.y = sy1;
                this.s.z = sz1;
                
                this.v.x = vx1;
                this.v.y = vy1;
                this.v.z = vz1;
                
            } else if (algorithm === 1) {
                var midVx = (vx1 + this.v.x) / 2;
                var midVy = (vy1 + this.v.y) / 2;
                var midVz = (vz1 + this.v.z) / 2;
                var midAx = ak * midVx;
                var midAy = ak * midVy - 9.8 / 1000
                        * animator.world.deltaTime;
                var midAz = ak * midVz;
                
                this.s.x = this.s.x + midVx * dt;
                this.s.y = this.s.y + midVy * dt;
                this.s.z = this.s.z + midVz * dt;
                
                this.v.x = this.v.x + midAx * dt;
                this.v.y = this.v.y + midAy * dt;
                this.v.z = this.v.z + midAz * dt;
                
            } else if (algorithm === 2) {
                // forth-order Runge-Kutta
                var midVx1 = (vx1 + this.v.x) / 2;
                var midVy1 = (vy1 + this.v.y) / 2;
                var midVz1 = (vz1 + this.v.z) / 2;
                var midAx1 = ak * midVx1;
                var midAy1 = ak * midVy1 - 9.8 / 1000
                        * animator.world.deltaTime;
                var midAz1 = ak * midVz1;
                
                var midVx2 = (vx1 + midVx1) / 2;
                var midVy2 = (vy1 + midVy1) / 2;
                var midVz2 = (vz1 + midVz1) / 2;
                var midAx2 = ak * midVx2;
                var midAy2 = ak * midVy2 - 9.8 / 1000
                        * animator.world.deltaTime;
                var midAz2 = ak * midVz2;
                
                var midVx3 = (this.v.x + midVx1) / 2;
                var midVy3 = (this.v.y + midVy1) / 2;
                var midVz3 = (this.v.z + midVz1) / 2;
                var midAx3 = ak * midVx3;
                var midAy3 = ak * midVy3 - 9.8 / 1000
                        * animator.world.deltaTime;
                var midAz3 = ak * midVz3;
                
                this.s.x = this.s.x + ((vx1 + midVx3) / 6
                        + (midVx2 + midVx1) / 3) * dt;
                this.s.y = this.s.y + ((vy1 + midVy3) / 6
                        + (midVy2 + midVy1) / 3) * dt;
                this.s.z = this.s.z + ((vz1 + midVz3) / 6
                        + (midVz2 + midVz1) / 3) * dt;
                
                this.v.x = this.v.x + ((ax1 + midAx3) / 6
                        + (midAx2 + midAx1) / 3) * dt;
                this.v.y = this.v.y + ((ay1 + midAy3) / 6
                        + (midAy2 + midAy1) / 3) * dt;
                this.v.z = this.v.z + ((az1 + midAz3) / 6
                        + (midAz2 + midAz1) / 3) * dt;
            } else {
                console.error('Error in next: algorithm not exists.');
            }
            // calculate a according to v
            this.a.x = ak * this.v.x;
            this.a.y = ak * this.v.y - 9.8 / 1000 * animator.world.deltaTime;
            this.a.z = ak * this.v.z;
            
            // check landed
            var landY = -this.origin.y + this.size / 2;
            if (this.s.y <= landY) {
                // move to ground
                this.s = {
                    x: this.s.x - (landY - this.s.y) * (this.s.x - last.s.x)
                            / (last.s.y - this.s.y),
                    y: landY,
                    z: this.s.z + (landY - this.s.y) * (this.s.z - last.s.z)
                            / (last.s.y - this.s.y)
                };
                
                this.isLanded = true;
                
                this.v.x = this.v.y = this.v.z = 0;
            }
        }
        
        this.mesh.position.set(this.origin.x + this.s.x,
                this.origin.y + this.s.y, this.origin.z + this.s.z);
        this.trackNow();
    }
};
