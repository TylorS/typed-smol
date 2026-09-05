---
slug: "persist-the-list"
title: "Persist the list"
summary: "Observe application state from a local-storage adapter."
order: 8
demo: "todo-8"
architecture: ["domain","application","infrastructure"]
---

Persistence is an infrastructure concern. The adapter loads the initial TodoList and
observes later values into a Schema-backed store. Storage failure policy stays beside the adapter;
the application continues to describe Todo operations without localStorage imports.

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
