var bd = {
    beadMass: 1,
    system: null,
    solver: null,
    
    renderDeltaTime: 16,
    
    distanceRatio: 1,
    frictionRatio: 0.5,
    springK: 50,
    epson: 0.2,
    
    isFirstFrame: true,
    isMoving: false,
    
    mousePressed: false,
    
    width: 800,
    height: 600,
    
    wireRadius: 200,
    beadRadius: 20,
    
    eventWidth: 400,
    eventHeight: 300,
    
    ctx: null,
    
    stats: null
};

function init() {
    resize();
    window.onresize = resize;
    
    // mouse event
    var canvas = document.getElementById('canvas');
    canvas.onmousedown = function(e) {
        e.preventDefault();
        bd.mousePressed = true;
    }
    canvas.onmouseup = function(e) {
        e.preventDefault();
        bd.mousePressed = false;
        
        if (bd.isMoving === false) {
            start();
        }
    }
    canvas.onmousemove = function(e) {
        e.preventDefault();
        if (bd.mousePressed && e.clientX < bd.eventWidth
                && e.clientY > bd.height - bd.eventHeight) {
            var x = e.clientX - bd.eventWidth / 2;
            var y = bd.height - bd.eventHeight / 2 - e.clientY;
            console.log(x, y);
        }
    }
    
    // status
    bd.stats = new Stats();
    bd.stats.domElement.style.position = 'absolute';
    bd.stats.domElement.style.left = '0px';
    bd.stats.domElement.style.top = '0px';
    document.body.appendChild(bd.stats.domElement);
    
    // particle system and solver
    bd.system = new ParticleSystem(1, [bd.beadMass]);
    bd.system.particles[0].s.x = 1;
    bd.solver = new MidPointSolver(bd.system, bd.renderDeltaTime / 1000,
            computeForce);
    
    bd.ctx = canvas.getContext('2d');
    draw();
}

function resize() {
    // canvas size
    var width = window.innerWidth;
    var height = window.innerHeight;
    var canvas = document.getElementById('canvas');
    canvas.width = width;
    canvas.height = height;
    bd.width = width;
    bd.height = height;
}

function start() {    
    bd.system.particles[0].s.set(1, 0, 0);
    bd.system.particles[0].f.set(0, 0, 0);
    bd.system.particles[0].v.set(0, 0, 0);
    
    bd.isMoving = true;
    console.log('start');
}

function stop() {
    bd.system.particles[0].s.set(0, -1, 0);
    bd.system.particles[0].f.set(0, 0, 0);
    bd.system.particles[0].v.set(0, 0, 0);
    
    bd.isMoving = false;
    console.log('stop');
}

function draw() {
    bd.stats.begin();
    
    bd.solver.update();
    
    if (bd.isMoving || bd.isFirstFrame) {
        bd.ctx.clearRect(0, 0, bd.width, bd.height);
        drawWire();
        drawBead();
        drawEvent();
        
        if (bd.isFirstFrame) {
            bd.isFirstFrame = false;
        }
    }
    
    bd.stats.end();
    
    setTimeout(draw, bd.renderDeltaTime);
    
    function drawWire() {
        bd.ctx.strokeStyle = '#f00';
        bd.ctx.beginPath();
        bd.ctx.arc(bd.width / 2, bd.height / 2, bd.wireRadius,
                0, Math.PI * 2);
        bd.ctx.lineWidth = 10;
        bd.ctx.stroke();
    }
    
    function drawBead() {
        var s = bd.system.particles[0].s;
        s.normalize();
        // check stopped
        if (bd.system.particles[0].f.modulus() < bd.epson
                && bd.system.particles[0].v.modulus() < bd.epson) {
            stop();
        }
    
        bd.ctx.fillStyle = '#ff0';
        bd.ctx.beginPath();
        bd.ctx.arc(bd.width / 2 + s.x * bd.wireRadius,
                bd.height / 2 - s.y * bd.wireRadius,
                bd.beadRadius, 0, Math.PI * 2);
        bd.ctx.fill();
    }
    
    function drawEvent() {
        // background
        bd.ctx.fillStyle = '#aaa';
        bd.ctx.fillRect(0, bd.height - bd.eventHeight,
                bd.eventWidth, bd.eventHeight);
        
        // wire
        bd.ctx.strokeStyle = '#f00';
        bd.ctx.beginPath();
        bd.ctx.arc(bd.eventWidth / 2, bd.height - bd.eventHeight / 2
                + bd.wireRadius, bd.wireRadius, 0, Math.PI * 2);
        bd.ctx.lineWidth = 10;
        bd.ctx.stroke();
        
        // bead
        bd.ctx.fillStyle = '#ff0';
        bd.ctx.beginPath();
        bd.ctx.arc(bd.eventWidth / 2, bd.height - bd.eventHeight / 2,
                bd.beadRadius, 0, Math.PI * 2);
        bd.ctx.fill();
    }
}

function computeForce() {
    var p = bd.system.particles[0];
    var alpha = Math.atan(p.s.y / p.s.x);
    if (p.s.x < 0) {
        alpha += Math.PI;
    }
    
    // gravity
    var sin = Math.sin(alpha);
    var cos = Math.cos(alpha);
    //p.f.x = cos * sin * bd.beadMass * bd.distanceRatio;
    //p.f.y = (sin * sin - 1) * bd.beadMass * bd.distanceRatio;
    p.f.y = -bd.beadMass * 9.8 * bd.distanceRatio;
    
    // friction
    p.f.minus(p.v.copy().multiply(bd.frictionRatio));
    
    // constrain
    var lambda = - p.f.dotMultiply(p.s)
            - bd.beadMass * p.v.dotMultiply(p.v) / p.s.dotMultiply(p.s);
    p.f.add(p.s.copy().multiply(lambda));
    //console.log('contrain', p.s.copy().multiply(lambda).y * 100000);
    
    // feedback
    //console.log(p.s.modulus());
    //console.log(real.x, real.y);
    var real = p.s.copy().divide(p.s.modulus());
    p.f.add(real.minus(p.s).multiply(bd.springK));
    //console.log('feedback', real.minus(p.s).multiply(bd.springK).y * 100000);
}