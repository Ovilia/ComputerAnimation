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
    
    copy: function() {
        return new Vec3(this.x, this.y, this.z);
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
