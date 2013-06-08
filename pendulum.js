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
    pd.system.particles[1].s.y = -pd.stickLength;
    pd.solver = new MidPointSolver(pd.system, pd.renderDeltaTime / 1000,
            computeForce);
    
    var canvas = document.getElementById('canvas');
    pd.ctx = canvas.getContext('2d');
    
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
    
}
