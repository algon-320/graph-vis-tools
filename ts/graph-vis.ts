const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("canvas");
const ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
canvas.width = 1800;
canvas.height = 1000;
ctx.font = "bold 16px 'monospace'";
ctx.textAlign = 'center';

const inputAdjList = <HTMLTextAreaElement>document.getElementById("inputAdjList");
const inputVertexRadius = <HTMLInputElement>document.getElementById("inputVertexRadius");
const inputEdgeLength = <HTMLInputElement>document.getElementById("inputEdgeLength");
const radioZeroIndexed = <HTMLInputElement>document.getElementById("radioZeroIndexed");
const radioOneIndexed = <HTMLInputElement>document.getElementById("radioOneIndexed");
const radioUndirected = <HTMLInputElement>document.getElementById("radioUndirected");
const radioDirected = <HTMLInputElement>document.getElementById("radioDirected");
const checkboxGravity = <HTMLInputElement>document.getElementById("checkboxGravity");

enum VertexIndexing {
    zero,
    one,
}
enum EdgeDirection {
    undirected,
    directed,
}

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

enum VertexState {
    moving = 1 << 1,
    floating = 1 << 2,
    fixed = 1 << 3,
    stuck = moving | fixed
}

class Vertex {
    p: Point;
    v: Vec;
    state: VertexState;
    constructor() {
        this.p = new Vec(Math.random() * 1000, Math.random() * 1000);
        this.v = new Vec(0, 0);
        this.state = VertexState.floating;
    }
}

let vertexIndexing = VertexIndexing.zero;
let edgeDirection = EdgeDirection.directed;
let vertexRadius = 20;
let edgeLength = 100;
let enableGravity = false;

let numVertex = 2;
let vs: Array<Vertex> = [];

class Edge<Cost> {
    constructor(public from: number, public to: number, public cost: Cost) { }
}
interface AdjacencyList<Cost> {
    [index: number]: { [index: number]: Edge<Cost> };
}
let adjList: AdjacencyList<string | null> = {};
adjList[0] = { 1: new Edge(0, 1, null) };
let clicked: number = -1;

function existEdge(from: number, to: number): boolean {
    return from in adjList && to in adjList[from];
}

function drawArrow(from: Point, to: Point, lineWidth: number, arrowHeadSize: number) {
}

let edgeColor: string = "rgb(30, 30, 30)";
let vertexColorClicked: string = "rgb(70, 70, 255)";
let vertexColorNormal: string = "rgb(255, 70, 70)";
let fontColor: string = "white";
let backgroundColor: string = "white";
function render(): void {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const arrowSize = 10;
    const edgeWidth = 4;
    // 辺
    ctx.strokeStyle = edgeColor;
    ctx.fillStyle = edgeColor;
    for (let i = 0; i < numVertex; i++) {
        for (let j = 0; j < numVertex; j++) {
            if (!existEdge(i, j)) continue;
            let vec = Vec.sub(vs[j].p, vs[i].p);

            let cost = adjList[i][j].cost;
            if (cost != null) {  // コストを描画
                let center = Vec.add(vs[i].p, Vec.scalar(vec, 0.5));
                let out = Vec.rotate(Vec.scalar(vec, 0.5), -Math.PI / 2);
                let p = Vec.add(center, Vec.setLength(out, 15));
                ctx.fillText(cost.toString(), p.x, p.y);
            }

            let len = Vec.abs(vec) - vertexRadius;
            vec = Vec.setLength(vec, len);
            let pi = vs[i].p;
            let arrowP = new Array<Vec>();

            vec = Vec.rotate(vec, Math.PI * 3 / 2);
            vec = Vec.setLength(vec, edgeWidth / 2);
            let p1 = Vec.add(pi, vec);
            arrowP.push(p1);

            vec = Vec.rotate(vec, Math.PI / 2);
            vec = Vec.setLength(vec, len);
            const pj = Vec.add(p1, vec);

            if (edgeDirection == EdgeDirection.directed) {
                vec = Vec.setLength(vec, len - arrowSize * 1.732);
                let p2 = Vec.add(p1, vec);
                arrowP.push(p2);

                vec = Vec.rotate(vec, Math.PI * 3 / 2);
                vec = Vec.setLength(vec, arrowSize);
                let p3 = Vec.add(p2, vec);
                arrowP.push(p3);
            }

            arrowP.push(pj);

            vec = Vec.setLength(Vec.sub(pi, p1), edgeWidth);
            let p4 = Vec.add(pj, vec);
            arrowP.push(p4);

            vec = Vec.sub(pi, p1);
            vec = Vec.setLength(vec, edgeWidth / 2);
            let p5 = Vec.add(pi, vec);
            arrowP.push(p5);

            // ---- draw polygon ----
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            for (let k = 0; k < arrowP.length; k++) {
                ctx.lineTo(arrowP[k].x, arrowP[k].y);
            }
            ctx.closePath();
            ctx.fill();
            // ----------------------
        }
    }

    // 頂点
    ctx.lineWidth = 3;
    for (let i = 0; i < numVertex; i++) {
        if (i == clicked) {
            ctx.fillStyle = vertexColorClicked;
        } else {
            ctx.fillStyle = vertexColorNormal;
        }
        ctx.beginPath();
        ctx.arc(vs[i].p.x, vs[i].p.y, vertexRadius, 0, 2 * 3.14, false);
        ctx.closePath();
        ctx.fill();
        if ((vs[i].state & VertexState.stuck) > 0) {
            ctx.stroke();
        }

        ctx.fillStyle = fontColor;
        ctx.fillText(i.toString(), vs[i].p.x, vs[i].p.y + 5);
    }
}

function demoInit(): void {
    for (let i = 0; i < numVertex; i++) {
        vs.push(new Vertex());
    }
    vs[0].p = new Vec(500, 500);
    vs[0].state = VertexState.fixed;
}

function updateUI(): void {
    switch (vertexIndexing) {
        case VertexIndexing.zero:
            radioZeroIndexed.checked = true;
            break;
        case VertexIndexing.one:
            radioOneIndexed.checked = true;
            break;
    }

    switch (edgeDirection) {
        case EdgeDirection.undirected:
            radioUndirected.checked = true;
            break;
        case EdgeDirection.directed:
            radioDirected.checked = true;
            break;
    }

    inputVertexRadius.value = vertexRadius.toString();
    inputEdgeLength.value = edgeLength.toString();

    checkboxGravity.checked = enableGravity;

    // textareaの更新
    let valueAL = "";
    for (let i = 0; i < numVertex; i++) {
        let fromJ = (edgeDirection == EdgeDirection.directed) ? 0 : i;
        for (let j = fromJ; j < numVertex; j++) {
            if (existEdge(i, j)) {
                valueAL += i.toString() + " " + j.toString();
                let cost = adjList[i][j].cost;
                if (cost != null) {
                    valueAL += " " + cost.toString();
                }
                valueAL += "\n";
            }
        }
    }
    inputAdjList.value = valueAL;
}

let sumEnergy = 0;
function update(): void {
    updateUI();  // UIパーツを更新

    // 定数 ------------------------
    const coulombK = 1000;
    const springK = 1;
    const energyLowerbound = 0.1;
    const deltaT = 0.1;
    const M = 1;
    const decK = 0.95;
    const G = 10;
    // -----------------------------
    function moveVertices(timestamp: DOMHighResTimeStamp): void {
        sumEnergy = 0;
        for (let i = 0; i < numVertex; i++) {
            const v1 = vs[i];

            let F = new Vec(0, 0);

            // クーロン力
            for (let j = 0; j < numVertex; j++) {
                if (i == j) continue;
                const v2 = vs[j];

                let vec = Vec.sub(v1.p, v2.p);
                let absf = coulombK / Vec.abs(vec);
                absf = absf * absf;

                let f = vec;
                f = Vec.scalar(f, absf / Vec.abs(f));  // 長さを設定
                F = Vec.add(F, f);
            }

            // フックの法則
            for (let j = 0; j < numVertex; j++) {
                if (i == j) continue;
                if (!existEdge(i, j) && !existEdge(j, i)) continue;
                const v2 = vs[j];
                let vec = Vec.sub(v2.p, v1.p);

                let absf = springK * (Vec.abs(vec) - edgeLength);
                let f = vec;
                f = Vec.scalar(f, absf / Vec.abs(f));  // 長さを設定
                F = Vec.add(F, f);
            }

            if (enableGravity) {
                F = Vec.add(F, new Vec(0, G * M));
            }

            if ((vs[i].state & VertexState.stuck) == 0) {
                v1.v = Vec.scalar(Vec.add(v1.v, Vec.scalar(F, deltaT / M)), decK);
                v1.p = Vec.add(v1.p, Vec.scalar(v1.v, deltaT));
            }
            sumEnergy += M * Vec.abs(v1.v) * Vec.abs(v1.v);
        }
        render();
        // console.log("sumEnergy: ", sumEnergy);

        if (sumEnergy > energyLowerbound) {
            window.requestAnimationFrame(moveVertices);
        } else {
            console.log("stable");
        }
    }
    if (sumEnergy <= energyLowerbound) {
        window.requestAnimationFrame(moveVertices);
    }
}


function onMouseDown(e: MouseEvent): void {
    for (let i = 0; i < numVertex; i++) {
        if (Vec.abs(Vec.sub(vs[i].p, new Vec(e.offsetX, e.offsetY))) < vertexRadius) {
            clicked = i;
            vs[i].state |= VertexState.moving;
            break;
        }
    }
    render();
}
function onMouseUp(e: MouseEvent): void {
    if (clicked == -1) return;
    if (e.button == 2) {  // 右クリック
        vs[clicked].state ^= VertexState.fixed;  // 固定状態を反転
    }
    vs[clicked].state &= ~VertexState.moving;
    clicked = -1;
    render();
}
function onMouseMove(e: MouseEvent): void {
    if (clicked == -1) return;
    vs[clicked].p = { x: e.offsetX, y: e.offsetY };
    update();
}
canvas.addEventListener("mousedown", onMouseDown, false);
canvas.addEventListener("mouseup", onMouseUp, false);
canvas.addEventListener("mousemove", onMouseMove, false);
// 右クリックのコンテキストメニュー表示を無効化
canvas.addEventListener("contextmenu", function (e: MouseEvent): void { e.preventDefault(); });


function getRadioButtonIndexing() {
    if (radioZeroIndexed.checked) {
        vertexIndexing = VertexIndexing.zero;
    } else if (radioOneIndexed.checked) {
        vertexIndexing = VertexIndexing.one;
    }
    update();
}
function getRadioButtonEdgeDirection() {
    if (radioUndirected.checked) {
        edgeDirection = EdgeDirection.undirected;
    } else if (radioDirected.checked) {
        edgeDirection = EdgeDirection.directed;
    }
    update();
}
radioZeroIndexed.addEventListener("change", getRadioButtonIndexing, false);
radioOneIndexed.addEventListener("change", getRadioButtonIndexing, false);
radioUndirected.addEventListener("change", getRadioButtonEdgeDirection, false);
radioDirected.addEventListener("change", getRadioButtonEdgeDirection, false);

function getInputVertexRadius(): void {
    vertexRadius = parseInt(inputVertexRadius.value);
    update();
}
function getInputEdgeLength(): void {
    edgeLength = parseInt(inputEdgeLength.value);
    update();
}
inputVertexRadius.addEventListener("change", getInputVertexRadius, false);
inputEdgeLength.addEventListener("change", getInputEdgeLength, false);

function getCheckboxGravity() {
    enableGravity = checkboxGravity.checked;
    update();
}
checkboxGravity.addEventListener("input", getCheckboxGravity, false);

function getTextareaAdjList(): void {
    let mxID = -1;
    let lines = inputAdjList.value.split(/\r\n|\r|\n/);
    adjList = {};
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === "") continue;
        let e = lines[i].split(/\s*,\s*|\s+/);
        if (e.length < 2 || e[1] === "") continue;

        let a = parseInt(e[0]), b = parseInt(e[1]), c = null;
        if (e.length >= 3) c = e[2];

        mxID = Math.max(mxID, a, b);
        if (!(a in adjList)) adjList[a] = {};
        adjList[a][b] = new Edge(a, b, c);
        if (edgeDirection == EdgeDirection.undirected) {
            if (!(b in adjList)) adjList[b] = {};
            adjList[b][a] = new Edge(b, a, c);
        }
    }
    let newNumVertex = mxID + 1;
    for (let i = numVertex; i <= newNumVertex; i++) {
        vs.push(new Vertex());
    }
    numVertex = newNumVertex;
    update();
}
inputAdjList.addEventListener("change", getTextareaAdjList, false);

demoInit();
update();