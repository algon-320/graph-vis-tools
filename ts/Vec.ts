class Vec {
    constructor(public x: number, public y: number) { }
    static inv(v1: Vec): Vec {
        return new Vec(-v1.x, -v1.y);
    }
    static add(v1: Vec, v2: Vec): Vec {
        return new Vec(v1.x + v2.x, v1.y + v2.y);
    }
    static sub(v1: Vec, v2: Vec): Vec {
        return new Vec(v1.x - v2.x, v1.y - v2.y);
    }
    static scalar(v1: Vec, sc: number): Vec {
        return new Vec(v1.x * sc, v1.y * sc);
    }
    static abs(v1: Vec): number {
        return Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    }
    static setLength(v1: Vec, len: number): Vec {
        return this.scalar(v1, len / this.abs(v1));
    }
    static rotate(v1: Vec, theta: number): Vec {
        return new Vec(
            Math.cos(theta) * v1.x - Math.sin(theta) * v1.y,
            Math.sin(theta) * v1.x + Math.cos(theta) * v1.y
        );
    }
}

type Point = Vec;