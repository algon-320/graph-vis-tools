const canvasWrapper = <HTMLDivElement>document.getElementById("wrapper");
const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("canvas");
const ctx = <CanvasRenderingContext2D>canvas.getContext("2d");

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
    id: number;
    p: Point;
    v: Vec;
    state: VertexState;
    constructor(id: number) {
        this.id = id;
        this.p = new Vec(Math.random() * 1000, Math.random() * 1000);
        this.v = new Vec(0, 0);
        this.state = VertexState.floating;
    }
}

class VertexSet {
    vs: { [index: number]: Vertex };
    keys: Array<number>;
    constructor() {
        this.vs = {};
        this.keys = [];
    }

    public add(id: number): void {
        this.vs[id] = new Vertex(id);
        this.updatekeys();
    }
    public checkExist(id: number): boolean {
        return id in this.vs;
    }
    public getNumVertex(): number {
        return Object.keys(vs).length;
    }
    public getKeys(): Array<number> {
        return this.keys;
    }
    public at(id: number): Vertex {
        return this.vs[id];
    }

    private updatekeys(): void {
        this.keys = Object.keys(this.vs).map(function (x: string) { return parseInt(x); });
    }
}

class Edge<Cost> {
    constructor(public from: number, public to: number, public cost: Cost) { }
}
interface AdjacencyList<Cost> {
    [index: number]: { [index: number]: Edge<Cost> };
}


let vertexIndexing = VertexIndexing.zero;
let edgeDirection = EdgeDirection.directed;
let vertexRadius = 20;
let edgeLength = 100;
let enableGravity = false;

const vs = new VertexSet();

let adjList: AdjacencyList<string | null> = {};
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const arrowSize = 10;
    const edgeWidth = 4;
    // 辺
    ctx.strokeStyle = edgeColor;
    ctx.fillStyle = edgeColor;
    for (const i of vs.getKeys()) {
        for (const j of vs.getKeys()) {
            if (!existEdge(i, j)) continue;
            let vec = Vec.sub(vs.at(j).p, vs.at(i).p);

            let cost = adjList[i][j].cost;
            if (cost != null) {  // コストを描画
                let center = Vec.add(vs.at(i).p, Vec.scalar(vec, 0.5));
                let out = Vec.rotate(Vec.scalar(vec, 0.5), -Math.PI / 2);
                let p = Vec.add(center, Vec.setLength(out, 15));
                ctx.fillText(cost.toString(), p.x, p.y + 5);
            }

            let len = Vec.abs(vec) - vertexRadius;
            vec = Vec.setLength(vec, len);
            let pi = vs.at(i).p;
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
    for (const i of vs.getKeys()) {
        if (i == clicked) {
            ctx.fillStyle = vertexColorClicked;
        } else {
            ctx.fillStyle = vertexColorNormal;
        }
        ctx.beginPath();
        ctx.arc(vs.at(i).p.x, vs.at(i).p.y, vertexRadius, 0, 2 * 3.14, false);
        ctx.closePath();
        ctx.fill();
        if ((vs.at(i).state & VertexState.stuck) > 0) {
            ctx.stroke();
        }

        ctx.fillStyle = fontColor;
        ctx.fillText(i.toString(), vs.at(i).p.x, vs.at(i).p.y + 5);
    }
}

function demoInit(): void {
    adjList[0] = { 1: new Edge(0, 1, null) };
    vs.add(0);
    vs.add(1);

    vs.at(0).p = new Vec(500, 500);
    vs.at(0).state = VertexState.fixed;
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
    for (const i of vs.getKeys()) {
        for (const j of vs.getKeys()) {
            let print_edge = false;
            let cost = null;
            if (edgeDirection == EdgeDirection.directed) {
                if (existEdge(i, j)) {
                    print_edge = true;
                    cost = adjList[i][j].cost;
                }
            } else {
                if (j < i) continue;
                if (existEdge(i, j)) {
                    print_edge = true;
                    cost = adjList[i][j].cost;
                }
                if (existEdge(j, i)) {
                    print_edge = true;
                    cost = adjList[j][i].cost;
                }
            }

            if (print_edge) {
                valueAL += i.toString() + " " + j.toString();
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
    const coulombK = 1500;
    const springK = 1.2;
    const energyLowerbound = 1;
    const deltaT = 0.2;
    const M = 1;
    const decK = 0.6;
    const G = 100;
    // -----------------------------
    function moveVertices(timestamp: DOMHighResTimeStamp): void {
        sumEnergy = 0;
        for (const i of vs.getKeys()) {
            const v1 = vs.at(i);

            let F = new Vec(0, 0);

            // 頂点からのクーロン力
            for (const j of vs.getKeys()) {
                if (i == j) continue;
                const v2 = vs.at(j);

                let vec = Vec.sub(v1.p, v2.p);
                let absf = coulombK / Vec.abs(vec);
                absf = absf * absf;

                let f = vec;
                f = Vec.scalar(f, absf / Vec.abs(f));  // 長さを設定
                // if (Vec.abs(f) < 5) continue;
                F = Vec.add(F, f);
            }
            // 枠からのクーロン力
            {
                const K = coulombK;
                let sum = new Vec(0, 0);
                let f = new Vec(0, K / Math.max(v1.p.y - 0, 1));
                if (Vec.abs(f) > 10) sum = Vec.add(sum, f);

                f = new Vec(0, -(K / Math.max(canvas.height - v1.p.y, 1)));
                if (Vec.abs(f) > 10) sum = Vec.add(sum, f);

                f = new Vec(K / Math.max(v1.p.x - 0, 1), 0);
                if (Vec.abs(f) > 10) sum = Vec.add(sum, f);

                f = new Vec(-(K / Math.max(canvas.width - v1.p.x, 1)), 0);
                if (Vec.abs(f) > 10) sum = Vec.add(sum, f);
                F = Vec.add(F, sum);
            }

            // フックの法則
            for (const j of vs.getKeys()) {
                if (i == j) continue;
                if (!existEdge(i, j) && !existEdge(j, i)) continue;
                const v2 = vs.at(j);
                let vec = Vec.sub(v2.p, v1.p);

                let absf = springK * (Vec.abs(vec) - edgeLength);
                let f = vec;
                f = Vec.scalar(f, absf / Vec.abs(f));  // 長さを設定
                F = Vec.add(F, f);
            }

            if (enableGravity) {
                F = Vec.add(F, new Vec(0, G * M));
            }

            if ((vs.at(i).state & VertexState.stuck) == 0) {
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
    for (const i of vs.getKeys()) {
        if (Vec.abs(Vec.sub(vs.at(i).p, new Vec(e.offsetX, e.offsetY))) < vertexRadius) {
            clicked = i;
            vs.at(i).state |= VertexState.moving;
            break;
        }
    }
    update();
}
function onMouseUp(e: MouseEvent): void {
    if (clicked == -1) return;
    if (e.button == 2) {  // 右クリック
        vs.at(clicked).state ^= VertexState.fixed;  // 固定状態を反転
    }
    vs.at(clicked).state &= ~VertexState.moving;
    clicked = -1;
    update();
}
function onMouseMove(e: MouseEvent): void {
    if (clicked == -1) return;
    vs.at(clicked).p = { x: e.offsetX, y: e.offsetY };
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

        if (!vs.checkExist(a)) vs.add(a);
        if (!vs.checkExist(b)) vs.add(b);

        if (!(a in adjList)) adjList[a] = {};
        adjList[a][b] = new Edge(a, b, c);
        if (edgeDirection == EdgeDirection.undirected) {
            if (!(b in adjList)) adjList[b] = {};
            adjList[b][a] = new Edge(b, a, c);
        }
    }
    update();
}
inputAdjList.addEventListener("change", getTextareaAdjList, false);

demoInit();

function setCanvasSize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.textAlign = 'center';
    ctx.font = "bold 16px 'monospace'";
    update();
}
setCanvasSize();
window.addEventListener("resize", setCanvasSize, false);