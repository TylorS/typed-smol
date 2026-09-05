---
slug: "render-the-shell"
title: "Render the application shell"
summary: "Connect native form events to application Effects."
order: 4
demo: "todo-4"
architecture: ["domain","application","presentation"]
---

Presentation translates application state into semantic HTML. EventHandler normalizes the
native event boundary, while the Effects returned by application actions retain typed requirements
and Scope ownership.

## src/presentation.ts

```ts file="src/presentation.ts"
import { RefSubject } from "@typed/fx"
import { EventHandler, html } from "@typed/template"
import * as App from "./application.js"

const onInput = EventHandler.make((event: InputEvent & { target: HTMLInputElement }) =>
  RefSubject.set(App.TodoText, event.target.value),
)

export const TodoApp = html`<main class="todoapp">
  <form onsubmit=${EventHandler.make(() => App.createTodo, { preventDefault: true })}>
    <input .value=${App.TodoText} oninput=${onInput} placeholder="What needs to be done?" />
  </form>
</main>`
```
