"use strict";
var Edge = (function () {
    function Edge(from, to, cost) {
        this.from = from;
        this.to = to;
        this.cost = cost;
    }
    return Edge;
}());
var EdgeDirection;
(function (EdgeDirection) {
    EdgeDirection[EdgeDirection["undirected"] = 0] = "undirected";
    EdgeDirection[EdgeDirection["directed"] = 1] = "directed";
})(EdgeDirection || (EdgeDirection = {}));
var Graph = (function () {
    function Graph() {
        this.vs = new VertexSet();
        this.adjList = {};
        this.edgeDirection = EdgeDirection.directed;
        this.sumEnergy = 0;
    }
    Object.defineProperty(Graph.prototype, "adjacencyList", {
        get: function () {
            return this.adjList;
        },
        enumerable: true,
        configurable: true
    });
    Graph.prototype.existEdge = function (from, to) {
        return from in this.adjList && to in this.adjList[from];
    };
    Graph.prototype.addEdge = function (edge) {
        var from = edge.from;
        var to = edge.to;
        if (!this.vs.checkExist(from))
            this.vs.add(from);
        if (!this.vs.checkExist(to))
            this.vs.add(to);
        if (!(from in this.adjList))
            this.adjList[from] = {};
        this.adjList[from][to] = edge;
        if (this.edgeDirection == EdgeDirection.undirected) {
            if (!(to in this.adjList))
                this.adjList[to] = {};
            this.adjList[to][from] = edge;
        }
    };
    Graph.prototype.updateAdjList = function (textareaValue) {
        var lines = textareaValue.split(/\r\n|\r|\n/);
        this.adjList = {};
        var vsAlive = {};
        for (var _i = 0, _a = this.vs.getKeys(); _i < _a.length; _i++) {
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
            if (e.length < 2 || e[1] === "")
                continue;
            var b = e[1];
            vsAlive[b] = true;
            var c = (e.length >= 3 ? e[2] : null);
            this.addEdge(new Edge(a, b, c));
        }
        for (var _b = 0, _c = Object.keys(vsAlive); _b < _c.length; _b++) {
            var k = _c[_b];
            if (!vsAlive[k])
                this.vs.remove(k);
        }
    };
    Graph.prototype.draw = function (ctx) {
        ctx.strokeStyle = Graph.edgeColor;
        ctx.fillStyle = Graph.edgeColor;
        for (var _i = 0, _a = this.vs.getKeys(); _i < _a.length; _i++) {
            var i = _a[_i];
            for (var _b = 0, _c = this.vs.getKeys(); _b < _c.length; _b++) {
                var j = _c[_b];
                if (!this.existEdge(i, j))
                    continue;
                var vec = Vec.sub(this.vs.at(j).p, this.vs.at(i).p);
                var cost = this.adjList[i][j].cost;
                if (cost != null) {
                    var center = Vec.add(this.vs.at(i).p, Vec.scalar(vec, 0.5));
                    var out = Vec.rotate(Vec.scalar(vec, 0.5), -Math.PI / 2);
                    var p = Vec.add(center, Vec.setLength(out, 15));
                    ctx.fillText(cost.toString(), p.x, p.y + 5);
                }
                var len = Vec.abs(vec) - vertexRadius;
                vec = Vec.setLength(vec, len);
                var pi = this.vs.at(i).p;
                var arrowP = new Array();
                vec = Vec.rotate(vec, Math.PI * 3 / 2);
                vec = Vec.setLength(vec, Graph.edgeWidth / 2);
                var p1 = Vec.add(pi, vec);
                arrowP.push(p1);
                vec = Vec.rotate(vec, Math.PI / 2);
                vec = Vec.setLength(vec, len);
                var pj = Vec.add(p1, vec);
                if (this.edgeDirection == EdgeDirection.directed) {
                    vec = Vec.setLength(vec, len - Graph.arrowSize * 1.732);
                    var p2 = Vec.add(p1, vec);
                    arrowP.push(p2);
                    vec = Vec.rotate(vec, Math.PI * 3 / 2);
                    vec = Vec.setLength(vec, Graph.arrowSize);
                    var p3 = Vec.add(p2, vec);
                    arrowP.push(p3);
                }
                arrowP.push(pj);
                vec = Vec.setLength(Vec.sub(pi, p1), Graph.edgeWidth);
                var p4 = Vec.add(pj, vec);
                arrowP.push(p4);
                vec = Vec.sub(pi, p1);
                vec = Vec.setLength(vec, Graph.edgeWidth / 2);
                var p5 = Vec.add(pi, vec);
                arrowP.push(p5);
                ctx.beginPath();
                ctx.moveTo(pi.x, pi.y);
                for (var k = 0; k < arrowP.length; k++) {
                    ctx.lineTo(arrowP[k].x, arrowP[k].y);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
        for (var _d = 0, _e = this.vs.getKeys(); _d < _e.length; _d++) {
            var i = _e[_d];
            this.vs.at(i).draw(ctx);
        }
    };
    Graph.prototype.moveVertices = function () {
        var coulombK = 1500;
        var springK = 1.2;
        var deltaT = 0.2;
        var M = 1;
        var decK = 0.6;
        var G = 100;
        this.sumEnergy = 0;
        for (var _i = 0, _a = graph.vs.getKeys(); _i < _a.length; _i++) {
            var i = _a[_i];
            var v1 = graph.vs.at(i);
            var F = new Vec(0, 0);
            for (var _b = 0, _c = graph.vs.getKeys(); _b < _c.length; _b++) {
                var j = _c[_b];
                if (i == j)
                    continue;
                var v2 = graph.vs.at(j);
                var vec = Vec.sub(v1.p, v2.p);
                var absf = coulombK / Vec.abs(vec);
                absf = absf * absf;
                var f = vec;
                f = Vec.scalar(f, absf / Vec.abs(f));
                F = Vec.add(F, f);
            }
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
            for (var _d = 0, _e = graph.vs.getKeys(); _d < _e.length; _d++) {
                var j = _e[_d];
                if (i == j)
                    continue;
                var distance = edgeLength + graph.vs.at(i).radius + graph.vs.at(j).radius;
                if (!graph.existEdge(i, j) && !graph.existEdge(j, i))
                    continue;
                var v2 = graph.vs.at(j);
                var vec = Vec.sub(v2.p, v1.p);
                var absf = springK * (Vec.abs(vec) - edgeLength);
                var f = vec;
                f = Vec.scalar(f, absf / Vec.abs(f));
                F = Vec.add(F, f);
            }
            if (enableGravity) {
                F = Vec.add(F, new Vec(0, G * M));
            }
            if ((graph.vs.at(i).state & VertexState.stuck) == 0) {
                v1.v = Vec.scalar(Vec.add(v1.v, Vec.scalar(F, deltaT / M)), decK);
                v1.p = Vec.add(v1.p, Vec.scalar(v1.v, deltaT));
            }
            this.sumEnergy += M * Vec.abs(v1.v) * Vec.abs(v1.v);
        }
        this.sumEnergy /= graph.vs.getNumVertex();
    };
    Graph.energyLowerbound = 1;
    Graph.edgeColor = "rgb(30, 30, 30)";
    Graph.vertexColorClicked = "rgb(70, 70, 255)";
    Graph.vertexColorNormal = "rgb(255, 70, 70)";
    Graph.fontColor = "white";
    Graph.backgroundColor = "white";
    Graph.arrowSize = 10;
    Graph.edgeWidth = 4;
    return Graph;
}());
var Vec = (function () {
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
var Vertex = (function () {
    function Vertex(id, radius) {
        if (radius === void 0) { radius = vertexRadius; }
        this.id = id;
        this.p = new Vec(Math.random() * 1000, Math.random() * 1000);
        this.v = new Vec(0, 0);
        this.state = VertexState.floating;
        this.radius = radius;
    }
    Vertex.prototype.draw = function (ctx) {
        ctx.lineWidth = 3;
        if (this.state == VertexState.moving) {
            ctx.fillStyle = Graph.vertexColorClicked;
        }
        else {
            ctx.fillStyle = Graph.vertexColorNormal;
        }
        var r = this.radius;
        ctx.beginPath();
        ctx.arc(this.p.x, this.p.y, r, 0, 2 * 3.14, false);
        ctx.closePath();
        ctx.fill();
        if ((this.state & VertexState.stuck) > 0) {
            ctx.stroke();
        }
        ctx.fillStyle = Graph.fontColor;
        ctx.fillText(this.id.toString(), this.p.x, this.p.y + 5);
    };
    Vertex.prototype.isInnerPoint = function (point) {
        return (Vec.abs(Vec.sub(this.p, point)) < this.radius);
    };
    return Vertex;
}());
var VertexSet = (function () {
    function VertexSet() {
        this.vs = {};
        this.keys = [];
    }
    VertexSet.prototype.add = function (id) {
        this.vs[id] = new Vertex(id);
        this.updatekeys();
    };
    VertexSet.prototype.set = function (id, v) {
        if (this.checkExist(id))
            this.vs[id] = v;
        else
            this.vs[id] = v;
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
        return Object.keys(this.vs).length;
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
var canvasWrapper = document.getElementById("wrapper");
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var inputAdjList = document.getElementById("inputAdjList");
var inputVertexRadius = document.getElementById("inputVertexRadius");
var inputEdgeLength = document.getElementById("inputEdgeLength");
var radioUndirected = document.getElementById("radioUndirected");
var radioDirected = document.getElementById("radioDirected");
var checkboxGravity = document.getElementById("checkboxGravity");
var vertexRadius = 20;
var edgeLength = 100;
var enableGravity = false;
var graph = new Graph();
var clicked = "";
function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    graph.draw(context);
}
function demoInit() {
    graph.addEdge(new Edge("1", "2", null));
    graph.addEdge(new Edge("1", "5", null));
    graph.addEdge(new Edge("2", "3", null));
    graph.addEdge(new Edge("2", "5", null));
    graph.addEdge(new Edge("3", "4", null));
    graph.addEdge(new Edge("4", "5", null));
    graph.addEdge(new Edge("4", "6", null));
    var v = new Vertex("1");
    v.p = new Vec(300, 300);
    v.state = VertexState.fixed;
    v.radius = vertexRadius;
    graph.vs.set("1", v);
}
function updateUI() {
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
    var valueAL = "";
    for (var _i = 0, _a = graph.vs.getKeys(); _i < _a.length; _i++) {
        var i = _a[_i];
        for (var _b = 0, _c = graph.vs.getKeys(); _b < _c.length; _b++) {
            var j = _c[_b];
            var print_edge = false;
            var cost = null;
            if (graph.edgeDirection == EdgeDirection.directed) {
                if (graph.existEdge(i, j)) {
                    print_edge = true;
                    cost = graph.adjacencyList[i][j].cost;
                }
            }
            else {
                if (j < i)
                    continue;
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
function update() {
    updateUI();
    function loop(timestamp) {
        graph.moveVertices();
        render();
        if (graph.sumEnergy > Graph.energyLowerbound) {
            window.requestAnimationFrame(loop);
        }
        else {
            console.log("stable");
        }
    }
    if (graph.sumEnergy <= Graph.energyLowerbound) {
        window.requestAnimationFrame(loop);
    }
}
var clickedCenterDiff;
function onMouseDown(e) {
    var mousePos = new Vec(e.offsetX, e.offsetY);
    for (var _i = 0, _a = graph.vs.getKeys(); _i < _a.length; _i++) {
        var i = _a[_i];
        var v = graph.vs.at(i);
        if (v.isInnerPoint(mousePos)) {
            clicked = i;
            v.state |= VertexState.moving;
            clickedCenterDiff = Vec.sub(mousePos, v.p);
            break;
        }
    }
    update();
}
function onMouseUp(e) {
    if (clicked == "")
        return;
    if (e.button == 2) {
        graph.vs.at(clicked).state ^= VertexState.fixed;
    }
    graph.vs.at(clicked).state &= ~VertexState.moving;
    clicked = "";
    update();
}
function onMouseMove(e) {
    if (clicked == "")
        return;
    graph.vs.at(clicked).p = Vec.sub({ x: e.offsetX, y: e.offsetY }, clickedCenterDiff);
    update();
}
canvas.addEventListener("mousedown", onMouseDown, false);
canvas.addEventListener("mouseup", onMouseUp, false);
canvas.addEventListener("mousemove", onMouseMove, false);
canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
function getRadioButtonEdgeDirection() {
    if (radioUndirected.checked) {
        graph.edgeDirection = EdgeDirection.undirected;
    }
    else if (radioDirected.checked) {
        graph.edgeDirection = EdgeDirection.directed;
    }
    update();
}
radioUndirected.addEventListener("change", getRadioButtonEdgeDirection, false);
radioDirected.addEventListener("change", getRadioButtonEdgeDirection, false);
function getInputVertexRadius() {
    var r = parseInt(inputVertexRadius.value);
    for (var _i = 0, _a = graph.vs.getKeys(); _i < _a.length; _i++) {
        var i = _a[_i];
        var v = graph.vs.at(i);
        v.radius += -vertexRadius + r;
    }
    vertexRadius = r;
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
//# sourceMappingURL=graph-vis.js.map