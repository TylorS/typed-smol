---
name: effect-module-graph
description: Guidance for `effect/Graph` focused on APIs like getEdge, getNode, and mapEdges. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Graph

## Owned scope

- Owns only `effect/Graph`.
- Source of truth: `packages/effect/src/Graph.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `getEdge`
- `getNode`
- `mapEdges`
- `mapNodes`
- `updateEdge`
- `updateNode`
- `filterEdges`
- `filterNodes`
- `filterMapEdges`
- `filterMapNodes`
- `hasEdge`
- `hasNode`
- `isGraph`
- `isAcyclic`
- `isBipartite`
- `bfs`
- `dfs`
- `Edge`
- Full API list: `references/api-reference.md`

## How to use it

- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Graph.ts`
- Representative tests: `packages/effect/test/Graph.test.ts`
- Representative tests: `packages/effect/test/Pathfinding.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
