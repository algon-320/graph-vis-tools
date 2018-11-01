const canvasWrapper = <HTMLDivElement>document.getElementById("wrapper");
const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("canvas");
const context = <CanvasRenderingContext2D>canvas.getContext("2d");

const inputAdjList = <HTMLTextAreaElement>document.getElementById("inputAdjList");
const inputVertexRadius = <HTMLInputElement>document.getElementById("inputVertexRadius");
const inputEdgeLength = <HTMLInputElement>document.getElementById("inputEdgeLength");
const radioUndirected = <HTMLInputElement>document.getElementById("radioUndirected");
const radioDirected = <HTMLInputElement>document.getElementById("radioDirected");
const checkboxGravity = <HTMLInputElement>document.getElementById("checkboxGravity");

/// <reference path="interfaces.ts" />
/// <reference path="Vec.ts" />
/// <reference path="Vertex.ts" />
/// <reference path="VertexSet.ts" />
/// <reference path="Graph.ts" />

let vertexRadius = 20;
let edgeLength = 100;
let enableGravity = false;

const graph = new Graph();
let clicked: string = "";

function render(): void {
    context.clearRect(0, 0, canvas.width, canvas.height);
    graph.draw(context);
}

function demoInit(): void {
    graph.addEdge(new Edge("0", "1", null));

    const v = new Vertex("0");
    v.p = new Vec(300, 300);
    v.state = VertexState.fixed;
    v.radius = 40;

    graph.vs.set("0", v);
}

function updateUI(): void {
    switch (graph.edgeDirection) {
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
    for (const i of graph.vs.getKeys()) {
        for (const j of graph.vs.getKeys()) {
            let print_edge = false;
            let cost = null;
            if (graph.edgeDirection == EdgeDirection.directed) {
                if (graph.existEdge(i, j)) {
                    print_edge = true;
                    cost = graph.adjacencyList[i][j].cost;
                }
            } else {
                if (j < i) continue;
                if (graph.existEdge(i, j)) {
                    print_edge = true;
                    cost = graph.adjacencyList[i][j].cost;
                }
                if (graph.existEdge(j, i)) {
                    print_edge = true;
                    cost = graph.adjacencyList[j][i].cost;
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

function update(): void {
    updateUI();  // UIパーツを更新

    function loop(timestamp: DOMHighResTimeStamp): void {
        graph.moveVertices();
        render();
        if (graph.sumEnergy > Graph.energyLowerbound) {
            window.requestAnimationFrame(loop);
        } else {
            console.log("stable");
        }
    }
    if (graph.sumEnergy <= Graph.energyLowerbound) {
        window.requestAnimationFrame(loop);
    }
}

let clickedCenterDiff: Vec;
function onMouseDown(e: MouseEvent): void {
    const mousePos = new Vec(e.offsetX, e.offsetY);
    for (const i of graph.vs.getKeys()) {
        const v = graph.vs.at(i);
        if (v.isInnerPoint(mousePos)) {
            clicked = i;
            v.state |= VertexState.moving;
            clickedCenterDiff = Vec.sub(mousePos, v.p);
            break;  // 重なっている場合は初めにヒットした方
        }
    }
    update();
}
function onMouseUp(e: MouseEvent): void {
    if (clicked == "") return;
    if (e.button == 2) {  // 右クリック
        graph.vs.at(clicked).state ^= VertexState.fixed;  // 固定状態を反転
    }
    graph.vs.at(clicked).state &= ~VertexState.moving;
    clicked = "";
    update();
}
function onMouseMove(e: MouseEvent): void {
    if (clicked == "") return;
    graph.vs.at(clicked).p = Vec.sub({ x: e.offsetX, y: e.offsetY }, clickedCenterDiff);
    update();
}
canvas.addEventListener("mousedown", onMouseDown, false);
canvas.addEventListener("mouseup", onMouseUp, false);
canvas.addEventListener("mousemove", onMouseMove, false);
// 右クリックのコンテキストメニュー表示を無効化
canvas.addEventListener("contextmenu", function (e: MouseEvent): void { e.preventDefault(); });

function getRadioButtonEdgeDirection() {
    if (radioUndirected.checked) {
        graph.edgeDirection = EdgeDirection.undirected;
    } else if (radioDirected.checked) {
        graph.edgeDirection = EdgeDirection.directed;
    }
    update();
}
radioUndirected.addEventListener("change", getRadioButtonEdgeDirection, false);
radioDirected.addEventListener("change", getRadioButtonEdgeDirection, false);

function getInputVertexRadius(): void {
    // TODO
    const r = parseInt(inputVertexRadius.value);
    for (const i of graph.vs.getKeys()) {
        const v = graph.vs.at(i);
        v.radius += -vertexRadius + r;
    }
    vertexRadius = r;
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
    graph.updateAdjList(inputAdjList.value);
    update();
}
inputAdjList.addEventListener("change", getTextareaAdjList, false);

demoInit();

function setCanvasSize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    context.textAlign = 'center';
    context.font = "bold 16px 'monospace'";
    update();
}
setCanvasSize();
window.addEventListener("resize", setCanvasSize, false);