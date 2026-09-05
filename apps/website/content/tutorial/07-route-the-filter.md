---
slug: "route-the-filter"
title: "Route the filter"
summary: "Treat the URL as an implementation of application filter state."
order: 7
demo: "todo-7"
architecture: ["domain","application","presentation","infrastructure"]
---

The filter is shareable navigation state, so infrastructure derives it from Router and
presentation uses Link. The application consumes only FilterState. A test router or another adapter
can satisfy the same contract without changing domain rules.

## src/application.ts

```ts file="src/application.ts"
import { Context, Effect } from "effect"
import { RefArray, RefSubject } from "@typed/fx"
import * as Domain from "./domain.js"

export class TodoList extends RefSubject.Service<TodoList, Domain.TodoList>()("TodoList") {}
export class FilterState extends RefSubject.Service<FilterState, Domain.FilterState>()("FilterState") {}
export class TodoText extends RefSubject.Service<TodoText, string>()("TodoText") {}
export class CreateTodo extends Context.Service<CreateTodo, (text: string) => Effect.Effect<Domain.Todo>>()("CreateTodo") {}

export const Todos = RefSubject.map(
  RefSubject.struct({ list: TodoList, state: FilterState }),
  Domain.filterTodoList,
)

export const ActiveCount = RefSubject.map(TodoList, Domain.activeCount)
export const SomeAreCompleted = RefSubject.map(TodoList, Domain.someAreCompleted)
export const AllAreCompleted = RefSubject.map(TodoList, Domain.allAreCompleted)

export const createTodo = Effect.gen(function* () {
  const text = yield* TodoText
  if (text.trim() === "") return
  const create = yield* CreateTodo
  yield* RefArray.prepend(TodoList, yield* create(text))
  yield* RefSubject.set(TodoText, "")
})

export const editTodo = (id: Domain.TodoId, text: string) =>
  text.trim() === ""
    ? deleteTodo(id)
    : RefSubject.update(TodoList, Domain.editText(id, text))

export const toggleTodoCompleted = (id: Domain.TodoId) =>
  RefSubject.update(TodoList, Domain.toggleCompleted(id))

export const deleteTodo = (id: Domain.TodoId) =>
  RefSubject.update(TodoList, Domain.deleteTodo(id))

export const clearCompletedTodos = RefSubject.update(TodoList, Domain.clearCompleted)
export const toggleAllCompleted = RefSubject.update(TodoList, Domain.toggleAllCompleted)
```

## src/presentation.ts

```ts file="src/presentation.ts"
import { Effect } from "effect"
import { Fx, RefSubject } from "@typed/fx"
import { EventHandler, html, many } from "@typed/template"
import { Link } from "@typed/ui/Link"
import * as App from "./application.js"
import * as Domain from "./domain.js"

const onInput = EventHandler.make((event: InputEvent & { target: HTMLInputElement }) =>
  RefSubject.set(App.TodoText, event.target.value),
)

const clearCompleted = Fx.if(App.SomeAreCompleted, {
  onTrue: html`<button onclick=${App.clearCompletedTodos}>Clear completed</button>`,
  onFalse: Fx.null,
})
export const TodoApp = html`<main class="todoapp ${App.FilterState}">
  <form onsubmit=${EventHandler.make(() => App.createTodo, { preventDefault: true })}>
    <input .value=${App.TodoText} oninput=${onInput} placeholder="What needs to be done?" />
  </form>
  <input type="checkbox" ?checked=${App.AllAreCompleted} />
  <button onclick=${App.toggleAllCompleted}>Mark all as complete</button>
  <ul>${many(App.Todos, (todo) => todo.id, TodoItem)}</ul>
  <p>${App.ActiveCount} items left</p>
  ${clearCompleted}
  <nav>
    ${Domain.FilterState.literals.map((filter) =>
      Link({ href: filter === "all" ? "/" : "/" + filter, content: filter }))}
  </nav>
</main>`

function TodoItem(todo: RefSubject.RefSubject<Domain.Todo>, id: Domain.TodoId) {
  return Fx.gen(function* () {
    const editing = yield* RefSubject.make(false)
    const text = RefSubject.map(todo, (value) => value.text)
    const completed = RefSubject.map(todo, (value) => value.completed)
    const submit = text.pipe(
      Effect.flatMap((value) => App.editTodo(id, value)),
      Effect.tap(() => RefSubject.set(editing, false)),
    )

    return html`<li class="${Fx.when(completed, { onTrue: "completed", onFalse: "" })}">
      <input type="checkbox" ?checked=${completed} onclick=${App.toggleTodoCompleted(id)} />
      <label ondblclick=${RefSubject.set(editing, true)}>${text}</label>
      <button onclick=${App.deleteTodo(id)}>Delete</button>
      <input .value=${text} onkeydown=${EventHandler.make((event: KeyboardEvent) =>
        event.key === "Enter" ? submit : undefined)} />
    </li>`
  })
}
```

## src/infrastructure.ts

```ts file="src/infrastructure.ts"
import { DateTime, Effect, Layer } from "effect"
import { Fx } from "@typed/fx"
import * as Router from "@typed/router"
import * as App from "./application.js"
import * as Domain from "./domain.js"

const FilterState = Router.match(Router.Slash, "all")
  .match(Router.Parse("active"), "active")
  .match(Router.Parse("completed"), "completed")
  .pipe(Router.redirectTo("/"), Fx.catchCause(() => Fx.succeed("all" as const)))

const Model = Layer.mergeAll(
  App.TodoList.make([]),
  App.FilterState.make(FilterState),
  App.TodoText.make(""),
)

const CreateTodo = Layer.sync(
  App.CreateTodo,
  () => (text: string) => Effect.sync((): Domain.Todo => ({
    id: Domain.TodoId.make(crypto.randomUUID()),
    text,
    completed: false,
    timestamp: DateTime.makeUnsafe(new Date()),
  })),
)

export const Services = Layer.mergeAll(CreateTodo).pipe(
  Layer.provideMerge(Model),
  Layer.provideMerge(Router.BrowserRouter()),
)
```
