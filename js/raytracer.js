///<reference path='./whammy.d.ts'/>
// whammy is a simple javascript library for creating .webm movies in the browser
//import * as Whammy from "whammy";
// classes from the Typescript RayTracer sample
export class Vector {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static times(k, v) { return new Vector(k * v.x, k * v.y, k * v.z); }
    static minus(v1, v2) { return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z); }
    static plus(v1, v2) { return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z); }
    static dot(v1, v2) { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z; }
    static mag(v) { return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }
    static norm(v) {
        var mag = Vector.mag(v);
        var div = (mag === 0) ? Infinity : 1.0 / mag;
        return Vector.times(div, v);
    }
    static cross(v1, v2) {
        return new Vector(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x);
    }
}
export class Color {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    static scale(k, v) { return new Color(k * v.r, k * v.g, k * v.b); }
    static plus(v1, v2) { return new Color(v1.r + v2.r, v1.g + v2.g, v1.b + v2.b); }
    static times(v1, v2) { return new Color(v1.r * v2.r, v1.g * v2.g, v1.b * v2.b); }
    static toDrawingColor(c) {
        var legalize = (d) => d > 1 ? 1 : d;
        return {
            r: Math.floor(legalize(c.r) * 255),
            g: Math.floor(legalize(c.g) * 255),
            b: Math.floor(legalize(c.b) * 255)
        };
    }
}
Color.white = new Color(1.0, 1.0, 1.0);
Color.grey = new Color(0.5, 0.5, 0.5);
Color.black = new Color(0.0, 0.0, 0.0);
Color.background = Color.black;
Color.defaultColor = Color.black;
export class Camera {
    constructor(pos, lookAt) {
        this.pos = pos;
        var down = new Vector(0.0, -1.0, 0.0);
        this.forward = Vector.norm(Vector.minus(lookAt, this.pos));
        this.right = Vector.times(1.5, Vector.norm(Vector.cross(this.forward, down)));
        this.up = Vector.times(1.5, Vector.norm(Vector.cross(this.forward, this.right)));
    }
}
export class Sphere {
    constructor(center, radius, surface) {
        this.center = center;
        this.surface = surface;
        this.radius2 = radius * radius;
    }
    normal(pos) { return Vector.norm(Vector.minus(pos, this.center)); }
    intersect(ray) {
        var eo = Vector.minus(this.center, ray.start);
        var v = Vector.dot(eo, ray.dir);
        var dist = 0;
        if (v >= 0) {
            var disc = this.radius2 - (Vector.dot(eo, eo) - v * v);
            if (disc >= 0) {
                dist = v - Math.sqrt(disc);
            }
        }
        if (dist === 0) {
            return null;
        }
        else {
            return { thing: this, ray: ray, dist: dist };
        }
    }
}
export class Plane {
    constructor(norm, offset, surface) {
        this.surface = surface;
        this.normal = function (pos) { return norm; };
        this.intersect = function (ray) {
            var denom = Vector.dot(norm, ray.dir);
            if (denom > 0) {
                return null;
            }
            else {
                var dist = (Vector.dot(norm, ray.start) + offset) / (-denom);
                return { thing: this, ray: ray, dist: dist };
            }
        };
    }
}
export class RayTracer {
    constructor() {
        this.maxDepth = 5;
    }
    intersections(ray, scene) {
        var closest = +Infinity;
        var closestInter = null;
        for (var i in scene.things) {
            var inter = scene.things[i].intersect(ray);
            if (inter != null && inter.dist < closest) {
                closestInter = inter;
                closest = inter.dist;
            }
        }
        return closestInter;
    }
    testRay(ray, scene) {
        var isect = this.intersections(ray, scene);
        if (isect != null) {
            return isect.dist;
        }
        else {
            return null;
        }
    }
    traceRay(ray, scene, depth) {
        var isect = this.intersections(ray, scene);
        if (isect === null) {
            return Color.background;
        }
        else {
            return this.shade(isect, scene, depth);
        }
    }
    shade(isect, scene, depth) {
        var d = isect.ray.dir;
        var pos = Vector.plus(Vector.times(isect.dist, d), isect.ray.start);
        var normal = isect.thing.normal(pos);
        var reflectDir = Vector.minus(d, Vector.times(2, Vector.times(Vector.dot(normal, d), normal)));
        var naturalColor = Color.plus(Color.background, this.getNaturalColor(isect.thing, pos, normal, reflectDir, scene));
        var reflectedColor = (depth >= this.maxDepth) ? Color.grey : this.getReflectionColor(isect.thing, pos, normal, reflectDir, scene, depth);
        return Color.plus(naturalColor, reflectedColor);
    }
    getReflectionColor(thing, pos, normal, rd, scene, depth) {
        return Color.scale(thing.surface.reflect(pos), this.traceRay({ start: pos, dir: rd }, scene, depth + 1));
    }
    getNaturalColor(thing, pos, norm, rd, scene) {
        var addLight = (col, light) => {
            var ldis = Vector.minus(light.pos, pos);
            var livec = Vector.norm(ldis);
            var neatIsect = this.testRay({ start: pos, dir: livec }, scene);
            var isInShadow = (neatIsect === null) ? false : (neatIsect <= Vector.mag(ldis));
            if (isInShadow) {
                return col;
            }
            else {
                var illum = Vector.dot(livec, norm);
                var lcolor = (illum > 0) ? Color.scale(illum, light.color)
                    : Color.defaultColor;
                var specular = Vector.dot(livec, Vector.norm(rd));
                var scolor = (specular > 0) ? Color.scale(Math.pow(specular, thing.surface.roughness), light.color)
                    : Color.defaultColor;
                return Color.plus(col, Color.plus(Color.times(thing.surface.diffuse(pos), lcolor), Color.times(thing.surface.specular(pos), scolor)));
            }
        };
        return scene.lights.reduce(addLight, Color.defaultColor);
    }
    // end of unmodified functions from the Typescript RayTracing sample
    // The sample render() function has been modified from the original typescript sample
    // 1. it renders 1 line at a time, and uses requestAnimationFrame(render) to schedule 
    //    the next line.  This causes the lines to be displayed as they are rendered.
    // 2. it takes addition parameters to allow it to render a smaller # of pixels that the size
    //    of the canvas
    // 3. it creates a Whammy.Video object and some parameters to render a movie from a sequence
    //    of frames
    render(scene, length, fps, updateScene, ctx, screenWidth, screenHeight, canvasWidth, canvasHeight, grid, onlyAntialias) {
        var aspect = screenWidth / screenHeight;
        var getPoint = (x, y, camera) => {
            var recenterX = (x) => (x - (screenWidth / 2.0)) / 2.0 / screenWidth * aspect;
            var recenterY = (y) => -(y - (screenHeight / 2.0)) / 2.0 / screenHeight;
            return Vector.norm(Vector.plus(camera.forward, Vector.plus(Vector.times(recenterX(x), camera.right), Vector.times(recenterY(y), camera.up))));
        };
        var encoder = new Whammy.Video(fps);
        // rather than doing a for loop for y, we're going to draw each line in
        // an animationRequestFrame callback, so we see them update 1 by 1
        var pixelWidth = canvasWidth / screenWidth;
        var pixelHeight = canvasHeight / screenHeight;
        var y = 0;
        // how many frames       
        var frame = length * fps;
        var renderRow = () => {
            for (var x = 0; x < screenWidth; x++) {
                var colorSum = new Color(0, 0, 0);
                var samples = 1;
                for (var i = 0; i < grid; i++) {
                    for (var j = 0; j < grid; j++) {
                        var xVal = x - Math.random() - 0.5;
                        var yVal = y - Math.random() - 0.5;
                        var temp = new Color(0, 0, 0);
                        if (onlyAntialias) { // only antialiasing
                            temp = this.traceRay({ start: scene.camera.pos, dir: getPoint(xVal, yVal, scene.camera) }, scene, 0);
                        }
                        else { //antialias with motion blur 
                            temp = motionBlur(xVal, yVal);
                            samples = 15;
                        }
                        colorSum = Color.plus(colorSum, temp);
                    }
                }
                colorSum = Color.scale(1.0 / (grid * grid * samples), colorSum);
                var c = Color.toDrawingColor(colorSum);
                ctx.fillStyle = "rgb(" + String(c.r) + ", " + String(c.g) + ", " + String(c.b) + ")";
                ctx.fillRect(x * pixelWidth, y * pixelHeight, pixelWidth + 1, pixelHeight + 1);
            }
            // finished the row, so increment row # and see if we are done
            y++;
            if (y < screenHeight) {
                // finished a line, do another
                requestAnimationFrame(renderRow);
            }
            else {
                // finished current frame, let see if we have more to render
                if (frame > 0) {
                    // add last frame to the video
                    encoder.add(ctx);
                    // increment frame, restart the line counter
                    y = 0;
                    frame--;
                    // update the scene for the frame, starting a zero and counting up
                    updateScene(length * fps - frame);
                    // start the next frame         
                    requestAnimationFrame(renderRow);
                }
                else {
                    // we are completely done, create the video and add to video element
                    var outputVideo = document.getElementById('output');
                    if (outputVideo) {
                        var blob = encoder.compile(false);
                        var url = URL.createObjectURL(blob);
                        outputVideo.src = url;
                    }
                }
            }
        };
        var motionBlur = (xPrime, yPrime) => {
            var blur = 2;
            var samples = 15;
            var newColor = new Color(0, 0, 0);
            for (var sample = 0; sample < samples; sample++) {
                var blurVar = Math.random() * blur;
                var f = frame - blurVar;
                updateScene(length * fps - f);
                var temp = this.traceRay({ start: scene.camera.pos, dir: getPoint(xPrime, yPrime, scene.camera) }, scene, 0);
                newColor = Color.plus(newColor, temp);
            }
            updateScene(length * fps - frame);
            return newColor;
        };
        renderRow();
    }
}
//# sourceMappingURL=raytracer.js.map