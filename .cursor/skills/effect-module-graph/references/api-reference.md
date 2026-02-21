# API Reference: effect/Graph

- Import path: `effect/Graph`
- Source file: `packages/effect/src/Graph.ts`
- Function exports (callable): 51
- Non-function exports: 29

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `addEdge`
- `addNode`
- `astar`
- `beginMutation`
- `bellmanFord`
- `bfs`
- `connectedComponents`
- `dfs`
- `dfsPostOrder`
- `dijkstra`
- `directed`
- `edgeCount`
- `edges`
- `endMutation`
- `entries`
- `externals`
- `filterEdges`
- `filterMapEdges`

## All Function Signatures

```ts
export declare const addEdge: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>, source: NodeIndex, target: NodeIndex, data: E): EdgeIndex;
export declare const addNode: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>, data: N): NodeIndex;
export declare const astar: <E, N>(config: AstarConfig<E, N>): <T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => PathResult<E> | undefined; // overload 1
export declare const astar: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, config: AstarConfig<E, N>): PathResult<E> | undefined; // overload 2
export declare const beginMutation: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T>): MutableGraph<N, E, T>;
export declare const bellmanFord: <E>(config: BellmanFordConfig<E>): <N, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => PathResult<E> | undefined; // overload 1
export declare const bellmanFord: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, config: BellmanFordConfig<E>): PathResult<E> | undefined; // overload 2
export declare const bfs: (config?: SearchConfig): <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => NodeWalker<N>; // overload 1
export declare const bfs: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, config?: SearchConfig): NodeWalker<N>; // overload 2
export declare const connectedComponents: <N, E>(graph: Graph<N, E, "undirected"> | MutableGraph<N, E, "undirected">): Array<Array<NodeIndex>>;
export declare const dfs: (config?: SearchConfig): <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => NodeWalker<N>; // overload 1
export declare const dfs: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, config?: SearchConfig): NodeWalker<N>; // overload 2
export declare const dfsPostOrder: (config?: SearchConfig): <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => NodeWalker<N>; // overload 1
export declare const dfsPostOrder: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, config?: SearchConfig): NodeWalker<N>; // overload 2
export declare const dijkstra: <E>(config: DijkstraConfig<E>): <N, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => PathResult<E> | undefined; // overload 1
export declare const dijkstra: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, config: DijkstraConfig<E>): PathResult<E> | undefined; // overload 2
export declare const directed: <N, E>(mutate?: (mutable: MutableDirectedGraph<N, E>) => void): DirectedGraph<N, E>;
export declare const edgeCount: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>): number;
export declare const edges: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>): EdgeWalker<E>;
export declare const endMutation: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>): Graph<N, E, T>;
export declare const entries: <T, N>(walker: Walker<T, N>): Iterable<[T, N]>;
export declare const externals: (config?: ExternalsConfig): <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => NodeWalker<N>; // overload 1
export declare const externals: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, config?: ExternalsConfig): NodeWalker<N>; // overload 2
export declare const filterEdges: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>, predicate: (data: E) => boolean): void;
export declare const filterMapEdges: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>, f: (data: E) => Option.Option<E>): void;
export declare const filterMapNodes: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>, f: (data: N) => Option.Option<N>): void;
export declare const filterNodes: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>, predicate: (data: N) => boolean): void;
export declare const findEdge: <E>(predicate: (data: E, source: NodeIndex, target: NodeIndex) => boolean): <N, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => EdgeIndex | undefined; // overload 1
export declare const findEdge: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, predicate: (data: E, source: NodeIndex, target: NodeIndex) => boolean): EdgeIndex | undefined; // overload 2
export declare const findEdges: <E>(predicate: (data: E, source: NodeIndex, target: NodeIndex) => boolean): <N, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => Array<EdgeIndex>; // overload 1
export declare const findEdges: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, predicate: (data: E, source: NodeIndex, target: NodeIndex) => boolean): Array<EdgeIndex>; // overload 2
export declare const findNode: <N>(predicate: (data: N) => boolean): <E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => NodeIndex | undefined; // overload 1
export declare const findNode: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, predicate: (data: N) => boolean): NodeIndex | undefined; // overload 2
export declare const findNodes: <N>(predicate: (data: N) => boolean): <E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => Array<NodeIndex>; // overload 1
export declare const findNodes: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, predicate: (data: N) => boolean): Array<NodeIndex>; // overload 2
export declare const floydWarshall: <E>(cost: (edgeData: E) => number): <N, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => AllPairsResult<E>; // overload 1
export declare const floydWarshall: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, cost: (edgeData: E) => number): AllPairsResult<E>; // overload 2
export declare const getEdge: <E>(edgeIndex: EdgeIndex): <N, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => Edge<E> | undefined; // overload 1
export declare const getEdge: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, edgeIndex: EdgeIndex): Edge<E> | undefined; // overload 2
export declare const getNode: <N, E, T extends Kind = "directed">(nodeIndex: NodeIndex): (graph: Graph<N, E, T> | MutableGraph<N, E, T>) => Option.Option<N>; // overload 1
export declare const getNode: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, nodeIndex: NodeIndex): Option.Option<N>; // overload 2
export declare const hasEdge: (source: NodeIndex, target: NodeIndex): <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => boolean; // overload 1
export declare const hasEdge: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, source: NodeIndex, target: NodeIndex): boolean; // overload 2
export declare const hasNode: (nodeIndex: NodeIndex): <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => boolean; // overload 1
export declare const hasNode: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, nodeIndex: NodeIndex): boolean; // overload 2
export declare const indices: <T, N>(walker: Walker<T, N>): Iterable<T>;
export declare const isAcyclic: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>): boolean;
export declare const isBipartite: <N, E>(graph: Graph<N, E, "undirected"> | MutableGraph<N, E, "undirected">): boolean;
export declare const isGraph: (u: unknown): u is Graph<unknown, unknown>;
export declare const mapEdges: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>, f: (data: E) => E): void;
export declare const mapNodes: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>, f: (data: N) => N): void;
export declare const mutate: <N, E, T extends Kind = "directed">(f: (mutable: MutableGraph<N, E, T>) => void): (graph: Graph<N, E, T>) => Graph<N, E, T>; // overload 1
export declare const mutate: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T>, f: (mutable: MutableGraph<N, E, T>) => void): Graph<N, E, T>; // overload 2
export declare const neighbors: (nodeIndex: NodeIndex): <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => Array<NodeIndex>; // overload 1
export declare const neighbors: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, nodeIndex: NodeIndex): Array<NodeIndex>; // overload 2
export declare const neighborsDirected: (nodeIndex: NodeIndex, direction: Direction): <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => Array<NodeIndex>; // overload 1
export declare const neighborsDirected: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, nodeIndex: NodeIndex, direction: Direction): Array<NodeIndex>; // overload 2
export declare const nodeCount: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>): number;
export declare const nodes: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>): NodeWalker<N>;
export declare const removeEdge: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>, edgeIndex: EdgeIndex): void;
export declare const removeNode: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>, nodeIndex: NodeIndex): void;
export declare const reverse: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>): void;
export declare const stronglyConnectedComponents: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>): Array<Array<NodeIndex>>;
export declare const toGraphViz: <N, E>(options?: GraphVizOptions<N, E>): <T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => string; // overload 1
export declare const toGraphViz: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, options?: GraphVizOptions<N, E>): string; // overload 2
export declare const toMermaid: <N, E>(options?: MermaidOptions<N, E>): <T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => string; // overload 1
export declare const toMermaid: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, options?: MermaidOptions<N, E>): string; // overload 2
export declare const topo: (config?: TopoConfig): <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>) => NodeWalker<N>; // overload 1
export declare const topo: <N, E, T extends Kind = "directed">(graph: Graph<N, E, T> | MutableGraph<N, E, T>, config?: TopoConfig): NodeWalker<N>; // overload 2
export declare const undirected: <N, E>(mutate?: (mutable: MutableUndirectedGraph<N, E>) => void): UndirectedGraph<N, E>;
export declare const updateEdge: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>, edgeIndex: EdgeIndex, f: (data: E) => E): void;
export declare const updateNode: <N, E, T extends Kind = "directed">(mutable: MutableGraph<N, E, T>, index: NodeIndex, f: (data: N) => N): void;
export declare const values: <T, N>(walker: Walker<T, N>): Iterable<N>;
```

## Other Exports (Non-Function)

- `AllPairsResult` (interface)
- `AstarConfig` (interface)
- `BellmanFordConfig` (interface)
- `DijkstraConfig` (interface)
- `DirectedGraph` (type)
- `Direction` (type)
- `Edge` (class)
- `EdgeIndex` (type)
- `EdgeWalker` (type)
- `ExternalsConfig` (interface)
- `Graph` (interface)
- `GraphError` (class)
- `GraphVizOptions` (interface)
- `Kind` (type)
- `MermaidDiagramType` (type)
- `MermaidDirection` (type)
- `MermaidNodeShape` (type)
- `MermaidOptions` (interface)
- `MutableDirectedGraph` (type)
- `MutableGraph` (interface)
- `MutableUndirectedGraph` (type)
- `NodeIndex` (type)
- `NodeWalker` (type)
- `PathResult` (interface)
- `Proto` (interface)
- `SearchConfig` (interface)
- `TopoConfig` (interface)
- `UndirectedGraph` (type)
- `Walker` (class)
