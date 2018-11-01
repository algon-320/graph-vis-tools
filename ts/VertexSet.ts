class VertexSet {
    private vs: { [index: string]: Vertex };
    private keys: Array<string>;

    constructor() {
        this.vs = {};
        this.keys = [];
    }

    public add(id: string): void {
        this.vs[id] = new Vertex(id);
        this.updatekeys();
    }
    public set(id: string, v: Vertex) {
        if (this.checkExist(id)) this.vs[id] = v;
        else this.vs[id] = v;
        this.updatekeys();
    }
    public remove(id: string): void {
        delete this.vs[id];
        this.updatekeys();
    }
    public checkExist(id: string): boolean {
        return id in this.vs;
    }
    public getNumVertex(): number {
        return Object.keys(this.vs).length;
    }
    public getKeys(): Array<string> {
        return this.keys;
    }
    public at(id: string): Vertex {
        return this.vs[id];
    }

    private updatekeys(): void {
        this.keys = Object.keys(this.vs);
    }
}