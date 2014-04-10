function Vec3(x, y, z) {
    if (x === undefined) {
        this.x = 0;
    } else {
        this.x = x;
    }
    if (y === undefined) {
        this.y = 0;
    } else {
        this.y = y;
    }
    if (z === undefined) {
        this.z = 0;
    } else {
        this.z = z;
    }
}

Vec3.prototype = {
    set: function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    },
    
    add: function(vec) {
        this.x += vec.x;
        this.y += vec.y;
        this.z += vec.z;
        return this;
    },
    
    minus: function(vec) {
        this.x -= vec.x;
        this.y -= vec.y;
        this.z -= vec.z;
        return this;
    },
    
    multiply: function(value) {
        this.x *= value;
        this.y *= value;
        this.z *= value;
        return this;
    },
    
    divide: function(value) {
        this.x /= value;
        this.y /= value;
        this.z /= value;
        return this;
    },
    
    dotMultiply: function(vec) {
        return this.x * vec.x + this.y * vec.y + this.z * vec.z;
    },
    
    modulus: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    },
    
    normalize: function() {
        var modulus = this.modulus();
        return this.divide(modulus);
    },
    
    toMatrix: function(isColumn) {
        if (isColumn) {
            return new Matrix(3, 1, [[this.x], [this.y], [this.z]]);
        } else {
            return new Matrix(1, 3, [[this.x, this.y, this.z]]);
        }
    },
    
    copy: function() {
        return new Vec3(this.x, this.y, this.z);
    }
};



function Matrix(m, n, mat) {
    this.mat = [];
    this.m = m;
    this.n = n;
    
    if (n > 0) {
        if (mat) {
            this.mat = mat;
        } else {
            this.mat = new Array(m);
            for (var i = 0; i < m; ++i) {
                this.mat[i] = new Array(n);
                for (var j = 0; j < n; ++j) {
                    this.mat[i][j] = 0;
                }
            }
        }
    } else {
        console.error('Error when init matrix.');
    }
}

Matrix.prototype = {
    multiply: function(another) {
        if (typeof another === 'number') {
            for (var i = 0; i < this.m; ++i) {
                for (var j = 0; j < this.n; ++j) {
                    this.mat[i][j] *= another;
                }
            }
            return this;
                
        } else if (another && another.m === this.n) {
            var mat = new Array(this.m);
            for (var i = 0; i < this.m; ++i) {
                mat[i] = new Array(another.n);
                for (var j = 0; j < another.n; ++j) {
                    var sum = 0;
                    for (var k = 0; k < this.n; ++k) {
                        sum += this.mat[i][k] * another.mat[k][j];
                    }
                    mat[i][j] = sum;
                }
            }
            return new Matrix(this.m, another.n, mat);
        
        } else {
            console.error('Error dimension when multiply matrix.');
            return null;
        }
    },
    
    transpose: function() {
        var mat = new Array(this.n);
        for (var i = 0; i < this.n; ++i) {
            mat[i] = new Array(this.m);
            for (var j = 0; j < this.m; ++j) {
                mat[i][j] = this.mat[j][i];
            }
        }
        return new Matrix(this.n, this.m, mat);
    },
    
    add: function(another) {
        if (this.m === another.m && this.n === another.n) {
            for (var i = 0; i < this.m; ++i) {
                for (var j = 0; j < this.n; ++j) {
                    this.mat[i][j] += another.mat[i][j];
                }
            }
            return this;
        } else {
            console.error('Error dimension when add matrix.');
            return null;
        }
    },
    
    minus: function(another) {
        if (this.m === another.m && this.n === another.n) {
            for (var i = 0; i < this.m; ++i) {
                for (var j = 0; j < this.n; ++j) {
                    this.mat[i][j] -= another.mat[i][j];
                }
            }
            return this;
        } else {
            console.error('Error dimension when add matrix.');
            return null;
        }
    },
    
    negative: function() {
        for (var i = 0; i < this.m; ++i) {
            for (var j = 0; j < this.n; ++j) {
                this.mat[i][j] = -this.mat[i][j];
            }
        }
        return this;
    },
    
    copy: function() {
        var matrix = new Matrix(this.m, this.n, this.mat);
        matrix.mat = new Array(this.m);
        for (var i = 0; i < this.m; ++i) {
            matrix.mat[i] = new Array(this.n);
            for (var j = 0; j < this.n; ++j) {
                matrix.mat[i][j] = 0;
            }
        }
        return matrix;
    }
};



function Particle(mass) {
    this.s = new Vec3();
    this.v = new Vec3();
    this.f = new Vec3();
    
    if (mass === undefined) {
        this.m = 0;
    } else {
        this.m = mass;
    }
}



/* n: number of particles
 * m: array of particle mass
 */
function ParticleSystem(n, m) {
    if (n <= 0) {
        console.error('Error with number of particles in system.');
        return;
    } else if (m !== undefined && m.length !== n) {
        console.error('Error with mass length in system.');
        return;
    }
    
    this.n = n;
    this.t = 0;
    
    this.particles = new Array(n);
    for (var i = 0; i < n; ++i) {
        this.particles[i] = new Particle(m[i]);
    }
}



function Solver(particleSystem, computeForces) {
    this.particleSystem = particleSystem;
    this.computeForces = computeForces;
}

Solver.prototype = {
    clearForce: function() {
        var particles = this.particleSystem.particles;
        for (var i = 0; i < particles.length; ++i) {
            particles[i].f = new Vec3();
        }
    },
    
    /* calculate derivative, place in dstV and dstA, which are arrays of Vec3
     * dstV stores v, dst stores a
     */
    particleDerivative: function(dstV, dstA) {
        this.clearForce();
        this.computeForces();
        
        var particles = this.particleSystem.particles;
        for (var i = 0; i < particles.length; ++i) {
            dstV[i] = particles[i].v.copy();
            dstA[i] = particles[i].f.copy().divide(particles[i].m);
        }
    }
};



function EulerSolver(particleSystem, deltaT, computeForces) {
    this.parent = new Solver(particleSystem, computeForces);
    
    this.update = function() {
        var length = this.parent.particleSystem.n;
        var dstV = new Array(length);
        var dstA = new Array(length);
        
        this.parent.particleDerivative(dstV, dstA);
        
        for (var i = 0; i < length; ++i) {
            var p = this.parent.particleSystem.particles[i];
            p.s.add(dstV[i].multiply(deltaT));
            p.v.add(dstA[i].multiply(deltaT));
        }
        
        this.parent.particleSystem.t += deltaT;
    }
}

function MidPointSolver(particleSystem, deltaT, computeForces) {
    this.parent = new Solver(particleSystem, computeForces);
    
    this.update = function() {
        var length = this.parent.particleSystem.n;
        
        var dstV = new Array(length);
        var dstA = new Array(length);        
        this.parent.particleDerivative(dstV, dstA);
        
        for (var i = 0; i < length; ++i) {
            var p = this.parent.particleSystem.particles[i];
            p.v.add(dstA[i].multiply(deltaT * 0.5)); // mid v
        }
        
        var dstV2 = new Array(length);
        var dstA2 = new Array(length);
        this.parent.particleDerivative(dstV2, dstA2);
        
        for (var i = 0; i < length; ++i) {
            var p = this.parent.particleSystem.particles[i];
            p.s.add(dstV2[i].multiply(deltaT));
            p.v.add(dstA[i].multiply(deltaT * 0.5)); // vt
        }
        
        this.parent.particleSystem.t += deltaT;
    }
}
