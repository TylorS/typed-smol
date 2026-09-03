export interface CurriculumFile {
  readonly name: string;
  readonly language: "ts" | "json" | "html";
  readonly source: string;
}

export interface QuickStartSection {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly files: ReadonlyArray<CurriculumFile>;
  readonly demo?: "counter-reactive" | "counter-component" | "counter-hydrated";
}

export interface TutorialStep {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly body: string;
  readonly files: ReadonlyArray<CurriculumFile>;
  readonly demo?: `todo-${number}`;
  readonly architecture: ReadonlyArray<
    "domain" | "application" | "presentation" | "infrastructure" | "main"
  >;
}

const file = (
  name: string,
  source: string,
  language: CurriculumFile["language"] = "ts",
): CurriculumFile => ({ name, language, source: source.trim() });

export const quickStartSections: ReadonlyArray<QuickStartSection> = [
  {
    id: "install",
    title: "Create the project",
    summary: "Start from an ordinary TypeScript application and install only the runtime packages.",
    body: `Use any TypeScript build tool that supports native ESM. Vite keeps the first run short,
but Typed does not require Vite. The application depends on Effect for its runtime, @typed/fx for
reactive state, and @typed/template for rendering.`,
    files: [
      file(
        "terminal",
        `npm create vite@latest typed-counter -- --template vanilla-ts
cd typed-counter
npm install effect @typed/fx @typed/template
npm run dev`,
        "html",
      ),
      file(
        "package.json",
        `{
  "type": "module",
  "dependencies": {
    "@typed/fx": "latest",
    "@typed/template": "latest",
    "effect": "latest"
  }
}`,
        "json",
      ),
    ],
  },
  {
    id: "client-only",
    title: "Render client-only markup",
    summary: "Describe the view as a Typed template, then choose the DOM renderer at the edge.",
    body: `The template is renderer-independent. DomRenderTemplate is supplied only where the
program is launched, so the view does not import a browser singleton or own document.body.`,
    files: [
      file(
        "src/main.ts",
        `import { Fx } from "@typed/fx"
import { DomRenderTemplate, html, render } from "@typed/template"
import { Effect, Layer } from "effect"

const Counter = html\`<main>
  <h1>Counter</h1>
  <output>0</output>
</main>\`

await render(Counter, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
)`,
      ),
    ],
  },
  {
    id: "reactive-state",
    title: "Own reactive state",
    summary: "Let RefSubject own the count and pass Effects directly to native event bindings.",
    body: `A RefSubject is both current state and an Fx of later values. Interpolating it renders
the current count and keeps that dynamic part subscribed. The button handlers are ordinary Effects;
Template acquires and disposes their listeners with the render Scope.`,
    files: [
      file(
        "src/main.ts",
        `import { Fx, RefSubject } from "@typed/fx"
import { DomRenderTemplate, html, render } from "@typed/template"
import { Effect, Layer } from "effect"

const Counter = Fx.gen(function* () {
  const count = yield* RefSubject.make(0)

  return html\`<main>
    <h1>Counter</h1>
    <button onclick=\${RefSubject.decrement(count)}>−</button>
    <output>\${count}</output>
    <button onclick=\${RefSubject.increment(count)}>+</button>
  </main>\`
})

await render(Counter, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
)`,
      ),
    ],
    demo: "counter-reactive",
  },
  {
    id: "component-lifetime",
    title: "Extract the Counter lifetime",
    summary: "Keep state construction inside the Fx that owns it and renderer choice outside.",
    body: `Counter acquires its RefSubject when a renderer subscribes. That Scope owns the state,
the dynamic output subscription, and every event listener. Moving the launch code to main.ts keeps
the component reusable in DOM tests, HTML rendering, and a larger application.`,
    files: [
      file(
        "src/Counter.ts",
        `import { Fx, RefSubject } from "@typed/fx"
import { html } from "@typed/template"

export const Counter = Fx.gen(function* () {
  const count = yield* RefSubject.make(0)
  const doubled = RefSubject.map(count, (value) => value * 2)

  return html\`<section aria-labelledby="counter-title">
    <h1 id="counter-title">Counter</h1>
    <button onclick=\${RefSubject.decrement(count)}>Decrease</button>
    <output aria-live="polite">\${count}</output>
    <button onclick=\${RefSubject.increment(count)}>Increase</button>
    <p>Twice the count: \${doubled}</p>
  </section>\`
})`,
      ),
    ],
    demo: "counter-component",
  },
  {
    id: "server-html",
    title: "Render the same tree on the server",
    summary: "Switch renderers at the composition edge and preserve one compatible inner template.",
    body: `HtmlRenderTemplate turns the Counter into renderer-owned HTML. Put that inner tree below
a stable host. The browser will render Counter into the host—not the surrounding document shell—so
Template can find its markers after the HTML parser has built the DOM.`,
    files: [
      file(
        "src/server.ts",
        `import { HtmlRenderTemplate, html, renderToHtmlString } from "@typed/template"
import { Effect } from "effect"
import { Counter } from "./Counter.js"

const Document = html\`<html>
  <body>
    <div id="app" style="display: contents">\${Counter}</div>
    <script type="module" src="/client.js"></script>
  </body>
</html>\`

export const markup = await renderToHtmlString(Document).pipe(
  Effect.provide(HtmlRenderTemplate),
  Effect.runPromise,
)`,
      ),
    ],
  },
  {
    id: "hydrate-state",
    title: "Hydrate state and adopt the DOM",
    summary: "Serialize Schema-checked state on the server and restore it before live parts run.",
    body: `RefSubject.hydrate is for state that crosses the server/browser boundary. Attach the
hydration ref to an element with ref. The server serializes its value there; the DOM renderer
decodes it before the count subscription and event handlers start. The browser fallback is not a
persistence strategy—it is used only when there is no compatible server value.`,
    files: [
      file(
        "src/Counter.ts",
        `import { Fx, RefSubject } from "@typed/fx"
import { html } from "@typed/template"
import { Effect, Schema } from "effect"

export const Counter = Fx.gen(function* () {
  const count = yield* RefSubject.hydrate(
    Schema.Finite,
    Effect.sync(() => typeof document === "undefined" ? 7 : 0),
  )

  return html\`<section ref=\${count}>
    <button onclick=\${RefSubject.decrement(count)}>Decrease</button>
    <output aria-live="polite">\${count}</output>
    <button onclick=\${RefSubject.increment(count)}>Increase</button>
  </section>\`
})`,
      ),
      file(
        "src/client.ts",
        `import { Fx } from "@typed/fx"
import { DomRenderTemplate, render } from "@typed/template"
import { Effect, Layer } from "effect"
import { Counter } from "./Counter.js"

const host = document.getElementById("app")
if (host === null) throw new Error("Missing #app host")

await render(Counter, host).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate.using(document)),
  Layer.launch,
  Effect.runPromise,
)`,
      ),
    ],
    demo: "counter-hydrated",
  },
];

const domainFile = file(
  "src/domain.ts",
  `import * as Schema from "effect/Schema"

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
      : list`,
);

const applicationSnapshot = (stage: 2 | 3 | 5 | 6 | 7): CurriculumFile => {
  const hasCreate = stage >= 3;
  const hasItems = stage >= 5;
  const hasFooter = stage >= 6;
  const hasFilter = stage >= 7;
  return file(
    "src/application.ts",
    `import { Context, Effect } from "effect"
import { ${hasCreate ? "RefArray, " : ""}RefSubject } from "@typed/fx"
import * as Domain from "./domain.js"

export class TodoList extends RefSubject.Service<TodoList, Domain.TodoList>()("TodoList") {}
${hasFilter ? 'export class FilterState extends RefSubject.Service<FilterState, Domain.FilterState>()("FilterState") {}\n' : ""}export class TodoText extends RefSubject.Service<TodoText, string>()("TodoText") {}
export class CreateTodo extends Context.Service<CreateTodo, (text: string) => Effect.Effect<Domain.Todo>>()("CreateTodo") {}

${
  hasFilter
    ? `export const Todos = RefSubject.map(
  RefSubject.struct({ list: TodoList, state: FilterState }),
  Domain.filterTodoList,
)`
    : ""
}
${
  hasFooter
    ? `
export const ActiveCount = RefSubject.map(TodoList, Domain.activeCount)
export const SomeAreCompleted = RefSubject.map(TodoList, Domain.someAreCompleted)
export const AllAreCompleted = RefSubject.map(TodoList, Domain.allAreCompleted)`
    : ""
}
${
  hasCreate
    ? `
export const createTodo = Effect.gen(function* () {
  const text = yield* TodoText
  if (text.trim() === "") return
  const create = yield* CreateTodo
  yield* RefArray.prepend(TodoList, yield* create(text))
  yield* RefSubject.set(TodoText, "")
})`
    : ""
}
${
  hasItems
    ? `
export const editTodo = (id: Domain.TodoId, text: string) =>
  text.trim() === ""
    ? deleteTodo(id)
    : RefSubject.update(TodoList, Domain.editText(id, text))

export const toggleTodoCompleted = (id: Domain.TodoId) =>
  RefSubject.update(TodoList, Domain.toggleCompleted(id))

export const deleteTodo = (id: Domain.TodoId) =>
  RefSubject.update(TodoList, Domain.deleteTodo(id))`
    : ""
}
${
  hasFooter
    ? `
export const clearCompletedTodos = RefSubject.update(TodoList, Domain.clearCompleted)
export const toggleAllCompleted = RefSubject.update(TodoList, Domain.toggleAllCompleted)`
    : ""
}`,
  );
};

const applicationStateFile = applicationSnapshot(2);
const applicationCreateFile = applicationSnapshot(3);
const applicationItemsFile = applicationSnapshot(5);
const applicationFooterFile = applicationSnapshot(6);
const applicationFile = applicationSnapshot(7);

const presentationSnapshot = (stage: 4 | 5 | 6 | 7): CurriculumFile => {
  const hasItems = stage >= 5;
  const hasFooter = stage >= 6;
  const hasFilter = stage >= 7;
  return file(
    "src/presentation.ts",
    `${hasItems ? 'import { Effect } from "effect"\nimport { Fx, RefSubject } from "@typed/fx"\n' : 'import { RefSubject } from "@typed/fx"\n'}import { EventHandler, html${hasItems ? ", many" : ""} } from "@typed/template"
${hasFilter ? 'import { Link } from "@typed/ui/Link"\n' : ""}import * as App from "./application.js"
${hasItems ? 'import * as Domain from "./domain.js"\n' : ""}
const onInput = EventHandler.make((event: InputEvent & { target: HTMLInputElement }) =>
  RefSubject.set(App.TodoText, event.target.value),
)
${
  hasFooter
    ? `
const clearCompleted = Fx.if(App.SomeAreCompleted, {
  onTrue: html\`<button onclick=\${App.clearCompletedTodos}>Clear completed</button>\`,
  onFalse: Fx.null,
})`
    : ""
}
export const TodoApp = html\`<main${hasFilter ? ' class="todoapp \${App.FilterState}"' : ' class="todoapp"'}>
  <form onsubmit=\${EventHandler.make(() => App.createTodo, { preventDefault: true })}>
    <input .value=\${App.TodoText} oninput=\${onInput} placeholder="What needs to be done?" />
  </form>
${hasFooter ? '  <input type="checkbox" ?checked=\${App.AllAreCompleted} />\n  <button onclick=\${App.toggleAllCompleted}>Mark all as complete</button>\n' : ""}${hasItems ? `  <ul>\${many(App.${hasFilter ? "Todos" : "TodoList"}, (todo) => todo.id, TodoItem)}</ul>\n` : ""}${hasFooter ? "  <p>\${App.ActiveCount} items left</p>\n  \${clearCompleted}\n" : ""}${
      hasFilter
        ? `  <nav>
    \${Domain.FilterState.literals.map((filter) =>
      Link({ href: filter === "all" ? "/" : "/" + filter, content: filter }))}
  </nav>
`
        : ""
    }</main>\`${
      hasItems
        ? `,

function TodoItem(todo: RefSubject.RefSubject<Domain.Todo>, id: Domain.TodoId) {
  return Fx.gen(function* () {
    const editing = yield* RefSubject.make(false)
    const text = RefSubject.map(todo, (value) => value.text)
    const completed = RefSubject.map(todo, (value) => value.completed)
    const submit = text.pipe(
      Effect.flatMap((value) => App.editTodo(id, value)),
      Effect.tap(() => RefSubject.set(editing, false)),
    )

    return html\`<li class="\${Fx.when(completed, { onTrue: "completed", onFalse: "" })}">
      <input type="checkbox" ?checked=\${completed} onclick=\${App.toggleTodoCompleted(id)} />
      <label ondblclick=\${RefSubject.set(editing, true)}>\${text}</label>
      <button onclick=\${App.deleteTodo(id)}>Delete</button>
      <input .value=\${text} onkeydown=\${EventHandler.make((event: KeyboardEvent) =>
        event.key === "Enter" ? submit : undefined)} />
    </li>\`
  })
}`
        : ""
    }`,
  );
};

const presentationShellFile = presentationSnapshot(4);
const presentationItemsFile = presentationSnapshot(5);
const presentationFooterFile = presentationSnapshot(6);
const presentationFile = presentationSnapshot(7);

const infrastructureRouteFile = file(
  "src/infrastructure.ts",
  `import { DateTime, Effect, Layer } from "effect"
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
)`,
);

const infrastructureFile = file(
  "src/infrastructure.ts",
  `import { Context, DateTime, Effect, Layer, Option } from "effect"
import { Fx } from "@typed/fx"
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore"
import * as Router from "@typed/router"
import * as App from "./application.js"
import * as Domain from "./domain.js"

class Todos extends Context.Service<Todos>()("Todos", {
  make: Effect.gen(function* () {
    const store = yield* KeyValueStore.KeyValueStore
    return KeyValueStore.toSchemaStore(store, Domain.TodoList)
  }),
}) {
  static readonly get = Todos.pipe(
    Effect.flatMap((store) => store.get("todos")),
    Effect.map(Option.getOrElse(() => [])),
    Effect.catchCause(() => Effect.succeed([])),
  )

  static readonly set = (todos: Domain.TodoList) =>
    Todos.pipe(Effect.flatMap((store) => store.set("todos", todos)))

  static readonly replicate = App.TodoList.pipe(Fx.observeLayer(Todos.set))
  static readonly local = Layer.effect(Todos, this.make).pipe(
    Layer.provideMerge(KeyValueStore.layerStorage(() => localStorage)),
  )
}

const FilterState = Router.match(Router.Slash, "all")
  .match(Router.Parse("active"), "active")
  .match(Router.Parse("completed"), "completed")
  .pipe(Router.redirectTo("/"), Fx.catchCause(() => Fx.succeed("all" as const)))

const Model = Layer.mergeAll(
  App.TodoList.make(Todos.get),
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

export const Services = Layer.mergeAll(CreateTodo, Todos.replicate).pipe(
  Layer.provideMerge(Model),
  Layer.provideMerge([Todos.local, Router.BrowserRouter()]),
)`,
);

const mainFile = file(
  "src/main.ts",
  `import { Fx } from "@typed/fx"
import { DomRenderTemplate, render } from "@typed/template"
import { Effect, Layer } from "effect"
import { Services } from "./infrastructure.js"
import { TodoApp } from "./presentation.js"

await render(TodoApp, document.body).pipe(
  Fx.drainLayer,
  Layer.provide([Services, DomRenderTemplate]),
  Layer.launch,
  Effect.runPromise,
)`,
);

export const tutorialSteps: ReadonlyArray<TutorialStep> = [
  {
    slug: "model-the-domain",
    title: "Model the domain",
    summary: "Define valid Todo values and keep list transformations pure.",
    body: `The domain names data and rules without knowing how the browser renders or stores them.
Effect Schema gives the boundary one runtime codec and one inferred TypeScript type. Pure list
functions make the rule independently testable and keep mutation policy out of event handlers.`,
    files: [domainFile],
    architecture: ["domain"],
  },
  {
    slug: "application-state",
    title: "Own application state",
    summary: "Expose reactive capabilities instead of a browser-shaped controller.",
    body: `The application layer names TodoList, TodoText, and CreateTodo as requirements. These
capabilities describe what later use cases and presentation need without constructing their
implementations. The application depends inward on the domain and outward only through interfaces.`,
    files: [domainFile, applicationStateFile],
    architecture: ["domain", "application"],
  },
  {
    slug: "create-a-todo",
    title: "Create a Todo",
    summary: "Coordinate one use case in the application layer.",
    body: `Creation reads draft text, rejects whitespace, asks the CreateTodo capability for a valid
entity, prepends it, and clears the draft. The view triggers one Effect; it does not reproduce this
policy in a submit callback.`,
    files: [applicationCreateFile],
    architecture: ["domain", "application"],
  },
  {
    slug: "render-the-shell",
    title: "Render the application shell",
    summary: "Connect native form events to application Effects.",
    body: `Presentation translates application state into semantic HTML. EventHandler normalizes the
native event boundary, while the Effects returned by application actions retain typed requirements
and Scope ownership.`,
    files: [presentationShellFile],
    demo: "todo-4",
    architecture: ["domain", "application", "presentation"],
  },
  {
    slug: "render-keyed-items",
    title: "Render keyed Todo items",
    summary: "Preserve item identity while editing, toggling, and deleting.",
    body: `many reconciles items by TodoId. Each item receives a focused RefSubject view and may own
short-lived editing state without turning the whole list into one rerender loop. Stable keys preserve
the native input and focus identity that belongs to each Todo.`,
    files: [domainFile, applicationItemsFile, presentationItemsFile],
    demo: "todo-5",
    architecture: ["domain", "application", "presentation"],
  },
  {
    slug: "derive-the-footer",
    title: "Derive the footer",
    summary: "Compute counts and conditional controls from the model.",
    body: `Counts, all-complete state, and whether Clear completed is visible are projections of the
Todo list. They stay in application-level computed values. Presentation renders those values and
dispatches named actions; it does not maintain shadow counters.`,
    files: [applicationFooterFile, presentationFooterFile],
    demo: "todo-6",
    architecture: ["domain", "application", "presentation"],
  },
  {
    slug: "route-the-filter",
    title: "Route the filter",
    summary: "Treat the URL as an implementation of application filter state.",
    body: `The filter is shareable navigation state, so infrastructure derives it from Router and
presentation uses Link. The application consumes only FilterState. A test router or another adapter
can satisfy the same contract without changing domain rules.`,
    files: [applicationFile, presentationFile, infrastructureRouteFile],
    demo: "todo-7",
    architecture: ["domain", "application", "presentation", "infrastructure"],
  },
  {
    slug: "persist-the-list",
    title: "Persist the list",
    summary: "Observe application state from a local-storage adapter.",
    body: `Persistence is an infrastructure concern. The adapter loads the initial TodoList and
observes later values into a Schema-backed store. Storage failure policy stays beside the adapter;
the application continues to describe Todo operations without localStorage imports.`,
    files: [infrastructureFile],
    demo: "todo-8",
    architecture: ["domain", "application", "infrastructure"],
  },
  {
    slug: "assemble-the-application",
    title: "Assemble the application",
    summary: "Join presentation, infrastructure, and the DOM renderer in one composition root.",
    body: `main.ts knows every outer edge because composition is its job. Domain and application
remain reusable inward units; infrastructure supplies their requirements; presentation consumes
them; the DOM renderer is selected only when the program launches.`,
    files: [domainFile, applicationFile, presentationFile, infrastructureFile, mainFile],
    demo: "todo-9",
    architecture: ["domain", "application", "presentation", "infrastructure", "main"],
  },
  {
    slug: "test-the-boundaries",
    title: "Test the boundaries",
    summary: "Prove rules, use cases, rendering, and final composition at their own seams.",
    body: `Pure domain tests need no renderer. Application tests supply deterministic services and
assert state transitions. DOM template tests prove rendering and interaction with deterministic
services. One production smoke test launches the real client layers together. The final structure
matches examples/todomvc: domain points nowhere outward; application points to domain; presentation
and infrastructure point inward; main alone joins them.`,
    files: [
      file(
        "src/domain.test.ts",
        `import { describe, expect, it } from "vitest"
import { toggleCompleted } from "./domain.js"

describe("Todo domain", () => {
  it("toggles only the requested Todo", () => {
    const next = toggleCompleted("first" as never)([
      { id: "first", text: "Learn Typed", completed: false } as never,
      { id: "second", text: "Ship", completed: false } as never,
    ])
    expect(next.map(({ completed }) => completed)).toEqual([true, false])
  })
})`,
      ),
      mainFile,
    ],
    demo: "todo-10",
    architecture: ["domain", "application", "presentation", "infrastructure", "main"],
  },
];

export const tutorialStepBySlug = new Map(tutorialSteps.map((step) => [step.slug, step]));

export const curriculumSearchEntries = [
  {
    id: "curriculum:quick-start",
    title: "Quick Start",
    kind: "guide" as const,
    text: quickStartSections.flatMap(({ title, summary }) => [title, summary]).join(" "),
    href: "/explore/quick-start",
  },
  {
    id: "curriculum:tutorial",
    title: "TodoMVC tutorial",
    kind: "guide" as const,
    text: tutorialSteps.flatMap(({ title, summary }) => [title, summary]).join(" "),
    href: "/explore/tutorial",
  },
  ...tutorialSteps.map((step) => ({
    id: `curriculum:tutorial:${step.slug}`,
    title: step.title,
    kind: "guide" as const,
    text: `${step.title} ${step.summary} ${step.body}`,
    href: `/explore/tutorial/${step.slug}`,
  })),
] as const;
