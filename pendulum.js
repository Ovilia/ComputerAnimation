var pd = {
    width: 800,
    height: 600,
    yOffset: 200,
    displayRatio: 100,
    ballRadius: 20,
    
    minX: -10,
    xCnt: 50,
    parabolaA: 0.1,
    
    system: null,
    solver: null,
    mass: [1, 1],
    stickLength: 1,
    
    wMat: null,
    
    ctx: null,
    
    stats: null,
    renderDeltaTime: 16
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
    pd.system.particles[0].s.set(5, pd.parabolaA * 25, 0);
    pd.system.particles[1].s.set(5, pd.parabolaA * 25 - pd.stickLength, 0);
    pd.solver = new MidPointSolver(pd.system, pd.renderDeltaTime / 1000,
            computeForce);
    
    var canvas = document.getElementById('canvas');
    pd.ctx = canvas.getContext('2d');
    
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
    
    pd.stats.end();
    
    setTimeout(draw, pd.renderDeltaTime);
    
    function drawParabola() {
        pd.ctx.strokeStyle = '#00f';
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
        pd.ctx.strokeStyle = '#0f0';
        pd.ctx.lineWidth = 5;
        pd.ctx.beginPath();
        pd.ctx.moveTo(getScreenX(pd.system.particles[0].s.x),
                getScreenY(pd.system.particles[0].s.y));
        pd.ctx.lineTo(getScreenX(pd.system.particles[1].s.x),
                getScreenY(pd.system.particles[1].s.y));
        pd.ctx.stroke();
    }
}

function computeForce() {
    for (var i = 0; i < 2; ++i) {
        var p = pd.system.particles[i];
        // gravity
        p.f.y = -pd.mass[i] * 9.8;
    }
    
    var p1 = pd.system.particles[0];
    var p2 = pd.system.particles[1];
    
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
    
    var jWjt = jMat.multiply(pd.wMat).multiply(jtMat);
    var right = jdMat.multiply(qd).negative()
            .minus(jMat.multiply(pd.wMat).multiply(Q));
    
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
    p1.f.set(force.mat[0][0], force.mat[1][0], force.mat[2][0]);
    p2.f.set(force.mat[3][0], force.mat[4][0], force.mat[5][0]);
    //p1.f.add(new Vec3(force.mat[0][0], force.mat[1][0], force.mat[2][0]));
    //p2.f.add(new Vec3(force.mat[3][0], force.mat[4][0], force.mat[5][0]));
}
