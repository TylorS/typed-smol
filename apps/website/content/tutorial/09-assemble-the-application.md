---
slug: "assemble-the-application"
title: "Assemble the application"
summary: "Join presentation, infrastructure, and the DOM renderer in one composition root."
order: 9
demo: "todo-9"
architecture: ["domain","application","presentation","infrastructure","main"]
---

main.ts knows every outer edge because composition is its job. Domain and application
remain reusable inward units; infrastructure supplies their requirements; presentation consumes
them; the DOM renderer is selected only when the program launches.

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
import { DateTime, Effect, Layer, Context, Schema } from "effect";
import { Fx } from "@typed/fx";
import * as Router from "@typed/router";
import * as App from "./application.js";
import * as Domain from "./domain.js";

const TODOS_STORAGE_KEY = `@typed/todomvc/todos`;

const TodoListJson = Schema.fromJsonString(Schema.toCodecJson(Domain.TodoList));
const decodeTodoList = Schema.decodeEffect(TodoListJson);
const encodeTodoList = Schema.encodeEffect(TodoListJson);

class Todos extends Context.Service<
  Todos,
  {
    readonly load: Effect.Effect<Domain.TodoList, unknown>;
    readonly save: (todos: Domain.TodoList) => Effect.Effect<void, unknown>;
  }
>()("TodosService") {
  static readonly get = Todos.pipe(
    Effect.flatMap((service) => service.load),
    Effect.catchCause(() => Effect.succeed([])),
  );

  static readonly set = (todos: Domain.TodoList) =>
    Effect.flatMap(Todos, (service) => service.save(todos)).pipe(
      Effect.catchCause((cause) =>
        Effect.logError("Failed to write todos to key value store", cause),
      ),
    );

  static readonly replicateToStorage = App.TodoList.pipe(Fx.observeLayer(Todos.set));

  static readonly local = Layer.succeed(Todos, {
    load: Effect.try(() => localStorage.getItem(TODOS_STORAGE_KEY)).pipe(
      Effect.flatMap((value) =>
        value === null ? Effect.succeed<Domain.TodoList>([]) : decodeTodoList(value),
      ),
    ),
    save: (todos) =>
      encodeTodoList(todos).pipe(
        Effect.flatMap((value) => Effect.try(() => localStorage.setItem(TODOS_STORAGE_KEY, value))),
      ),
  });
}

const FilterState = Router.match(Router.Slash, "all")
  .match(Router.Parse("active"), "active")
  .match(Router.Parse("completed"), "completed")
  .pipe(
    Router.redirectTo("/"),
    Fx.catchCause(() => Fx.succeed("all" as const)),
  );

const Model = Layer.mergeAll(
  App.TodoList.make(Todos.get),
  App.FilterState.make(FilterState),
  App.TodoText.make(""),
);

const CreateTodo = Layer.sync(
  App.CreateTodo,
  () => (text: string) =>
    Effect.sync((): Domain.Todo => ({
      id: Domain.TodoId.make(crypto.randomUUID()),
      text,
      completed: false,
      timestamp: DateTime.makeUnsafe(new Date()),
    })),
);

export const Services = Layer.mergeAll(CreateTodo, Todos.replicateToStorage).pipe(
  Layer.provideMerge(Model),
  Layer.provideMerge([Todos.local, Router.BrowserRouter()]),
);
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
