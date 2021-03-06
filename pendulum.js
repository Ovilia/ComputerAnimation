var pd = {
    width: 800,
    height: 600,
    yOffset: 250,
    displayRatio: 10,
    ballRadius: 12,
    forceScreenRatio: 0.2,
    
    minX: -50,
    xCnt: 50,
    parabolaA: 0.05,
    ks: 100,
    kd: 100,
    dampK: 0.1,
    constrain: null,
    constrainRatio: 0.2,
    
    system: null,
    solver: null,
    mass: [1, 1],
    stickLength: 4,
    
    wMat: null,
    
    ctx: null,
    
    stats: null,
    renderDeltaTime: 16,
    
    leftMousePressed: false,
    rightMousePressed: false,
    mouseX: null,
    mouseY: null
};

function init() {
    resize();
    window.onresize = resize;
        
    // status
    pd.stats = new Stats();
    pd.stats.domElement.style.position = 'absolute';
    pd.stats.domElement.style.left = '0px';
    pd.stats.domElement.style.top = '0px';
    document.body.appendChild(pd.stats.domElement);
    
    // particle system and solver
    pd.system = new ParticleSystem(2, pd.mass);
    pd.system.particles[1].s.set(pd.stickLength, 0, 0);
    pd.solver = new MidPointSolver(pd.system, pd.renderDeltaTime / 1000,
            computeForce);
    
    var canvas = document.getElementById('canvas');
    pd.ctx = canvas.getContext('2d');
    
    // event
    canvas.onmousedown = function(e) {
        e.preventDefault();
        e.stopPropagation();
        switch (e.which) {
            case 1:
                pd.leftMousePressed = true;
                break;
            case 3:
                pd.rightMousePressed = true;
                break;
        }
        pd.mouseX = e.clientX;
        pd.mouseY = e.clientY;
        return false;
    }
    canvas.onmouseup = function(e) {
        e.preventDefault();
        e.stopPropagation();
        pd.leftMousePressed = false;
        pd.rightMousePressed = false;
        pd.mouseX = null;
        pd.mouseY = null;
        return false;
    }
    canvas.onmousemove = function(e) {
        e.preventDefault();
        if (pd.leftMousePressed || pd.rightMousePressed) {
            pd.mouseX = e.clientX;
            pd.mouseY = e.clientY;
        } else {
            pd.mouseX = null;
            pd.mouseY = null;
        }
        return false;
    }
    canvas.oncontextmenu = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    
    // matrix init
    pd.wMat = new Matrix(6, 6, [
            [1 / pd.mass[0], 0, 0, 0, 0, 0],
            [0, 1 / pd.mass[0], 0, 0, 0, 0],
            [0, 0, 1 / pd.mass[0], 0, 0, 0],
            [0, 0, 0, 1 / pd.mass[1], 0, 0],
            [0, 0, 0, 0, 1 / pd.mass[1], 0],
            [0, 0, 0, 0, 0, 1 / pd.mass[1]]]);
    
    draw();
}

function resize() {
    // canvas size
    var width = window.innerWidth;
    var height = window.innerHeight;
    var canvas = document.getElementById('canvas');
    canvas.width = width;
    canvas.height = height;
    pd.width = width;
    pd.height = height;
}

function getScreenX(x) {
    return pd.width / 2 + x * pd.displayRatio;
}

function getScreenY(y) {
    return pd.height / 2 - y * pd.displayRatio + pd.yOffset;
}

function draw() {
    pd.stats.begin();
    
    pd.solver.update();
    
    pd.ctx.clearRect(0, 0, pd.width, pd.height);
    drawParabola();
    drawBall(0);
    drawBall(1);
    drawStick();
    drawEvent();
    drawConstrain();
    
    pd.stats.end();
    
    setTimeout(draw, pd.renderDeltaTime);
    
    function drawParabola() {
        pd.ctx.strokeStyle = '#f00';
        pd.ctx.lineWidth = 1;
        pd.ctx.beginPath();
        pd.ctx.moveTo(getScreenX(pd.minX),
                getScreenY(pd.minX * pd.minX * pd.parabolaA));
        var step = -pd.minX * 2 / pd.xCnt;
        var x = pd.minX;
        for (var i = 0; i < pd.xCnt; ++i) {
            x += step;
            pd.ctx.lineTo(getScreenX(x), getScreenY(pd.parabolaA * x * x));
        }
        pd.ctx.stroke();
    }
    
    function drawBall(i) {
        pd.ctx.fillStyle = '#ff0';
        pd.ctx.beginPath();
        pd.ctx.arc(getScreenX(pd.system.particles[i].s.x),
                getScreenY(pd.system.particles[i].s.y),
                pd.ballRadius, 0, Math.PI * 2);
        pd.ctx.fill();
    }
    
    function drawStick() {
        pd.ctx.strokeStyle = '#f00';
        pd.ctx.lineWidth = 1;
        pd.ctx.beginPath();
        pd.ctx.moveTo(getScreenX(pd.system.particles[0].s.x),
                getScreenY(pd.system.particles[0].s.y));
        pd.ctx.lineTo(getScreenX(pd.system.particles[1].s.x),
                getScreenY(pd.system.particles[1].s.y));
        pd.ctx.stroke();
    }
    
    function drawEvent() {
        pd.ctx.strokeStyle = '#0f0';
        pd.ctx.lineWidth = 2;
        if (pd.leftMousePressed) {
            pd.ctx.beginPath();
            pd.ctx.moveTo(getScreenX(pd.system.particles[0].s.x),
                    getScreenY(pd.system.particles[0].s.y));
            pd.ctx.lineTo(pd.mouseX, pd.mouseY);
            pd.ctx.stroke();
        } else if (pd.rightMousePressed) {
            pd.ctx.beginPath();
            pd.ctx.moveTo(getScreenX(pd.system.particles[1].s.x),
                    getScreenY(pd.system.particles[1].s.y));
            pd.ctx.lineTo(pd.mouseX, pd.mouseY);
            pd.ctx.stroke();
        }
    }
    
    function drawConstrain() {
        pd.ctx.strokeStyle = '#00f';
        for (var i = 0; i < 2; ++i) {
            pd.ctx.beginPath();
            pd.ctx.moveTo(getScreenX(pd.system.particles[i].s.x),
                    getScreenY(pd.system.particles[i].s.y));
            pd.ctx.lineTo(getScreenX(pd.system.particles[i].s.x
                    + pd.constrain[i].x), getScreenY(pd.system.particles[i].s.y
                    + pd.constrain[i].y));
            pd.ctx.stroke();
        }
    }
}

function computeForce() {
    var p1 = pd.system.particles[0];
    var p2 = pd.system.particles[1];
    
    // gravity
    p1.f.y = -pd.mass[0] * 9.8;
    p2.f.y = -pd.mass[1] * 9.8;
    
    p1.f.minus(p1.v.copy().multiply(pd.dampK));
    p2.f.minus(p2.v.copy().multiply(pd.dampK));
    
    // mouse force
    if (pd.leftMousePressed) {
        p1.f.x -= (getScreenX(p1.s.x) - pd.mouseX) * pd.forceScreenRatio;
        p1.f.y += (getScreenY(p1.s.y) - pd.mouseY) * pd.forceScreenRatio;
    } else if (pd.rightMousePressed) {
        p2.f.x -= (getScreenX(p2.s.x) - pd.mouseX) * pd.forceScreenRatio;
        p2.f.y += (getScreenY(p2.s.y) - pd.mouseY) * pd.forceScreenRatio;
    }
    
    var C = new Matrix(2, 1, [
        [pd.parabolaA * p1.s.x * p1.s.x - p1.s.y],
        [(p1.s.x - p2.s.x) * (p1.s.x - p2.s.x) + (p1.s.y - p2.s.y)
                * (p1.s.y - p2.s.y) - pd.stickLength * pd.stickLength]
    ]);
    var jMat = new Matrix(2, 6, [
        [2 * pd.parabolaA * p1.s.x, -1, 0, 0, 0, 0],
        [2 * (p1.s.x - p2.s.x), 2 * (p1.s.y - p2.s.y), 0,
                -2 * (p1.s.x - p2.s.x), -2 * (p1.s.y - p2.s.y), 0]
    ]);
    var jtMat = jMat.transpose();
    var jdMat = new Matrix(2, 6, [
        [2 * pd.parabolaA * p1.v.x, 0, 0, 0, 0, 0],
        [2 * (p1.v.x - p2.v.x), 2 * (p1.v.y - p2.v.y), 0,
                -2 * (p1.v.x - p2.v.x), -2 * (p1.v.y - p2.v.y), 0]
    ]);
    var qd = new Matrix(6, 1, [
        [p1.v.x],
        [p1.v.y],
        [p1.v.z],
        [p2.v.x],
        [p2.v.y],
        [p2.v.z]
    ]);
    var Q = new Matrix(6, 1, [
        [p1.f.x],
        [p1.f.y],
        [p1.f.z],
        [p2.f.x],
        [p2.f.y],
        [p2.f.z]
    ]);
    var Cd = jMat.multiply(qd);
    
    var jWjt = jMat.multiply(pd.wMat).multiply(jtMat);
    var right = jdMat.multiply(qd).negative()
            .minus(jMat.multiply(pd.wMat).multiply(Q))
            .minus(C.multiply(pd.ks)).minus(Cd.multiply(pd.kd));
    
    var a = jWjt.mat[0][0];
    var b = jWjt.mat[0][1];
    var c = jWjt.mat[1][0];
    var d = jWjt.mat[1][1];
    var e = right.mat[0][0];
    var f = right.mat[1][0];
    var lambda2 = (a * f - e * c) / (a * d - b * c);
    var lambda1 = (e - b * lambda2) / a;
    var lMat = new Matrix(2, 1, [[lambda1], [lambda2]]);
    
    // constrained force
    var force = jtMat.multiply(lMat).add(Q);
    p1.f.add(new Vec3(force.mat[0][0], force.mat[1][0], force.mat[2][0]));
    p2.f.add(new Vec3(force.mat[3][0], force.mat[4][0], force.mat[5][0]));
    
    pd.constrain = [p1.f.copy().multiply(pd.constrainRatio),
            p2.f.copy().multiply(pd.constrainRatio)];
}
