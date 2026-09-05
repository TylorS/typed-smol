---
slug: "create-a-todo"
title: "Create a Todo"
summary: "Coordinate one use case in the application layer."
order: 3
architecture: ["domain","application"]
---

Creation reads draft text, rejects whitespace, asks the CreateTodo capability for a valid
entity, prepends it, and clears the draft. The view triggers one Effect; it does not reproduce this
policy in a submit callback.

## src/application.ts

```ts file="src/application.ts"
import { Context, Effect } from "effect"
import { RefArray, RefSubject } from "@typed/fx"
import * as Domain from "./domain.js"

export class TodoList extends RefSubject.Service<TodoList, Domain.TodoList>()("TodoList") {}
export class TodoText extends RefSubject.Service<TodoText, string>()("TodoText") {}
export class CreateTodo extends Context.Service<CreateTodo, (text: string) => Effect.Effect<Domain.Todo>>()("CreateTodo") {}




export const createTodo = Effect.gen(function* () {
  const text = yield* TodoText
  if (text.trim() === "") return
  const create = yield* CreateTodo
  yield* RefArray.prepend(TodoList, yield* create(text))
  yield* RefSubject.set(TodoText, "")
})
```
