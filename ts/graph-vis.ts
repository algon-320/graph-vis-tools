const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("canvas");
const ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
canvas.width = 1800;
canvas.height = 1000;
ctx.font = "bold 16px 'Ubuntu Mono'";

const adjList: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("adjacencylist");
const adjMat: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("adjacencymat");
const vertexRadiusInput: HTMLInputElement = <HTMLInputElement>document.getElementById("vertexRadiusInput");
const edgeLengthInput: HTMLInputElement = <HTMLInputElement>document.getElementById("edgeLengthInput");

let vertexRadius = 20;
let edgeLength = 200;
vertexRadiusInput.value = vertexRadius.toString();
edgeLengthInput.value = edgeLength.toString();

class Vec {
    constructor(public x: number, public y: number) { }
    static inv(v1: Vec): Vec {
        return { x: -v1.x, y: -v1.y };
    }
    static add(v1: Vec, v2: Vec): Vec {
        return { x: v1.x + v2.x, y: v1.y + v2.y };
    }
    static sub(v1: Vec, v2: Vec): Vec {
        return { x: v1.x - v2.x, y: v1.y - v2.y };
    }
    static scalar(v1: Vec, sc: number): Vec {
        return { x: v1.x * sc, y: v1.y * sc };
    }
    static abs(v1: Vec): number {
        return Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    }
}
type Point = Vec;

class Vertex {
    p: Point;
    v: Vec;
    fixed: boolean;
    constructor() {
        this.p = new Vec(Math.random() * 1000, Math.random() * 1000);
        this.v = new Vec(0, 0);
        this.fixed = false;
    }
}

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

// 描画関係
let edgeColor: string = "rgb(30, 30, 30)";
let vertexColorClicked: string = "rgb(70, 70, 255)";
let vertexColorNormal: string = "rgb(255, 70, 70)";
let fontColor: string = "white";
function draw(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 辺
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 3;
    for (let i = 0; i < numVertex; i++) {
        for (let j: number = i + 1; j < numVertex; j++) {
            if (edge[i][j] == 0) continue;
            ctx.beginPath();
            ctx.moveTo(vs[i].p.x, vs[i].p.y);
            ctx.lineTo(vs[j].p.x, vs[j].p.y);
            ctx.closePath();
            ctx.stroke();
        }
    }

    // 頂点
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
        if (vs[i].fixed) ctx.stroke();

        ctx.fillStyle = fontColor;
        ctx.fillText(i.toString(), vs[i].p.x - 4, vs[i].p.y + 5);
    }
}

function initiFromTextarea(isAdjList: boolean): void {
    // console.log("textarea changed");
    if (isAdjList) {
        // 隣接リスト
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
            edge[a][b] = edge[b][a] = 1;
        }
    } else {
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
    }
    update();
}
adjList.addEventListener("change", function () { initiFromTextarea(true) }, false);
adjMat.addEventListener("change", function () { initiFromTextarea(false) }, false);

function demoInit(): void {
    for (let i = 0; i < numVertex; i++) {
        vs.push(new Vertex());
    }
    vs[0].p = new Vec(500, 500);
    vs[0].fixed = true;
}

let sumEnergy = 0;
function update(): void {
    // textareaの更新
    let valueAL = "";
    for (let i = 0; i < numVertex; i++) {
        for (let j = i; j < numVertex; j++) {
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

    // 定数 ------------------------
    const coulombK = 1000;
    const springK = 1;
    const energyLowerbound = 0.1;
    const deltaT = 0.1;
    const M = 1;
    const decK = 0.95;
    // -----------------------------
    function f(): void {
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
                if (edge[i][j] == 0) continue;
                const v2 = vs[j];
                let vec = Vec.sub(v2.p, v1.p);

                let absf = springK * (Vec.abs(vec) - edgeLength);
                let f = vec;
                f = Vec.scalar(f, absf / Vec.abs(f));  // 長さを設定
                F = Vec.add(F, f);
            }

            if (!v1.fixed) {
                v1.v = Vec.scalar(Vec.add(v1.v, Vec.scalar(F, deltaT / M)), decK);
                v1.p = Vec.add(v1.p, Vec.scalar(v1.v, deltaT));
            }
            sumEnergy += M * Vec.abs(v1.v) * Vec.abs(v1.v);
        }
        draw();
        // console.log("sumEnergy: ", sumEnergy);

        if (sumEnergy > energyLowerbound) {
            setTimeout(f, 16);
            // f();
        } else {
            console.log("stable");
        }
    }
    if (sumEnergy <= energyLowerbound) f();
}

function onMouseDown(e: MouseEvent): void {
    // console.log("clicked = ", clicked, e.offsetY, e.offsetX);
    for (let i = 0; i < numVertex; i++) {
        if (Vec.abs(Vec.sub(vs[i].p, { x: e.offsetX, y: e.offsetY })) < vertexRadius) {
            clicked = i;
            break;
        }
    }
    draw();
}
function onMouseUp(e: MouseEvent): void {
    if (clicked == -1) return;
    if (clicked != 0) vs[clicked].fixed = false;
    clicked = -1;
    draw();
}
function onMouseMove(e: MouseEvent): void {
    if (clicked == -1) return;
    vs[clicked].p = { x: e.offsetX, y: e.offsetY };
    vs[clicked].fixed = true;
    update();
}
canvas.addEventListener("mousedown", onMouseDown, false);
canvas.addEventListener("mouseup", onMouseUp, false);
canvas.addEventListener("mousemove", onMouseMove, false);

function onUIupdated(): void {
    vertexRadius = parseInt(vertexRadiusInput.value);
    edgeLength = parseInt(edgeLengthInput.value);
    update();
}
vertexRadiusInput.addEventListener("change", onUIupdated, false);
edgeLengthInput.addEventListener("change", onUIupdated, false);

demoInit();
update();
