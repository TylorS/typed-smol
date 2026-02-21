# Usage Reference: effect/Graph

- Import path: `effect/Graph`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Graph } from "effect"

// Directed graph with initial nodes and edges
const graph = Graph.directed<string, string>((mutable) => {
  const a = Graph.addNode(mutable, "A")
  const b = Graph.addNode(mutable, "B")
  const c = Graph.addNode(mutable, "C")
  Graph.addEdge(mutable, a, b, "A->B")
  Graph.addEdge(mutable, b, c, "B->C")
})
```

## Test Anchors

- `packages/effect/test/Graph.test.ts`
- `packages/effect/test/Pathfinding.test.ts`

## Top Symbols In Anchored Tests

- `Graph` (1381)
- `addNode` (446)
- `addEdge` (258)
- `directed` (187)
- `nodes` (79)
- `edges` (58)
- `NodeIndex` (46)
- `getNode` (42)
- `edgeCount` (39)
- `nodeCount` (36)
- `getEdge` (35)
- `undirected` (34)
- `neighbors` (33)
- `indices` (32)
- `entries` (30)
