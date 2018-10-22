var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 1800;
canvas.height = 1000;
ctx.font = "bold 16px 'Ubuntu Mono'";

var adjList = document.getElementById("adjacencylist");
var adjMat = document.getElementById("adjacencymat");
var vertexRadiusInput = document.getElementById("vertexRadiusInput");
var edgeLengthInput = document.getElementById("edgeLengthInput");

let vertexRadius = 20;
let edgeLength = 200;
vertexRadiusInput.value = vertexRadius;
edgeLengthInput.value = edgeLength;


// ベクトル演算関数
function vec_inv(v1) { return { x: -v1.x, y: -v1.y }; }
function vec_add(v1, v2) { return { x: v1.x + v2.x, y: v1.y + v2.y }; }
function vec_sub(v1, v2) { return vec_add(v1, vec_inv(v2)); }
function vec_scalar(v1, sc) { return { x: v1.x * sc, y: v1.y * sc }; }
function vec_abs(v1) { return Math.sqrt(v1.x * v1.x + v1.y * v1.y); }

var numVertex = 6;
var vs = [];
var edge = [
    [0, 1, 0, 0, 1, 0],
    [1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 0],
    [0, 0, 1, 0, 1, 1],
    [1, 1, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0],
];
var clicked = -1;

function addVertex() {
    vs.push({ v: { x: 0, y: 0 }, p: { x: Math.random() * 1000, y: Math.random() * 1000 }, fixed: false });
}


// 描画関係
let edgeColor = "rgb(30, 30, 30)";
let vertexColorClicked = "rgb(70, 70, 255)";
let vertexColorNormal = "rgb(255, 70, 70)";
let fontColor = "white";
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 辺
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 3;
    for (let i = 0; i < numVertex; i++) {
        for (let j = i + 1; j < numVertex; j++) {
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

function initiFromTextarea(changeAdjList) {
    // console.log("textarea changed");
    if (changeAdjList) {
        // 隣接リスト
        let mxID = -1;
        let lines = adjList.value.split(/\r\n|\r|\n/);
        let tmp = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === "") continue;
            let e = lines[i].split(/\s*,\s*|\s+/);
            if (e.length < 2 || e[1] === "") continue;
            let a = parseInt(e[0]), b = parseInt(e[1]);
            if (mxID < a) mxID = a;
            if (mxID < b) mxID = b;
            tmp.push([a, b]);
        }
        let newNumVertex = mxID + 1;
        edge = [];
        for (let i = 0; i < newNumVertex; i++) {
            edge.push(new Array(newNumVertex));
            for (let j = 0; j < newNumVertex; j++) {
                edge[i][j] = 0;
            }
        }

        for (let i = numVertex; i <= newNumVertex; i++) addVertex();
        numVertex = newNumVertex;
        console.log(numVertex);

        for (let i = 0; i < tmp.length; i++) {
            let a = tmp[i][0], b = tmp[i][1];
            edge[a][b] = edge[b][a] = 1;
        }
    } else {
        let invalid = false;
        lines = adjMat.value.split(/\r\n|\r|\n/);
        let cols = -1;
        let mat = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === "") continue;
            let row = lines[i].split(/\s*,\s*|\s+/);
            mat.push(row);
            if (cols == -1) cols = row.length;
            else if (cols != row.length) {
                invalid = true;
            }
        }
        if (!invalid) {
            let newNumVertex = cols;
            for (let i = numVertex; i <= newNumVertex; i++) addVertex();
            edge = mat;
            numVertex = cols;
        }
    }
    update();
}
adjList.addEventListener("change", function () { initiFromTextarea(true) }, false);
adjMat.addEventListener("change", function () { initiFromTextarea(false) }, false);

function demoInit() {
    for (let i = 0; i < numVertex; i++) {
        vs.push({ v: { x: 0, y: 0 }, p: { x: Math.random() * 1000, y: Math.random() * 1000 }, fixed: false });
    }
    vs[0].p = { x: 500, y: 500 };
    vs[0].fixed = true;
}

let sumEnergy = 0;
function update() {
    // textareaの更新
    var valueAL = "";
    for (let i = 0; i < numVertex; i++) {
        for (let j = i; j < numVertex; j++) {
            if (edge[i][j] == 1) {
                valueAL += i.toString() + " " + j.toString() + "\n";
            }
        }
    }
    adjList.value = valueAL;
    var valueAM = "";
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
    let coulombK = 1000;
    let springK = 1;
    let energyLowerbound = 0.1;
    let deltaT = 0.1;
    let M = 1;
    let decK = 0.95;
    // -----------------------------
    function f() {
        sumEnergy = 0;
        for (let i = 0; i < numVertex; i++) {
            let v1 = vs[i];

            let F = { x: 0, y: 0 };

            // クーロン力
            for (let j = 0; j < numVertex; j++) {
                if (i == j) continue;
                let v2 = vs[j];

                let vec = vec_sub(v1.p, v2.p);
                let absf = coulombK / vec_abs(vec);
                absf = absf * absf;

                let f = vec;
                f = vec_scalar(f, absf / vec_abs(f));  // 長さを設定
                F = vec_add(F, f);
            }
            // console.log("c F = ", F);

            // フックの法則
            for (let j = 0; j < numVertex; j++) {
                if (edge[i][j] == 0) continue;
                let v2 = vs[j];
                let vec = vec_sub(v2.p, v1.p);

                let absf = springK * (vec_abs(vec) - edgeLength);
                let f = vec;
                f = vec_scalar(f, absf / vec_abs(f));  // 長さを設定
                F = vec_add(F, f);
            }

            // console.log("f F = ", F);
            if (!v1.fixed) {
                v1.v = vec_scalar(vec_add(v1.v, vec_scalar(F, deltaT / M)), decK);
                v1.p = vec_add(v1.p, vec_scalar(v1.v, deltaT));
            }
            // console.log(v1.v);
            sumEnergy += M * vec_abs(v1.v) * vec_abs(v1.v);
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

function onMouseDown(e) {
    // console.log("clicked = ", clicked, e.offsetY, e.offsetX);
    for (let i = 0; i < numVertex; i++) {
        if (vec_abs(vec_sub(vs[i].p, { x: e.offsetX, y: e.offsetY })) < vertexRadius) {
            clicked = i;
            break;
        }
    }
    draw();
}
function onMouseUp(e) {
    if (clicked == -1) return;
    if (clicked != 0) vs[clicked].fixed = false;
    clicked = -1;
    draw();
}
function onMouseMove(e) {
    if (clicked == -1) return;
    vs[clicked].p = { x: e.offsetX, y: e.offsetY };
    vs[clicked].fixed = true;
    update();
}
canvas.addEventListener("mousedown", onMouseDown, false);
canvas.addEventListener("mouseup", onMouseUp, false);
canvas.addEventListener("mousemove", onMouseMove, false);

function onUIupdated() {
    vertexRadius = vertexRadiusInput.value;
    edgeLength = edgeLengthInput.value;
    update();
}
vertexRadiusInput.addEventListener("change", onUIupdated, false);
edgeLengthInput.addEventListener("change", onUIupdated, false);

demoInit();
update();
