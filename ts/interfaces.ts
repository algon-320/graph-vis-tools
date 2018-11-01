interface IDrawable {
    draw(ctx: CanvasRenderingContext2D): void;
}

interface IMouseDraggable {
    isInnerPoint(point: Point): boolean;
}