var bd = {
    beadMass: 1,
    system: null,
    solver: null,
    
    renderDeltaTime: 20,
    
    width: 800,
    height: 600,
    
    wireRadius: 200,
    beadRadius: 20,
    
    ctx: null,
    
    stats: null
};

function init() {
    // status
    bd.stats = new Stats();
    bd.stats.domElement.style.position = 'absolute';
    bd.stats.domElement.style.left = '0px';
    bd.stats.domElement.style.top = '0px';
    document.body.appendChild(bd.stats.domElement);
    
    // particle system and solver
    bd.system = new ParticleSystem(1, [bd.beadMass]);
    bd.system.particles[0].s.x = bd.wireRadius;
    bd.solver = new EulerSolver(bd.system, bd.renderDeltaTime, function(){});
    
    bd.ctx = document.getElementById('canvas').getContext('2d');
    start();
}

function start() {    
    draw();
}

function draw() {
    bd.stats.begin();
    
    bd.solver.update();
    
    bd.ctx.clearRect(0, 0, bd.width, bd.height);
    drawWire();
    drawBead()
    
    bd.stats.end();
    
    setTimeout(draw, bd.renderDeltaTime);
    
    function drawWire() {
        bd.ctx.beginPath();
        bd.ctx.arc(bd.width / 2, bd.height / 2, bd.wireRadius,
                0, Math.PI * 2);
        bd.ctx.stroke();
    }
    
    function drawBead() {    
        var s = bd.system.particles[0].s;
    
        bd.ctx.beginPath();
        bd.ctx.arc(bd.width / 2 + s.x, bd.height / 2 + s.y,
                bd.beadRadius, 0, Math.PI * 2);
        bd.ctx.stroke();
    }
}