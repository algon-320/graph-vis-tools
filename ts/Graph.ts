class Edge<Cost> {
    constructor(public from: string, public to: string, public cost: Cost) { }
}
interface AdjacencyList<Cost> {
    [index: string]: { [index: string]: Edge<Cost> };
}

enum EdgeDirection {
    undirected,
    directed,
}

class Graph implements IDrawable {
    readonly vs: VertexSet;
    private adjList: AdjacencyList<string | null>;
    get adjacencyList(): AdjacencyList<string | null> {
        return this.adjList;
    }
    edgeDirection: EdgeDirection;

    sumEnergy: number;
    static readonly energyLowerbound = 1;

    constructor() {
        this.vs = new VertexSet();
        this.adjList = {};
        this.edgeDirection = EdgeDirection.directed;
        this.sumEnergy = 0;
    }

    existEdge(from: string, to: string): boolean {
        return from in this.adjList && to in this.adjList[from];
    }

    addEdge(edge: Edge<string | null>): void {
        const from = edge.from;
        const to = edge.to;

        if (!this.vs.checkExist(from)) this.vs.add(from);
        if (!this.vs.checkExist(to)) this.vs.add(to);

        if (!(from in this.adjList)) this.adjList[from] = {};
        this.adjList[from][to] = edge;

        if (this.edgeDirection == EdgeDirection.undirected) {
            if (!(to in this.adjList)) this.adjList[to] = {};
            this.adjList[to][from] = edge;
        }
    }

    // 内部の隣接リストを更新(テキストエリアの入力を想定)
    updateAdjList(textareaValue: string): void {
        let lines = textareaValue.split(/\r\n|\r|\n/);
        this.adjList = {};

        let vsAlive: { [index: string]: boolean } = {};
        for (let k of this.vs.getKeys()) {
            vsAlive[k] = false;
        }

        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === "") continue;
            let e = lines[i].split(/\s*,\s*|\s+/);
            if (e[0] === "") continue;

            let a = e[0];
            vsAlive[a] = true;

            if (e.length < 2 || e[1] === "") continue;

            let b = e[1];
            vsAlive[b] = true;

            let c = (e.length >= 3 ? e[2] : null);

            this.addEdge(new Edge(a, b, c));
        }

        // 消えた頂点を反映
        for (let k of Object.keys(vsAlive)) {
            if (!vsAlive[k]) this.vs.remove(k);
        }
    }

    static edgeColor = "rgb(30, 30, 30)";
    static vertexColorClicked = "rgb(70, 70, 255)";
    static vertexColorNormal = "rgb(255, 70, 70)";
    static fontColor = "white";
    static backgroundColor = "white";
    static arrowSize = 10;
    static edgeWidth = 4;
    draw(ctx: CanvasRenderingContext2D): void {
        // 辺
        ctx.strokeStyle = Graph.edgeColor;
        ctx.fillStyle = Graph.edgeColor;
        for (const i of this.vs.getKeys()) {
            for (const j of this.vs.getKeys()) {
                if (!this.existEdge(i, j)) continue;
                let vec = Vec.sub(this.vs.at(j).p, this.vs.at(i).p);

                let cost = this.adjList[i][j].cost;
                if (cost != null) {  // コストを描画
                    let center = Vec.add(this.vs.at(i).p, Vec.scalar(vec, 0.5));
                    let out = Vec.rotate(Vec.scalar(vec, 0.5), -Math.PI / 2);
                    let p = Vec.add(center, Vec.setLength(out, 15));
                    ctx.fillText(cost.toString(), p.x, p.y + 5);
                }

                // 矢印の頂点座標を計算
                let len = Vec.abs(vec) - vertexRadius;
                vec = Vec.setLength(vec, len);
                let pi = this.vs.at(i).p;
                let arrowP = new Array<Vec>();

                vec = Vec.rotate(vec, Math.PI * 3 / 2);
                vec = Vec.setLength(vec, Graph.edgeWidth / 2);
                let p1 = Vec.add(pi, vec);
                arrowP.push(p1);

                vec = Vec.rotate(vec, Math.PI / 2);
                vec = Vec.setLength(vec, len);
                const pj = Vec.add(p1, vec);

                if (this.edgeDirection == EdgeDirection.directed) {
                    vec = Vec.setLength(vec, len - Graph.arrowSize * 1.732);
                    let p2 = Vec.add(p1, vec);
                    arrowP.push(p2);

                    vec = Vec.rotate(vec, Math.PI * 3 / 2);
                    vec = Vec.setLength(vec, Graph.arrowSize);
                    let p3 = Vec.add(p2, vec);
                    arrowP.push(p3);
                }

                arrowP.push(pj);

                vec = Vec.setLength(Vec.sub(pi, p1), Graph.edgeWidth);
                let p4 = Vec.add(pj, vec);
                arrowP.push(p4);

                vec = Vec.sub(pi, p1);
                vec = Vec.setLength(vec, Graph.edgeWidth / 2);
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
        for (const i of this.vs.getKeys()) {
            this.vs.at(i).draw(ctx);
        }
    }

    moveVertices(): void {
        // 定数 ------------------------
        const coulombK = 1500;
        const springK = 1.2;
        const deltaT = 0.2;
        const M = 1;
        const decK = 0.6;
        const G = 100;
        // -----------------------------
        this.sumEnergy = 0;
        for (const i of graph.vs.getKeys()) {
            const v1 = graph.vs.at(i);

            let F = new Vec(0, 0);

            // 頂点からのクーロン力
            for (const j of graph.vs.getKeys()) {
                if (i == j) continue;
                const v2 = graph.vs.at(j);

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
            for (const j of graph.vs.getKeys()) {
                if (i == j) continue;
                const distance = edgeLength + graph.vs.at(i).radius + graph.vs.at(j).radius;
                if (!graph.existEdge(i, j) && !graph.existEdge(j, i)) continue;
                const v2 = graph.vs.at(j);
                let vec = Vec.sub(v2.p, v1.p);

                let absf = springK * (Vec.abs(vec) - distance);
                let f = vec;
                f = Vec.scalar(f, absf / Vec.abs(f));  // 長さを設定
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
    }
}