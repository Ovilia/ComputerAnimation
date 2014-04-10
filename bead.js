var bd = {
    beadMass: 1,
    system: null,
    solver: null,
    
    renderDeltaTime: 16,
    
    distanceRatio: 1,
    frictionRatio: 0.2,
    springK: 1000,
    epson: 0.2,
    dragRatio: 0.1,
    
    isFirstFrame: true,
    isMoving: false,
    
    mousePressed: false,
    mousePressedEvent: false,
    eventX: 0,
    eventY: 0,
    
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
        updateEventXy(e);
    }
    canvas.onmouseup = function(e) {
        e.preventDefault();
        bd.mousePressed = false;
        bd.mousePressedEvent = false;
        
        if (bd.isMoving === false) {
            start();
        }
    }
    canvas.onmousemove = function(e) {
        e.preventDefault();
        updateEventXy(e);
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

function updateEventXy(event) {
    if (bd.mousePressed) {
        if (event.clientX < bd.eventWidth
                && event.clientY > bd.height - bd.eventHeight) {
            bd.eventX = event.clientX - bd.eventWidth / 2;
            bd.eventY = bd.height - bd.eventHeight / 2 - event.clientY;
            bd.mousePressedEvent = true;
        }
    }
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
    
    if (bd.isMoving || bd.isFirstFrame) {  
        bd.solver.update();
    
        bd.ctx.clearRect(0, 0, bd.width, bd.height);
        drawWire();
        drawBead();
        drawEvent();
        if (bd.mousePressed) {
            drawForce();
        }
        
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
        
        // check stopped
        //if (bd.system.particles[0].f.modulus() < bd.epson
        //        && bd.system.particles[0].v.modulus() < bd.epson) {
        //    stop();
        //}
    
        bd.ctx.fillStyle = '#ff0';
        bd.ctx.beginPath();
        bd.ctx.arc(bd.width / 2 + s.x * bd.wireRadius,
                bd.height / 2 - s.y * bd.wireRadius,
                bd.beadRadius, 0, Math.PI * 2);
        bd.ctx.fill();
    }
    
    function drawForce() {
        var force = getDragForce();
        var s = bd.system.particles[0].s;
        force.add(s.copy().multiply(bd.wireRadius));
        
        bd.ctx.strokeStyle = '#0f0';
        bd.ctx.lineWidth = 3;
        bd.ctx.beginPath();
        bd.ctx.moveTo(bd.width / 2 + s.x * bd.wireRadius,
                bd.height / 2 - s.y * bd.wireRadius);
        bd.ctx.lineTo(bd.width / 2 + force.x,
                bd.height / 2 - force.y);
        bd.ctx.stroke();
    }
    
    function drawEvent() {
        var centerX = bd.eventWidth / 2;
        var centerY = bd.height - bd.eventHeight / 2;
        
        // background
        bd.ctx.fillStyle = '#aaa';
        bd.ctx.fillRect(0, bd.height - bd.eventHeight,
                bd.eventWidth, bd.eventHeight);
        
        // wire
        bd.ctx.strokeStyle = '#f00';
        bd.ctx.beginPath();
        bd.ctx.arc(centerX, centerY + bd.wireRadius,
                bd.wireRadius, 0, Math.PI * 2);
        bd.ctx.lineWidth = 10;
        bd.ctx.stroke();
        
        // bead
        bd.ctx.fillStyle = '#ff0';
        bd.ctx.beginPath();
        bd.ctx.arc(centerX, centerY, bd.beadRadius, 0, Math.PI * 2);
        bd.ctx.fill();
        
        // force
        if (bd.mousePressed) {
            bd.ctx.strokeStyle = '#0f0';
            bd.ctx.lineWidth = 3;
            bd.ctx.beginPath();
            bd.ctx.moveTo(centerX, centerY);
            bd.ctx.lineTo(centerX + bd.eventX, centerY - bd.eventY);
            bd.ctx.stroke();
        }
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
    p.f.y = -bd.beadMass * 9.8 * bd.distanceRatio;
    
    // drag
    var force = getDragForce().multiply(bd.dragRatio);
    p.f.add(force);
    
    // friction
    p.f.minus(p.v.copy().multiply(bd.frictionRatio));
    
    // constrain
    var lambda = - p.f.dotMultiply(p.s)
            - bd.beadMass * p.v.dotMultiply(p.v) / p.s.dotMultiply(p.s);
    p.f.add(p.s.copy().multiply(lambda));
    
    // feedback
    var real = p.s.copy().divide(p.s.modulus());
    p.f.add(real.minus(p.s).multiply(bd.springK * p.v.modulus()));
}

function getDragForce() {
    if (bd.mousePressedEvent === false) {
        // no force
        return new Vec3();
    }
    
    var s = bd.system.particles[0].s;
    var alpha = Math.atan(s.y / s.x);
    if (s.x < 0) {
        alpha += Math.PI;
    }
    
    var beta = Math.atan(bd.eventX / bd.eventY);
    if (bd.eventY < 0) {
        beta += Math.PI;
    }
    
    var theta = alpha - beta;
    var length = Math.sqrt(bd.eventX * bd.eventX + bd.eventY * bd.eventY);
    return new Vec3(length * Math.cos(theta), length * Math.sin(theta), 0);
}
