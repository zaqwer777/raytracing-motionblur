// import the little Scene Graph library
import * as rt from './raytracer.js';
var Surfaces;
(function (Surfaces) {
    Surfaces.shiny = {
        diffuse: function (pos) { return rt.Color.white; },
        specular: function (pos) { return rt.Color.grey; },
        reflect: function (pos) { return 0.7; },
        roughness: 250
    };
    Surfaces.checkerboard = {
        diffuse: function (pos) {
            if ((Math.floor(pos.z) + Math.floor(pos.x)) % 2 !== 0) {
                return rt.Color.white;
            }
            else {
                return rt.Color.black;
            }
        },
        specular: function (pos) { return rt.Color.white; },
        reflect: function (pos) {
            if ((Math.floor(pos.z) + Math.floor(pos.x)) % 2 !== 0) {
                return 0.1;
            }
            else {
                return 0.7;
            }
        },
        roughness: 150
    };
})(Surfaces || (Surfaces = {}));
function defaultScene() {
    return {
        things: [new rt.Plane(new rt.Vector(0.0, 1.0, 0.0), 0.0, Surfaces.checkerboard),
            new rt.Sphere(new rt.Vector(0.0, 1.0, -0.25), 1.0, Surfaces.shiny),
            new rt.Sphere(new rt.Vector(-1.0, 0.5, 1.5), 0.5, Surfaces.shiny)],
        lights: [{ pos: new rt.Vector(-2.0, 2.5, 0.0), color: new rt.Color(0.49, 0.07, 0.07) },
            { pos: new rt.Vector(1.5, 2.5, 1.5), color: new rt.Color(0.07, 0.07, 0.49) },
            { pos: new rt.Vector(1.5, 2.5, -1.5), color: new rt.Color(0.07, 0.49, 0.071) },
            { pos: new rt.Vector(0.0, 3.5, 0.0), color: new rt.Color(0.21, 0.21, 0.35) }],
        camera: new rt.Camera(new rt.Vector(3.0, 2.0, 4.0), new rt.Vector(-1.0, 0.5, 0.0))
    };
}
function newScene() {
    return {
        things: [new rt.Plane(new rt.Vector(0.0, 1.0, 0.0), 0.0, Surfaces.checkerboard),
            new rt.Sphere(new rt.Vector(1.2, 0.4, -.4), 0.3, Surfaces.shiny),
            new rt.Sphere(new rt.Vector(-1.5, 0.6, 2.5), 0.7, Surfaces.shiny)],
        lights: [{ pos: new rt.Vector(-5.0, 5.0, 2.0), color: new rt.Color(0.22, 0.2, 0.7) },
            { pos: new rt.Vector(6.0, 3.0, 3.0), color: new rt.Color(0.14, 0.73, 0.09) },
            { pos: new rt.Vector(4.0, 8.0, 6.0), color: new rt.Color(0.82, 0.04, 0.13) },
            { pos: new rt.Vector(-8.0, 10.5, -12.5), color: new rt.Color(0.61, 0.26, 0.36) }],
        camera: new rt.Camera(new rt.Vector(3.0, 2.0, 4.0), new rt.Vector(-1.0, 0.5, 0.0))
    };
}
function exec() {
    var canv = document.createElement("canvas");
    canv.width = 640;
    canv.height = 480;
    document.body.appendChild(canv);
    var ctx = canv.getContext("2d");
    if (!ctx) {
        throw ("Couldn't create 2D context on canvas");
    }
    var rayTracer = new rt.RayTracer();
    // set up for video recording
    var length = 2; // seconds
    var fps = 10;
    //var scene = defaultScene()
    var scene = newScene();
    // <<< Beginning: THIS WILL GO AWAY in your solution, if you add motion blur
    // it will need to move into the sphere's intersect routine
    // we're going to move the sphere around
    var sphere = scene.things[1];
    var sphere2 = scene.things[2];
    // easy way to get a copy of the center
    var sphereCenter = rt.Vector.times(1.0, sphere.center);
    sphere.center.x = sphereCenter.x + Math.sin(0) / 2;
    /*
    function updateScene(frame: number) {
        var angle = (((2 * Math.PI) / length) / fps) * (fps * length - frame);
        var sin = Math.sin(angle);
        sin = Math.pow(sin, 3);
        sphere.center.x = sphereCenter.x + sin * 2;
    }*/
    function updateScene(frame) {
        var angle = (((2 * Math.PI) / length) / fps) * (fps * length - frame);
        var sin = Math.sin(angle);
        sin = Math.pow(sin, 3);
        var tan = Math.tan(angle);
        tan = Math.pow(tan, 3);
        sphere.center.z = sphereCenter.z + tan * 2;
        sphere2.center.z = sphereCenter.z + sin * 2;
    }
    // >>> End: THIS WILL GO AWAY in your solution, if you add motion blue
    // start the raytracer
    rayTracer.render(scene, length, fps, updateScene, ctx, 640, 480, 640, 480, 3, false); //1-10 // true: onlyAntialias, false: antialias and motion blur
}
exec();
//# sourceMappingURL=app.js.map