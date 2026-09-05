---
slug: "test-the-boundaries"
title: "Test the boundaries"
summary: "Prove rules, use cases, rendering, and final composition at their own seams."
order: 10
demo: "todo-10"
architecture: ["domain","application","presentation","infrastructure","main"]
---

Pure domain tests need no renderer. Application tests supply deterministic services and
assert state transitions. DOM template tests prove rendering and interaction with deterministic
services. One production smoke test launches the real client layers together. The final structure
matches examples/todomvc: domain points nowhere outward; application points to domain; presentation
and infrastructure point inward; main alone joins them.

## src/domain.test.ts

```ts file="src/domain.test.ts"
import { DateTime } from "effect"
import { describe, expect, it } from "vitest"
import { TodoId, type TodoList, toggleCompleted } from "./domain.js"

describe("Todo domain", () => {
  it("toggles only the requested Todo", () => {
    const timestamp = DateTime.makeUnsafe("2026-01-01T00:00:00Z")
    const first = TodoId.make("first")
    const todos: TodoList = [
      { id: first, text: "Learn Typed", completed: false, timestamp },
      { id: TodoId.make("second"), text: "Ship", completed: false, timestamp },
    ]
    const next = toggleCompleted(first)(todos)
    expect(next.map(({ completed }) => completed)).toEqual([true, false])
  })
})
```

## src/main.ts

```ts file="src/main.ts"
import { Fx } from "@typed/fx"
import { DomRenderTemplate, render } from "@typed/template"
import { Effect, Layer } from "effect"
import { Services } from "./infrastructure.js"
import { TodoApp } from "./presentation.js"

await render(TodoApp, document.body).pipe(
  Fx.drainLayer,
  Layer.provide([Services, DomRenderTemplate]),
  Layer.launch,
  Effect.runPromise,
)
```
