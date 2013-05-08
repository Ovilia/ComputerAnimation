var animator = {
    width: null,
    height: null,
    
    stats: null,
    gui: null,
    guiValue: null,
    
    renderer: null,
    camera: null,
    cameraLookX: 0,
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
            // different action according to left or right mouse
            if (animator.isLeftMouse) {
                // rotate camera with mouse dragging
                var da = Math.PI * dx / animator.width * 0.05;
                var x = animator.camera.position.x;
                var z = animator.camera.position.z;
                var cos = Math.cos(da);
                var sin = Math.sin(da);
                animator.camera.position.x = cos * x - sin * z;
                animator.camera.position.z = sin * x + cos * z;
                animator.camera.lookAt(new THREE.Vector3(
                        animator.cameraLookX, 250, 0));
                
            } else if (animator.isMiddleMouse) {
                // move camera
                var distance = -dx / animator.width * 100;
                if (animator.camera.position.z < 0) {
                    distance = -distance;
                }
                animator.cameraLookX += distance;
                animator.camera.position.x += distance;
            }
        }
    }).mousedown(function(event) {
        event.preventDefault();
        
        animator.mousePressed = true;
        animator.mousePressX = event.clientX;
        animator.mousePressY = event.clientY;
        
        animator.isLeftMouse = false;
        animator.isRightMouse = false;
        if (event.which === 1) {
            animator.isLeftMouse = true;
        } else if (event.which === 2) {
            animator.isMiddleMouse = true;
        }
        
    }).mouseup(function() {
        event.preventDefault();
        
        animator.mousePressed = false;
        
    }).bind('mousewheel', function(e){
        event.preventDefault();
        
        if (e.originalEvent.wheelDelta > 0) {
            // zoom in
            animator.camera.position.x *= 0.8;
            animator.camera.position.y *= 0.8;
            animator.camera.position.z *= 0.8;
        } else {
            // zoom out
            animator.camera.position.x *= 1.25;
            animator.camera.position.y *= 1.25;
            animator.camera.position.z *= 1.25;
        }
        animator.camera.lookAt(new THREE.Vector3(0, 250, 0));
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
    animator.camera = new THREE.PerspectiveCamera(
            60, animator.width / animator.height, 1, 10000);
    animator.camera.position.set(750, 1000, 750);
    animator.camera.lookAt(new THREE.Vector3(0, 250, 0));
    animator.scene.add(animator.camera);
    
    // light
    animator.light = new THREE.DirectionalLight(0xffffff, 1.0);
    animator.light.position = animator.camera.position;
    animator.scene.add(animator.light);
    // ambient light
    var ambient = new THREE.DirectionalLight(0xcccccc);
    animator.scene.add(ambient);
    
    // plane
    var chessTexture = THREE.ImageUtils.loadTexture('image/chess.jpg');
    chessTexture.wrapS = chessTexture.wrapT = THREE.RepeatWrapping;
    chessTexture.repeat.set(32, 16);
    var chessMat = new THREE.MeshLambertMaterial({
        color: 0x666666,
        map: chessTexture
    });
    var plane = new THREE.Mesh(new THREE.PlaneGeometry(4000, 2000));
    plane.rotation.x = -Math.PI / 2;
    plane.position.x = 1000;
    plane.material = chessMat;
    animator.scene.add(plane);
    
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
        'Delta time (ms)': 20,
        'Elevation (deg)': 45,
        'Barrel length(cm)': 80,
        'Azimuth (deg)': 0,
        'Projectile mass (kg)': 1,
        'Powder mass (kg)': 5,
        'Air friction (kg/s)': 50,
        
        'Shoot': function() {
            animator.world.shoot();
        },
        'Reset': function() {
            animator.world.reset();
        }
    };
    animator.gui.add(animator.guiValue, 'Delta time (ms)', 20, 250)
            .step(10).onChange(function(value) {
        animator.world.deltaTime = value;
    });
    animator.gui.add(animator.guiValue, 'Barrel length(cm)', 0, 120)
            .step(1).onChange(function(value) {
        animator.world.barrelLength = value;
    });
    animator.gui.add(animator.guiValue, 'Elevation (deg)', 0, 90)
            .step(1).onChange(function(value) {
        animator.world.setElevation(value);
    });
    animator.gui.add(animator.guiValue, 'Azimuth (deg)', -90, 90)
            .step(1).onChange(function(value) {
        animator.world.setAzimuth(value);
    });
    animator.gui.add(animator.guiValue, 'Projectile mass (kg)', 0, 10)
            .onChange(function(value) {
        animator.world.projectileMass = value;
    });
    animator.gui.add(animator.guiValue, 'Powder mass (kg)', 0, 10)
            .onChange(function(value) {
        animator.world.powderMass = value;
    });
    animator.gui.add(animator.guiValue, 'Air friction (kg/s)', 0, 100)
            .onChange(function(value) {
        animator.world.airFriction = value;
    });
    animator.gui.add(animator.guiValue, 'Shoot');
    animator.gui.add(animator.guiValue, 'Reset');
    
    animator.world = new World(2000, 2000);
    animator.world.load(draw);
    
}

function draw() {
    animator.stats.begin();
    
    animator.world.update();
    animator.renderer.render(animator.scene, animator.camera);
    
    animator.stats.end();
    
    setTimeout(draw, animator.renderDeltaTime);
}
