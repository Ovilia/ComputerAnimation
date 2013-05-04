function World(width, height) {
    this.width = width;
    this.height = height;
};

function Artillery(mesh, standHeight, elevation) {
    this.mesh = mesh;
    this.standHeight = standHeight;
    this.setElevation(elevation);
};

Artillery.prototype = {
    setElevation: function(elevation) {
        this.elevation = elevation;
        this.mesh.barrel.rotation.z = elevation;
    }
};
