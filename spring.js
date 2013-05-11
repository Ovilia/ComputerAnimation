var animator = {
    width: null,
    height: null,
    
    stats: null,
    gui: null,
    guiValue: null,
    
    renderer: null,
    camera: null,
    scene: null,
    light: null,
    
    mousePressed: false,
    mousePressX: null,
    mousePressY: null,
    isLeftMouse: false,
    isMiddleMouse: false,
    
    world: null,
    
    isShooting: false,
    isShooted: false,
    
    renderDeltaTime: 16 // ms
}

$(document).ready(function() {
    $(window).resize(resize);
    resize();
    
    // renderer
    animator.renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: $('canvas')[0]
    });
    animator.renderer.setSize(animator.width, animator.height);
    animator.renderer.autoClear = false;
    animator.renderer.setClearColor(0xcccc66);
    
    // scene
    animator.scene = new THREE.Scene();
    
    // camera
    animator.camera = new THREE.OrthographicCamera(-4, 4, animator.height
            / animator.width * 4, -animator.height / animator.width * 4);
    animator.camera.position.set(0, -2, 1);
    animator.scene.add(animator.camera);
    
    // light
    animator.light = new THREE.DirectionalLight(0xffffff, 1.0);
    animator.light.position = animator.camera.position;
    animator.scene.add(animator.light);
    // ambient light
    var ambient = new THREE.DirectionalLight(0xcccccc);
    animator.scene.add(ambient);
    
    init();
});

function resize() {
    animator.width = document.body.clientWidth;
    animator.height = document.body.clientHeight;
    
    $('canvas').width(animator.width).height(animator.height);
    
    if (animator.camera) {
        animator.renderer.setSize(animator.width, animator.height);
    }
}

function init() {
    // FPS stats
    animator.stats = new Stats();
    animator.stats.domElement.style.position = 'absolute';
    animator.stats.domElement.style.left = '0px';
    animator.stats.domElement.style.top = '0px';
    document.body.appendChild(animator.stats.domElement);
    
    // GUI
    animator.gui = new dat.GUI();
    animator.guiValue = {
        'Delta time (ms)': 50,
        'Mass (kg)': 5,
        'Elastic k (kg/s^2)': 15,
        
        'Start': function() {
            animator.world.start();
        },
        'Reset': function() {
            animator.world.reset();
        },
        'Pause': function() {
            animator.world.pause();
        }
    };
    animator.gui.add(animator.guiValue, 'Delta time (ms)', 20, 250)
            .step(0.5).onChange(function(value) {
        animator.world.deltaTime = value;
    });
    animator.gui.add(animator.guiValue, 'Mass (kg)', 0.5, 20)
            .step(0.5).onChange(function(value) {
        animator.world.mass = value;
    });
    animator.gui.add(animator.guiValue, 'Elastic k (kg/s^2)', 0, 50)
            .step(5).onChange(function(value) {
        animator.world.elasticK = value;
    });
    animator.gui.add(animator.guiValue, 'Start');
    animator.gui.add(animator.guiValue, 'Reset');
    animator.gui.add(animator.guiValue, 'Pause');
    
    animator.world = new World();
    animator.world.load(draw);
}

function draw() {
    animator.stats.begin();
    
    animator.world.update();
    animator.renderer.render(animator.scene, animator.camera);
    
    animator.stats.end();
    
    setTimeout(draw, animator.renderDeltaTime);
}
