var canvasWrapper = document.getElementById("wrapper");
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var inputAdjList = document.getElementById("inputAdjList");
var inputVertexRadius = document.getElementById("inputVertexRadius");
var inputEdgeLength = document.getElementById("inputEdgeLength");
var radioUndirected = document.getElementById("radioUndirected");
var radioDirected = document.getElementById("radioDirected");
var checkboxGravity = document.getElementById("checkboxGravity");
var EdgeDirection;
(function (EdgeDirection) {
    EdgeDirection[EdgeDirection["undirected"] = 0] = "undirected";
    EdgeDirection[EdgeDirection["directed"] = 1] = "directed";
})(EdgeDirection || (EdgeDirection = {}));
var Vec = /** @class */ (function () {
    function Vec(x, y) {
        this.x = x;
        this.y = y;
    }
    Vec.inv = function (v1) {
        return new Vec(-v1.x, -v1.y);
    };
    Vec.add = function (v1, v2) {
        return new Vec(v1.x + v2.x, v1.y + v2.y);
    };
    Vec.sub = function (v1, v2) {
        return new Vec(v1.x - v2.x, v1.y - v2.y);
    };
    Vec.scalar = function (v1, sc) {
        return new Vec(v1.x * sc, v1.y * sc);
    };
    Vec.abs = function (v1) {
        return Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    };
    Vec.setLength = function (v1, len) {
        return this.scalar(v1, len / this.abs(v1));
    };
    Vec.rotate = function (v1, theta) {
        return new Vec(Math.cos(theta) * v1.x - Math.sin(theta) * v1.y, Math.sin(theta) * v1.x + Math.cos(theta) * v1.y);
    };
    return Vec;
}());
var VertexState;
(function (VertexState) {
    VertexState[VertexState["moving"] = 2] = "moving";
    VertexState[VertexState["floating"] = 4] = "floating";
    VertexState[VertexState["fixed"] = 8] = "fixed";
    VertexState[VertexState["stuck"] = 10] = "stuck";
})(VertexState || (VertexState = {}));
var Vertex = /** @class */ (function () {
    function Vertex(id) {
        this.id = id;
        this.p = new Vec(Math.random() * 1000, Math.random() * 1000);
        this.v = new Vec(0, 0);
        this.state = VertexState.floating;
    }
    return Vertex;
}());
var VertexSet = /** @class */ (function () {
    function VertexSet() {
        this.vs = {};
        this.keys = [];
    }
    VertexSet.prototype.add = function (id) {
        this.vs[id] = new Vertex(id);
        this.updatekeys();
    };
    VertexSet.prototype.remove = function (id) {
        delete this.vs[id];
        this.updatekeys();
    };
    VertexSet.prototype.checkExist = function (id) {
        return id in this.vs;
    };
    VertexSet.prototype.getNumVertex = function () {
        return Object.keys(vs).length;
    };
    VertexSet.prototype.getKeys = function () {
        return this.keys;
    };
    VertexSet.prototype.at = function (id) {
        return this.vs[id];
    };
    VertexSet.prototype.updatekeys = function () {
        this.keys = Object.keys(this.vs);
    };
    return VertexSet;
}());
var Edge = /** @class */ (function () {
    function Edge(from, to, cost) {
        this.from = from;
        this.to = to;
        this.cost = cost;
    }
    return Edge;
}());
var edgeDirection = EdgeDirection.directed;
var vertexRadius = 20;
var edgeLength = 100;
var enableGravity = false;
var vs = new VertexSet();
var adjList = {};
var clicked = "";
function existEdge(from, to) {
    return from in adjList && to in adjList[from];
}
function drawArrow(from, to, lineWidth, arrowHeadSize) {
}
var edgeColor = "rgb(30, 30, 30)";
var vertexColorClicked = "rgb(70, 70, 255)";
var vertexColorNormal = "rgb(255, 70, 70)";
var fontColor = "white";
var backgroundColor = "white";
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var arrowSize = 10;
    var edgeWidth = 4;
    // 辺
    ctx.strokeStyle = edgeColor;
    ctx.fillStyle = edgeColor;
    for (var _i = 0, _a = vs.getKeys(); _i < _a.length; _i++) {
        var i = _a[_i];
        for (var _b = 0, _c = vs.getKeys(); _b < _c.length; _b++) {
            var j = _c[_b];
            if (!existEdge(i, j))
                continue;
            var vec = Vec.sub(vs.at(j).p, vs.at(i).p);
            var cost = adjList[i][j].cost;
            if (cost != null) { // コストを描画
                var center = Vec.add(vs.at(i).p, Vec.scalar(vec, 0.5));
                var out = Vec.rotate(Vec.scalar(vec, 0.5), -Math.PI / 2);
                var p = Vec.add(center, Vec.setLength(out, 15));
                ctx.fillText(cost.toString(), p.x, p.y + 5);
            }
            var len = Vec.abs(vec) - vertexRadius;
            vec = Vec.setLength(vec, len);
            var pi = vs.at(i).p;
            var arrowP = new Array();
            vec = Vec.rotate(vec, Math.PI * 3 / 2);
            vec = Vec.setLength(vec, edgeWidth / 2);
            var p1 = Vec.add(pi, vec);
            arrowP.push(p1);
            vec = Vec.rotate(vec, Math.PI / 2);
            vec = Vec.setLength(vec, len);
            var pj = Vec.add(p1, vec);
            if (edgeDirection == EdgeDirection.directed) {
                vec = Vec.setLength(vec, len - arrowSize * 1.732);
                var p2 = Vec.add(p1, vec);
                arrowP.push(p2);
                vec = Vec.rotate(vec, Math.PI * 3 / 2);
                vec = Vec.setLength(vec, arrowSize);
                var p3 = Vec.add(p2, vec);
                arrowP.push(p3);
            }
            arrowP.push(pj);
            vec = Vec.setLength(Vec.sub(pi, p1), edgeWidth);
            var p4 = Vec.add(pj, vec);
            arrowP.push(p4);
            vec = Vec.sub(pi, p1);
            vec = Vec.setLength(vec, edgeWidth / 2);
            var p5 = Vec.add(pi, vec);
            arrowP.push(p5);
            // ---- draw polygon ----
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            for (var k = 0; k < arrowP.length; k++) {
                ctx.lineTo(arrowP[k].x, arrowP[k].y);
            }
            ctx.closePath();
            ctx.fill();
            // ----------------------
        }
    }
    // 頂点
    ctx.lineWidth = 3;
    for (var _d = 0, _e = vs.getKeys(); _d < _e.length; _d++) {
        var i = _e[_d];
        if (i == clicked) {
            ctx.fillStyle = vertexColorClicked;
        }
        else {
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
function demoInit() {
    adjList["0"] = { 1: new Edge("0", "1", null) };
    vs.add("0");
    vs.add("1");
    vs.at("0").p = new Vec(300, 300);
    vs.at("0").state = VertexState.fixed;
}
function updateUI() {
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
    var valueAL = "";
    for (var _i = 0, _a = vs.getKeys(); _i < _a.length; _i++) {
        var i = _a[_i];
        for (var _b = 0, _c = vs.getKeys(); _b < _c.length; _b++) {
            var j = _c[_b];
            var print_edge = false;
            var cost = null;
            if (edgeDirection == EdgeDirection.directed) {
                if (existEdge(i, j)) {
                    print_edge = true;
                    cost = adjList[i][j].cost;
                }
            }
            else {
                if (j < i)
                    continue;
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
var sumEnergy = 0;
function update() {
    updateUI(); // UIパーツを更新
    // 定数 ------------------------
    var coulombK = 1500;
    var springK = 1.2;
    var energyLowerbound = 1;
    var deltaT = 0.2;
    var M = 1;
    var decK = 0.6;
    var G = 100;
    // -----------------------------
    function moveVertices(timestamp) {
        sumEnergy = 0;
        for (var _i = 0, _a = vs.getKeys(); _i < _a.length; _i++) {
            var i = _a[_i];
            var v1 = vs.at(i);
            var F = new Vec(0, 0);
            // 頂点からのクーロン力
            for (var _b = 0, _c = vs.getKeys(); _b < _c.length; _b++) {
                var j = _c[_b];
                if (i == j)
                    continue;
                var v2 = vs.at(j);
                var vec = Vec.sub(v1.p, v2.p);
                var absf = coulombK / Vec.abs(vec);
                absf = absf * absf;
                var f = vec;
                f = Vec.scalar(f, absf / Vec.abs(f)); // 長さを設定
                // if (Vec.abs(f) < 5) continue;
                F = Vec.add(F, f);
            }
            // 枠からのクーロン力
            {
                var K = coulombK;
                var sum = new Vec(0, 0);
                var f = new Vec(0, K / Math.max(v1.p.y - 0, 1));
                if (Vec.abs(f) > 10)
                    sum = Vec.add(sum, f);
                f = new Vec(0, -(K / Math.max(canvas.height - v1.p.y, 1)));
                if (Vec.abs(f) > 10)
                    sum = Vec.add(sum, f);
                f = new Vec(K / Math.max(v1.p.x - 0, 1), 0);
                if (Vec.abs(f) > 10)
                    sum = Vec.add(sum, f);
                f = new Vec(-(K / Math.max(canvas.width - v1.p.x, 1)), 0);
                if (Vec.abs(f) > 10)
                    sum = Vec.add(sum, f);
                F = Vec.add(F, sum);
            }
            // フックの法則
            for (var _d = 0, _e = vs.getKeys(); _d < _e.length; _d++) {
                var j = _e[_d];
                if (i == j)
                    continue;
                if (!existEdge(i, j) && !existEdge(j, i))
                    continue;
                var v2 = vs.at(j);
                var vec = Vec.sub(v2.p, v1.p);
                var absf = springK * (Vec.abs(vec) - edgeLength);
                var f = vec;
                f = Vec.scalar(f, absf / Vec.abs(f)); // 長さを設定
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
        sumEnergy /= vs.getNumVertex();
        if (sumEnergy > energyLowerbound) {
            window.requestAnimationFrame(moveVertices);
        }
        else {
            console.log("stable");
        }
    }
    if (sumEnergy <= energyLowerbound) {
        window.requestAnimationFrame(moveVertices);
    }
}
function onMouseDown(e) {
    for (var _i = 0, _a = vs.getKeys(); _i < _a.length; _i++) {
        var i = _a[_i];
        if (Vec.abs(Vec.sub(vs.at(i).p, new Vec(e.offsetX, e.offsetY))) < vertexRadius) {
            clicked = i;
            vs.at(i).state |= VertexState.moving;
            break;
        }
    }
    update();
}
function onMouseUp(e) {
    if (clicked == "")
        return;
    if (e.button == 2) { // 右クリック
        vs.at(clicked).state ^= VertexState.fixed; // 固定状態を反転
    }
    vs.at(clicked).state &= ~VertexState.moving;
    clicked = "";
    update();
}
function onMouseMove(e) {
    if (clicked == "")
        return;
    vs.at(clicked).p = { x: e.offsetX, y: e.offsetY };
    update();
}
canvas.addEventListener("mousedown", onMouseDown, false);
canvas.addEventListener("mouseup", onMouseUp, false);
canvas.addEventListener("mousemove", onMouseMove, false);
// 右クリックのコンテキストメニュー表示を無効化
canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
function getRadioButtonEdgeDirection() {
    if (radioUndirected.checked) {
        edgeDirection = EdgeDirection.undirected;
    }
    else if (radioDirected.checked) {
        edgeDirection = EdgeDirection.directed;
    }
    update();
}
radioUndirected.addEventListener("change", getRadioButtonEdgeDirection, false);
radioDirected.addEventListener("change", getRadioButtonEdgeDirection, false);
function getInputVertexRadius() {
    vertexRadius = parseInt(inputVertexRadius.value);
    update();
}
function getInputEdgeLength() {
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
function getTextareaAdjList() {
    var lines = inputAdjList.value.split(/\r\n|\r|\n/);
    adjList = {};
    var vsAlive = {};
    for (var _i = 0, _a = vs.getKeys(); _i < _a.length; _i++) {
        var k = _a[_i];
        vsAlive[k] = false;
    }
    for (var i = 0; i < lines.length; i++) {
        if (lines[i] === "")
            continue;
        var e = lines[i].split(/\s*,\s*|\s+/);
        if (e[0] === "")
            continue;
        var a = e[0];
        vsAlive[a] = true;
        if (!vs.checkExist(a))
            vs.add(a);
        if (e.length < 2 || e[1] === "")
            continue;
        var b = e[1];
        vsAlive[b] = true;
        if (!vs.checkExist(b))
            vs.add(b);
        var c = (e.length >= 3 ? e[2] : null);
        if (!(a in adjList))
            adjList[a] = {};
        adjList[a][b] = new Edge(a, b, c);
        if (edgeDirection == EdgeDirection.undirected) {
            if (!(b in adjList))
                adjList[b] = {};
            adjList[b][a] = new Edge(b, a, c);
        }
    }
    // 消えた頂点を反映
    for (var _b = 0, _c = Object.keys(vsAlive); _b < _c.length; _b++) {
        var k = _c[_b];
        if (!vsAlive[k])
            vs.remove(k);
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
