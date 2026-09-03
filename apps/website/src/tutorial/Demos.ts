import { Fx, RefArray, RefSubject } from "@typed/fx";
import { EventHandler, html, many } from "@typed/template";
import { Effect, Schema } from "effect";

const ReactiveCounterDemo = Fx.gen(function* () {
  const count = yield* RefSubject.make(0);

  return html`<div class="counter-demo">
    <span class="counter-demo__label">Reactive Counter</span>
    <div class="counter-demo__controls">
      <button type="button" onclick=${RefSubject.decrement(count)}>Decrease</button>
      <output aria-live="polite">${count}</output>
      <button type="button" onclick=${RefSubject.increment(count)}>Increase</button>
    </div>
  </div>`;
});

const ComponentCounterDemo = Fx.gen(function* () {
  const count = yield* RefSubject.make(0);
  const doubled = RefSubject.map(count, (value) => value * 2);

  return html`<div class="counter-demo">
    <span class="counter-demo__label">Component Counter</span>
    <div class="counter-demo__controls">
      <button type="button" onclick=${RefSubject.decrement(count)}>Decrease</button>
      <output aria-live="polite">${count}</output>
      <button type="button" onclick=${RefSubject.increment(count)}>Increase</button>
    </div>
    <p>Twice the count: ${doubled}</p>
  </div>`;
});

const HydratedCounterDemo = Fx.gen(function* () {
  const count = yield* RefSubject.hydrate(
    Schema.Finite,
    Effect.sync(() => (typeof document === "undefined" ? 7 : 0)),
  );

  return html`<div class="counter-demo" ref=${count}>
    <span class="counter-demo__label">Hydrated Counter</span>
    <div class="counter-demo__controls">
      <button type="button" onclick=${RefSubject.decrement(count)}>Decrease</button>
      <output aria-live="polite">${count}</output>
      <button type="button" onclick=${RefSubject.increment(count)}>Increase</button>
    </div>
  </div>`;
});

const DemoTodo = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
  completed: Schema.Boolean,
});
type DemoTodo = typeof DemoTodo.Type;

const DemoFilter = Schema.Literals(["all", "active", "completed"]);
type DemoFilter = typeof DemoFilter.Type;

const initialTodos: ReadonlyArray<DemoTodo> = [
  { id: "learn-typed", text: "Learn Typed", completed: true },
  { id: "model-boundaries", text: "Model clean boundaries", completed: false },
  { id: "ship-tutorial", text: "Ship the tutorial", completed: false },
];

const filterTodos = (todos: ReadonlyArray<DemoTodo>, filter: DemoFilter) => {
  switch (filter) {
    case "active":
      return todos.filter((todo) => !todo.completed);
    case "completed":
      return todos.filter((todo) => todo.completed);
    case "all":
      return todos;
  }
};

const TodoDemoContent = <E, R>(
  stage: number,
  todos: RefSubject.RefSubject<ReadonlyArray<DemoTodo>, E, R>,
  text: RefSubject.RefSubject<string, E, R>,
  filter: RefSubject.RefSubject<DemoFilter, E, R>,
) => {
  const visible = RefSubject.map(RefSubject.struct({ todos, filter }), ({ todos, filter }) =>
    filterTodos(todos, filter),
  );
  const activeCount = RefSubject.map(
    todos,
    (items) => items.filter((todo) => !todo.completed).length,
  );
  const activeLabel = RefSubject.map(activeCount, (count) => (count === 1 ? "item" : "items"));
  const someAreCompleted = RefSubject.map(todos, (items) => items.some((todo) => todo.completed));
  const canEdit = stage >= 5;
  const showFooter = stage >= 6;
  const showFilters = stage >= 7;
  const showPersistence = stage >= 8;

  const onInput = EventHandler.make((event: InputEvent & { target: HTMLInputElement }) =>
    RefSubject.set(text, event.target.value),
  );
  const addTodo = text.pipe(
    Effect.flatMap((value) => {
      const normalized = value.trim();
      if (normalized === "") return Effect.void;
      return RefArray.append(todos, {
        id: globalThis.crypto?.randomUUID?.() ?? `todo-${Date.now()}`,
        text: normalized,
        completed: false,
      }).pipe(Effect.flatMap(() => RefSubject.set(text, "")));
    }),
  );
  const onSubmit = EventHandler.make(() => addTodo, { preventDefault: true });
  const reset = Effect.all([
    RefSubject.set(todos, initialTodos),
    RefSubject.set(text, ""),
    RefSubject.set(filter, "all"),
  ]);
  const toggle = (id: string) =>
    RefSubject.update(todos, (items) =>
      items.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    );
  const remove = (id: string) =>
    RefSubject.update(todos, (items) => items.filter((todo) => todo.id !== id));
  const edit = (id: string, value: string) =>
    RefSubject.update(todos, (items) =>
      items.map((todo) => (todo.id === id ? { ...todo, text: value } : todo)),
    );
  const clearCompleted = RefSubject.update(todos, (items) =>
    items.filter((todo) => !todo.completed),
  );
  const clearCompletedControl = Fx.if(someAreCompleted, {
    onTrue: html`<button type="button" onclick=${clearCompleted}>Clear completed</button>`,
    onFalse: Fx.null,
  });

  const TodoItem = (todo: RefSubject.RefSubject<DemoTodo>, id: string) => {
    const item = RefSubject.map(todo, (value) => value);
    const completed = RefSubject.map(item, (value) => value.completed);
    const itemText = RefSubject.map(item, (value) => value.text);
    const onEdit = EventHandler.make((event: InputEvent & { target: HTMLInputElement }) =>
      edit(id, event.target.value),
    );

    return html`<li class=${Fx.when(completed, { onTrue: "is-complete", onFalse: "" })}>
      <input
        type="checkbox"
        aria-label="Toggle ${itemText}"
        ?checked=${completed}
        onclick=${toggle(id)}
      />
      ${
        canEdit
          ? html`<input class="todo-demo__edit" .value=${itemText} oninput=${onEdit} />`
          : html`<span>${itemText}</span>`
      }
      ${
        canEdit
          ? html`<button type="button" aria-label="Delete ${itemText}" onclick=${remove(id)}>
              Delete
            </button>`
          : null
      }
    </li>`;
  };

  return html`
    <header>
      <span class="counter-demo__label">TodoMVC milestone ${stage}</span>
      <button type="button" onclick=${reset}>Reset preview</button>
    </header>

    <form class="todo-demo__form" onsubmit=${onSubmit}>
      <label>
        <span class="sr-only">New Todo</span>
        <input
          placeholder="What needs to be done?"
          autocomplete="off"
          .value=${text}
          oninput=${onInput}
        />
      </label>
      <button type="submit">Add Todo</button>
    </form>
    ${
      stage === 4
        ? html`<p class="todo-demo__hint">
            The presentation shell is connected. Keyed item rendering arrives next.
          </p>`
        : null
    }
    ${
      showFilters
        ? html`<nav class="todo-demo__filters" aria-label="Preview filter">
            ${DemoFilter.literals.map(
              (value) => html`<button
                type="button"
                aria-pressed=${RefSubject.map(filter, (current) => current === value)}
                onclick=${RefSubject.set(filter, value)}
              >
                ${value}
              </button>`,
            )}
          </nav>`
        : null
    }
    ${
      stage >= 5
        ? html`<ul class="todo-demo__list">
            ${many(visible, (todo) => todo.id, TodoItem)}
          </ul>`
        : null
    }
    ${
      showFooter
        ? html`<footer>
            <span>${activeCount} ${activeLabel} left</span>
            ${clearCompletedControl}
          </footer>`
        : null
    }
    ${
      showPersistence
        ? html`<p class="todo-demo__persistence">
            Infrastructure boundary: the finished application observes this state into a
            Schema-backed local-storage adapter.
          </p>`
        : null
    }
  `;
};

const LocalTodoDemo = (stage: number) =>
  Fx.gen(function* () {
    const todos = yield* RefSubject.make<ReadonlyArray<DemoTodo>>(initialTodos);
    const text = yield* RefSubject.make("");
    const filter = yield* RefSubject.make<DemoFilter>("all");

    return html`<div class="todo-demo todo-demo--stage-${stage}">
      ${TodoDemoContent(stage, todos, text, filter)}
    </div>`;
  });

export const curriculumDemo = (id: string) => {
  if (id === "counter-reactive") return ReactiveCounterDemo;
  if (id === "counter-component") return ComponentCounterDemo;
  if (id === "counter-hydrated") return HydratedCounterDemo;
  const match = /^todo-(10|[4-9])$/u.exec(id);
  if (match === null) return undefined;
  return LocalTodoDemo(Number(match[1]));
};
