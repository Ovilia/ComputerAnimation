var animator = {
    width: null,
    height: null,
    
    renderer: null,
    camera: null,
    scene: null,
    light: null,
    
    mousePressed: false,
    mousePressX: null,
    mousePressY: null,
    
    world: null
}

$(document).ready(function() {
    $(window).resize(resize);
    resize();
    
    // mouse event
    $('canvas').mousemove(function(event) {
        if (animator.mousePressed) {
            // rotate camera with mouse dragging
            var dx = event.clientX - animator.mousePressX;
            var da = Math.PI * dx / animator.width * 0.05;
            var x = animator.camera.position.x;
            var z = animator.camera.position.z;
            var cos = Math.cos(da);
            var sin = Math.sin(da);
            animator.camera.position.x = cos * x - sin * z;
            animator.camera.position.z = sin * x + cos * z;
            animator.camera.lookAt(new THREE.Vector3(0, 250, 0));
        }
    }).mousedown(function(event) {
        animator.mousePressed = true;
        animator.mousePressX = event.clientX;
        animator.mousePressY = event.clientY;
    }).mouseup(function() {
        animator.mousePressed = false;
    }).bind('mousewheel', function(e){
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
    });
    
    init();
    
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
    chessTexture.repeat.set(16, 16);
    var chessMat = new THREE.MeshLambertMaterial({
        color: 0x666666,
        map: chessTexture
    });
    var plane = new THREE.Mesh(new THREE.PlaneGeometry(
            animator.world.width, animator.world.height));
    plane.rotation.x = -Math.PI / 2;
    plane.material = chessMat;
    animator.scene.add(plane);
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
    animator.world = new World(2000, 2000);
    
    var loader = new THREE.OBJMTLLoader();
    loader.addEventListener('load', function (event) {
        // add to scene once loaded
        var barrel = event.content;
        barrel.position.set(-750, 200, 0);
        animator.scene.add(barrel);
    
        draw();
    });
    loader.load('model/barrel.obj', 'model/barrel.mtl');
}

function draw() {
    animator.renderer.render(animator.scene, animator.camera);
    
    requestAnimationFrame(draw);
}
