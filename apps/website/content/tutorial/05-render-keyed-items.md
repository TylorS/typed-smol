---
slug: "render-keyed-items"
title: "Render keyed Todo items"
summary: "Preserve item identity while editing, toggling, and deleting."
order: 5
demo: "todo-5"
architecture: ["domain","application","presentation"]
---

many reconciles items by TodoId. Each item receives a focused RefSubject view and may own
short-lived editing state without turning the whole list into one rerender loop. Stable keys preserve
the native input and focus identity that belongs to each Todo.

## src/domain.ts

```ts file="src/domain.ts"
import * as Schema from "effect/Schema"

export const TodoId = Schema.String.pipe(Schema.brand("TodoId"))
export type TodoId = typeof TodoId.Type

export const Todo = Schema.Struct({
  id: TodoId,
  text: Schema.String,
  completed: Schema.Boolean,
  timestamp: Schema.DateTimeUtcFromString,
})
export type Todo = typeof Todo.Type
export const TodoList = Schema.Array(Todo)
export type TodoList = typeof TodoList.Type

export const FilterState = Schema.Literals(["all", "active", "completed"])
export type FilterState = typeof FilterState.Type

export const updateTodo = (id: TodoId, f: (todo: Todo) => Todo) =>
  (list: TodoList): TodoList =>
    list.map((todo) => todo.id === id ? f(todo) : todo)

export const editText = (id: TodoId, text: string) =>
  updateTodo(id, (todo) => ({ ...todo, text }))

export const updateText = (text: string) => (todo: Todo): Todo => ({ ...todo, text })

export const toggleCompleted = (id: TodoId) => (list: TodoList): TodoList =>
  updateTodo(id, (todo) => ({ ...todo, completed: !todo.completed }))(list)

export const deleteTodo = (id: TodoId) => (list: TodoList): TodoList =>
  list.filter((todo) => todo.id !== id)

export const clearCompleted = (list: TodoList): TodoList =>
  list.filter((todo) => !todo.completed)

export const activeCount = (list: TodoList): number =>
  list.filter((todo) => !todo.completed).length

export const someAreCompleted = (list: TodoList): boolean =>
  list.some((todo) => todo.completed)

export const allAreCompleted = (list: TodoList): boolean =>
  list.length > 0 && list.every((todo) => todo.completed)

export const toggleAllCompleted = (list: TodoList): TodoList => {
  const completed = list.some((todo) => !todo.completed)
  return list.map((todo) => ({ ...todo, completed }))
}

export const filterTodoList = ({ list, state }: { list: TodoList; state: FilterState }) =>
  state === "active"
    ? list.filter((todo) => !todo.completed)
    : state === "completed"
      ? list.filter((todo) => todo.completed)
      : list
```

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

export const editTodo = (id: Domain.TodoId, text: string) =>
  text.trim() === ""
    ? deleteTodo(id)
    : RefSubject.update(TodoList, Domain.editText(id, text))

export const toggleTodoCompleted = (id: Domain.TodoId) =>
  RefSubject.update(TodoList, Domain.toggleCompleted(id))

export const deleteTodo = (id: Domain.TodoId) =>
  RefSubject.update(TodoList, Domain.deleteTodo(id))
```

## src/presentation.ts

```ts file="src/presentation.ts"
import { Effect } from "effect"
import { Fx, RefSubject } from "@typed/fx"
import { EventHandler, html, many } from "@typed/template"
import * as App from "./application.js"
import * as Domain from "./domain.js"

const onInput = EventHandler.make((event: InputEvent & { target: HTMLInputElement }) =>
  RefSubject.set(App.TodoText, event.target.value),
)

export const TodoApp = html`<main class="todoapp">
  <form onsubmit=${EventHandler.make(() => App.createTodo, { preventDefault: true })}>
    <input .value=${App.TodoText} oninput=${onInput} placeholder="What needs to be done?" />
  </form>
  <ul>${many(App.TodoList, (todo) => todo.id, TodoItem)}</ul>
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
