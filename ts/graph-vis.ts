const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("canvas");
const ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
canvas.width = 1800;
canvas.height = 1000;
ctx.font = "bold 16px 'monospace'";

const adjList = <HTMLTextAreaElement>document.getElementById("adjacencylist");
const adjMat = <HTMLTextAreaElement>document.getElementById("adjacencymat");
const vertexRadiusInput = <HTMLInputElement>document.getElementById("vertexRadiusInput");
const edgeLengthInput = <HTMLInputElement>document.getElementById("edgeLengthInput");
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
let edgeDirection = EdgeDirection.undirected;
let vertexRadius = 20;
let edgeLength = 100;
let enableGravity = false;

let numVertex = 6;
let vs: Array<Vertex> = [];
let edge: Array<Array<number>> = [
    [0, 1, 0, 0, 1, 0],
    [1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 0],
    [0, 0, 1, 0, 1, 1],
    [1, 1, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0],
];
let clicked: number = -1;

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
            if (edge[i][j] == 0) continue;
            let vec = Vec.sub(vs[j].p, vs[i].p);
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
        ctx.fillText(i.toString(), vs[i].p.x - 4, vs[i].p.y + 5);
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

    vertexRadiusInput.value = vertexRadius.toString();
    edgeLengthInput.value = edgeLength.toString();

    checkboxGravity.checked = enableGravity;

    // textareaの更新
    let valueAL = "";
    for (let i = 0; i < numVertex; i++) {
        let fromJ = edgeDirection == EdgeDirection.directed ? 0 : i;
        for (let j = fromJ; j < numVertex; j++) {
            if (edge[i][j] == 1) {
                valueAL += i.toString() + " " + j.toString() + "\n";
            }
        }
    }
    adjList.value = valueAL;

    let valueAM = "";
    for (let i = 0; i < numVertex; i++) {
        let row = "";
        for (let j = 0; j < numVertex; j++) {
            row += edge[i][j].toString();
            if (j != numVertex - 1) row += " ";
            else row += "\n";
        }
        valueAM += row;
    }
    adjMat.value = valueAM;
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
                if (edge[i][j] == 0 && edge[j][i] == 0) continue;
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
        // 対称にする
        for (let i = 0; i < numVertex; i++) {
            for (let j = 0; j < numVertex; j++) {
                if (edge[i][j] == 1) {
                    edge[j][i] = edge[i][j];
                }
            }
        }
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
    vertexRadius = parseInt(vertexRadiusInput.value);
    update();
}
function getInputEdgeLength(): void {
    edgeLength = parseInt(edgeLengthInput.value);
    update();
}
vertexRadiusInput.addEventListener("change", getInputVertexRadius, false);
edgeLengthInput.addEventListener("change", getInputEdgeLength, false);

function getCheckboxGravity() {
    enableGravity = checkboxGravity.checked;
    update();
}
checkboxGravity.addEventListener("input", getCheckboxGravity, false);

function getTextareaAdjList(): void {
    let mxID = -1;
    let lines = adjList.value.split(/\r\n|\r|\n/);
    let tmp: Array<[number, number]> = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === "") continue;
        let e = lines[i].split(/\s*,\s*|\s+/);
        if (e.length < 2 || e[1] === "") continue;
        let a = parseInt(e[0]), b = parseInt(e[1]);
        mxID = Math.max(mxID, a, b);
        tmp.push([a, b]);
    }
    let newNumVertex: number = mxID + 1;
    edge = [];
    for (let i = 0; i < newNumVertex; i++) {
        edge.push(new Array<number>(newNumVertex));
        for (let j = 0; j < newNumVertex; j++) {
            edge[i][j] = 0;
        }
    }

    for (let i = numVertex; i <= newNumVertex; i++) vs.push(new Vertex());
    numVertex = newNumVertex;

    for (let i = 0; i < tmp.length; i++) {
        let a = tmp[i][0], b = tmp[i][1];
        if (edgeDirection == EdgeDirection.undirected) {
            edge[a][b] = edge[b][a] = 1;
        } else {
            edge[a][b] = 1;
        }
    }
    update();
}
function getTextareaAdjMat(): void {
    let invalid = false;
    let lines = adjMat.value.split(/\r\n|\r|\n/);
    let cols = -1;
    let mat: Array<Array<number>> = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === "") continue;
        let row = lines[i].split(/\s*,\s*|\s+/).map(x => parseInt(x));
        mat.push(row);
        if (cols == -1) cols = row.length;
        else if (cols != row.length) {
            invalid = true;
        }
    }
    if (!invalid) {
        let newNumVertex = cols;
        for (let i = numVertex; i <= newNumVertex; i++) vs.push(new Vertex());
        edge = mat;
        numVertex = cols;
    }

    // 対称になっていない場合、有向グラフに変更
    for (let i = 0; i < numVertex; i++) {
        for (let j = 0; j < numVertex; j++) {
            if (edge[i][j] != edge[j][i]) {
                edgeDirection = EdgeDirection.directed;
            }
        }
    }
    update();
}
adjList.addEventListener("change", getTextareaAdjList, false);
adjMat.addEventListener("change", getTextareaAdjMat, false);

demoInit();
update();