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
    
    // mouse event
    $('canvas').mousemove(function(event) {
        event.preventDefault();
        
        if (animator.mousePressed) {
        var dx = event.clientX - animator.mousePressX;
        // move camera
        var distance = -dx / animator.width / 5;
        if (animator.camera.position.z < 0) {
                distance = -distance;
            }
            animator.camera.position.x += distance;
        }
        
    }).mousedown(function(event) {
        event.preventDefault();
        
        animator.mousePressed = true;
        animator.mousePressX = event.clientX;
        animator.mousePressY = event.clientY;
                
    }).mouseup(function() {
        event.preventDefault();
        
        animator.mousePressed = false;
        
    }).bind('mousewheel', function(e){
        event.preventDefault();
        
        if (e.originalEvent.wheelDelta > 0) {
            // zoom in
            animator.camera.position.z -= 0.5;
        } else {
            // zoom out
            animator.camera.position.z += 0.5;
        }
    });
    
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
    animator.camera = new THREE.OrthographicCamera(-2, 2, animator.height
            / animator.width * 2, -animator.height / animator.width * 2);
    animator.camera.position.set(0, -1, 1);
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
        animator.camera.aspect = animator.width / animator.height;
        animator.camera.updateProjectionMatrix();
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
        'Mass (kg)': 5,
        'K (kg/s^2)': 15,
        
        'Start': function() {
        },
        'Reset': function() {
        }
    };
    animator.gui.add(animator.guiValue, 'Mass (kg)', 0.5, 20)
            .step(0.5).onChange(function(value) {
    });
    animator.gui.add(animator.guiValue, 'K (kg/s^2)', 0, 50)
            .step(5).onChange(function(value) {
    });
    animator.gui.add(animator.guiValue, 'Start');
    animator.gui.add(animator.guiValue, 'Reset');
    
    animator.world = new World();
    animator.world.load(draw);
}

function draw() {
    animator.stats.begin();
    
    animator.renderer.render(animator.scene, animator.camera);
    
    animator.stats.end();
    
    setTimeout(draw, animator.renderDeltaTime);
}
