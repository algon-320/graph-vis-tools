enum VertexState {
    moving = 1 << 1,
    floating = 1 << 2,
    fixed = 1 << 3,
    stuck = moving | fixed
}

class Vertex implements IDrawable, IMouseDraggable {
    id: string;
    p: Point;
    v: Vec;
    state: VertexState;

    radius: number;  // 辺の長さの計算に使う

    constructor(id: string, radius: number = vertexRadius) {
        this.id = id;
        this.p = new Vec(Math.random() * 1000, Math.random() * 1000);
        this.v = new Vec(0, 0);
        this.state = VertexState.floating;
        this.radius = radius;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.lineWidth = 3;
        if (this.state == VertexState.moving) {
            ctx.fillStyle = Graph.vertexColorClicked;
        } else {
            ctx.fillStyle = Graph.vertexColorNormal;
        }

        const r = this.radius;
        // ctx.beginPath();
        // ctx.moveTo(this.p.x - r, this.p.y - r);
        // ctx.lineTo(this.p.x + r, this.p.y - r);
        // ctx.lineTo(this.p.x + r, this.p.y + r);
        // ctx.lineTo(this.p.x - r, this.p.y + r);
        // ctx.closePath();
        // ctx.fill();
        ctx.beginPath();
        ctx.arc(this.p.x, this.p.y, r, 0, 2 * 3.14, false);
        ctx.closePath();
        ctx.fill();

        if ((this.state & VertexState.stuck) > 0) {
            ctx.stroke();
        }

        ctx.fillStyle = Graph.fontColor;
        ctx.fillText(this.id.toString(), this.p.x, this.p.y + 5);
    }

    public isInnerPoint(point: Point): boolean {
        // TODO: shape
        // if (true || this.id == "0") {
        //     return (this.p.x - this.radius <= point.x && point.x <= this.p.x + this.radius &&
        //         this.p.y - this.radius <= point.y && point.y <= this.p.y + this.radius);
        // }
        return (Vec.abs(Vec.sub(this.p, point)) < this.radius);
    }
}