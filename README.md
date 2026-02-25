# Typed

> **Beta:** This repository and all packages are in **beta**. APIs may change without notice and breaking changes are possible. Use with that in mind and feedback is welcome.

**Typed** is a fully **Effect-native UI framework** for building typed, reliable web applications. Define your routes and API endpoints as plain files, and Typed generates type-safe routers, API clients, and OpenAPI specs at compile time -- with full IntelliSense in your editor.

## What You Get

- **File-based routing** -- drop route files in a directory, `import routes from "router:./routes"`, and get a fully typed router
- **File-based APIs** -- drop endpoint files in a directory, `import * as Api from "api:./endpoints"`, and get a typed API server, client, and OpenAPI spec
- **Full editor support** -- IntelliSense, go-to-definition, and type errors for virtual module imports work out of the box
- **Effect-native** -- routes, handlers, templates, and state all compose through Effect's error handling, dependency injection, and resource safety

## Quick Start

```bash
pnpm add @typed/vite-plugin @typed/virtual-modules-ts-plugin @typed/app @typed/router @typed/fx @typed/template
```

**vite.config.ts**

```ts
import { defineConfig } from "vite";
import { typedVitePlugin } from "@typed/vite-plugin";

export default defineConfig({
  plugins: typedVitePlugin(),
});
```

The plugin auto-creates a Language Service-backed TypeInfo session from your tsconfig, so virtual modules stay type-aware as you edit. Pass `createTypeInfoApiSession` to override for custom setups.

**tsconfig.json** -- add the TS plugin for editor IntelliSense:

```json
{
  "compilerOptions": {
    "plugins": [{ "name": "@typed/virtual-modules-ts-plugin" }]
  }
}
```

That's it. You now have `router:` and `api:` virtual module imports available everywhere in your project.

## How Virtual Modules Work

Virtual modules are imports that don't point to files on disk. Instead, a plugin **generates TypeScript source on the fly** based on your project's file structure and types.

```
src/app.ts                        Your code
  │
  ├── import routes from "router:./routes"
  │         │
  │         ▼
  │   ┌─────────────────────────────┐
  │   │  Router Virtual Module      │
  │   │  Plugin scans ./routes/     │
  │   │  ├─ reads route exports     │
  │   │  ├─ validates contracts     │
  │   │  └─ emits typed Matcher     │
  │   └─────────────────────────────┘
  │         │
  │         ▼
  │   Generated TypeScript source
  │   (fully typed, never written to disk)
  │
  └── Your app uses the typed router
```

The same resolution works in three places:


| Tool                                               | What it does                                                |
| -------------------------------------------------- | ----------------------------------------------------------- |
| **Vite plugin** (`@typed/vite-plugin`)             | Resolves virtual imports during `vite dev` and `vite build` |
| **TS plugin** (`@typed/virtual-modules-ts-plugin`) | Provides IntelliSense and type-checking in your editor      |
| **vmc** (`@typed/virtual-modules-compiler`)        | Drop-in `tsc` replacement for CI type-checking              |


All three share the same `vmc.config.ts` (or inline config), so virtual modules resolve identically everywhere.

## Tutorial: File-Based Routing

### 1. Create route files

Each route file exports a `route` and an entrypoint (`handler`, `template`, or `default`):

```
src/
  routes/
    index.ts          →  /
    about.ts          →  /about
    users/
      index.ts        →  /users
      [id].ts         →  /users/:id
```

**src/routes/index.ts**

```ts
import * as Route from "@typed/router";

export const route = Route.Slash;
export const handler = "Welcome home";
```

**src/routes/about.ts**

```ts
import * as Route from "@typed/router";

export const route = Route.Parse("about");
export const handler = "About us";
```

**src/routes/users/[id].ts**

```ts
import { Effect } from "effect";
import * as Route from "@typed/router";

export const route = Route.Join(Route.Parse("users"), Route.Param("id"));

export const handler = (params: { id: string }) =>
  Effect.succeed(`User profile: ${params.id}`);
```

### 2. Import the virtual module

```ts
import routes from "router:./routes";
```

The plugin scans `./routes/`, validates each file's exports, and generates a fully typed `Router.Matcher`. The import is type-safe -- your editor shows the exact route params, handler types, and errors.

### 3. Render it

```ts
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import * as Router from "@typed/router";
import { DomRenderTemplate, html, render } from "@typed/template";
import routes from "router:./routes";

const App = html`<main>${Router.run(routes)}</main>`;

await render(App, document.body).pipe(
  Fx.drainLayer,
  Layer.provide([DomRenderTemplate, Router.BrowserRouter()]),
  Layer.launch,
  Effect.runPromise,
);
```

### Route conventions

**Required exports:**


| Export                                     | Type                                   | Purpose                               |
| ------------------------------------------ | -------------------------------------- | ------------------------------------- |
| `route`                                    | `Route` from `@typed/router`           | The URL pattern this file handles     |
| One of: `handler` / `template` / `default` | Value, Effect, Fx, Stream, or function | What to render when the route matches |


**Companion files** (optional, applied automatically):


| File                      | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `_layout.ts`              | Layout wrapper for all routes in the directory           |
| `_dependencies.ts`        | Shared dependencies (Layer/ServiceMap) for the directory |
| `_guard.ts`               | Guard that controls access to routes in the directory    |
| `_catch.ts`               | Error handler for routes in the directory                |
| `myroute.guard.ts`        | Guard for a specific route file                          |
| `myroute.dependencies.ts` | Dependencies for a specific route file                   |


Companions compose from ancestor directories down to the leaf route, so a `_layout.ts` at the root wraps everything.

## Tutorial: Type-Safe APIs

### 1. Create endpoint files

Each endpoint exports `route`, `method`, and `handler`:

```
src/
  api/
    status.ts
    users/
      list.ts
      create.ts
```

**src/api/status.ts**

```ts
import { Effect } from "effect";
import * as Schema from "effect/Schema";
import * as Route from "@typed/router";

export const route = Route.Parse("/status");
export const method = "GET" as const;
export const success = Schema.Struct({ status: Schema.Literal("ok") });

export const handler = () => Effect.succeed({ status: "ok" as const });
```

**src/api/users/list.ts**

```ts
import { Effect } from "effect";
import * as Schema from "effect/Schema";
import * as Route from "@typed/router";

export const route = Route.Parse("/users");
export const method = "GET" as const;
export const success = Schema.Array(Schema.Struct({ id: Schema.String, name: Schema.String }));

export const handler = () =>
  Effect.succeed([{ id: "1", name: "Alice" }]);
```

### 2. Import the virtual module

```ts
import * as Api from "api:./api";
```

The plugin generates:


| Export         | What it is                                  |
| -------------- | ------------------------------------------- |
| `Api.Api`      | The `HttpApi` definition with all endpoints |
| `Api.ApiLayer` | A Layer wiring all handlers to the API      |
| `Api.Client`   | A typed HTTP client for calling the API     |
| `Api.OpenApi`  | The OpenAPI spec object                     |
| `Api.Swagger`  | Swagger UI layer                            |
| `Api.Scalar`   | Scalar docs layer                           |
| `Api.serve`    | One-liner to start the server               |


### 3. Serve it

```ts
import * as Api from "api:./api";

Api.serve({ port: 3000 });
```

Or compose into a larger app:

```ts
import { Layer } from "effect";
import * as Api from "api:./api";

const app = Api.App({ port: 3000 });
// Add more layers, middleware, etc.
```

### Endpoint conventions

**Required exports:**


| Export    | Type                                            | Purpose         |
| --------- | ----------------------------------------------- | --------------- |
| `route`   | `Route` from `@typed/router`                    | The URL pattern |
| `method`  | `"GET"` / `"POST"` / `"PUT"` / `"DELETE"` / ... | HTTP method     |
| `handler` | `(ctx) => Effect<Success, Error, R>`            | Request handler |


**Optional exports:**


| Export    | Type     | Purpose                                                |
| --------- | -------- | ------------------------------------------------------ |
| `success` | `Schema` | Response body schema (with optional status annotation) |
| `error`   | `Schema` | Error response schema                                  |
| `headers` | `Schema` | Request headers schema                                 |
| `body`    | `Schema` | Request body schema                                    |


**Directory conventions:**


| File               | Purpose                                    |
| ------------------ | ------------------------------------------ |
| `_api.ts`          | API root configuration                     |
| `_group.ts`        | Group definition (creates an HttpApiGroup) |
| `_dependencies.ts` | Shared dependencies for the directory      |
| `_middlewares.ts`  | Shared middleware for the directory        |
| `(dirname)/`       | Pathless group (no URL segment added)      |


## Templates and Reactive UI

Typed's template system lets you embed `Effect`, `Fx`, and `Stream` values directly in HTML templates. No virtual DOM, no component model -- just tagged template literals with native reactivity.

### Reactive state with RefSubject

```ts
import { Effect, Layer } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

const Counter = Fx.gen(function* () {
  const count = yield* RefSubject.make(0);
  const doubled = RefSubject.map(count, (n) => n * 2);

  return html`<div>
    <button onclick=${RefSubject.increment(count)}>+</button>
    <button onclick=${RefSubject.decrement(count)}>-</button>
    <button onclick=${RefSubject.set(count, 0)}>Reset</button>
    <p>Count: ${count}</p>
    <p>Doubled: ${doubled}</p>
  </div>`;
});

await render(Counter, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
);
```

### Embed any Effect type

```ts
import { Effect } from "effect";
import * as Stream from "effect/Stream";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const fxValue = Fx.mergeAll(Fx.at("A", 0), Fx.at("B", 250), Fx.at("C", 500));
const streamValue = Stream.fromIterable(["one", "two", "three"]);

const view = html`<div data-current=${fxValue}>
  Effect: ${Effect.succeed("ready")}
  Fx: ${fxValue}
  Stream: ${streamValue}
</div>`;
```

### Event handlers

```ts
import { Effect } from "effect";
import { EventHandler, html } from "@typed/template";

const onClick = Effect.sync(() => console.log("clicked"));

const onSubmit = EventHandler.make(
  (ev: SubmitEvent) => Effect.sync(() => console.log("submitted", ev.type)),
  { preventDefault: true },
);

const view = html`<div>
  <button onclick=${onClick}>Click</button>
  <form onsubmit=${onSubmit}>
    <button type="submit">Submit</button>
  </form>
</div>`;
```

### Keyed list rendering

```ts
import { Fx, RefSubject } from "@typed/fx";
import { html, many } from "@typed/template";

type Todo = { id: string; text: string; done: boolean };

const TodoList = Fx.gen(function* () {
  const todos = yield* RefSubject.make<ReadonlyArray<Todo>>([
    { id: "1", text: "Learn Fx", done: false },
    { id: "2", text: "Use many()", done: false },
  ]);

  return html`<ul>
    ${many(
      todos,
      (todo) => todo.id,
      (todoRef) => html`<li>${RefSubject.map(todoRef, (t) => t.text)}</li>`,
    )}
  </ul>`;
});
```

### Attributes, properties, and refs

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const field = html`<input
  class="a ${Effect.succeed("b")} ${Fx.succeed("c")}"
  ?disabled=${Fx.succeed(false)}
  .value=${Effect.succeed("typed")}
  .data=${{ source: "docs", mode: "demo" }}
  ...${{ id: "name-input", "aria-label": "Name" }}
  ref=${(el: HTMLInputElement) => Effect.log("mounted", el.id)}
/>`;
```

### SSR streaming

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { HtmlRenderTemplate, renderToHtml } from "@typed/template/Html";

const page = html`<main><h1>Typed SSR</h1></main>`;

await renderToHtml(page).pipe(
  Fx.provide(HtmlRenderTemplate),
  Fx.observe((chunk) => Effect.sync(() => process.stdout.write(chunk))),
  Effect.runPromise
);
```

## Typed Routes

You can also define routes programmatically without the virtual module system:

```ts
import * as Router from "@typed/router";

const Home = Router.Slash;                                                     // "/"
const UserById = Router.Join(Router.Parse("users"), Router.Param("id"));       // "/users/:id"
const TeamByNum = Router.Join(Router.Parse("teams"), Router.Number("teamId")); // "/teams/:teamId"

const routes = Router.match(Home, html`<h1>Home</h1>`)
  .match(UserById, (params) =>
    RefSubject.map(params, ({ id }) => html`User ${id}`))
  .pipe(Router.redirectTo("/"));

const App = html`<main>${Router.run(routes)}</main>`;
```

## CI Type-Checking with vmc

For CI or non-Vite builds, use `vmc` as a drop-in `tsc` replacement that resolves virtual modules:

```bash
npx vmc --noEmit -p tsconfig.json
npx vmc --watch
npx vmc --build
```

Initialize a config file (shared with the TS plugin and Vite plugin):

```bash
npx vmc init   # creates vmc.config.ts
```

## Custom Virtual Module Plugins

The virtual module system is extensible. Create a plugin that implements the `VirtualModulePlugin` interface:

```ts
import type { VirtualModulePlugin } from "@typed/virtual-modules";

const myPlugin: VirtualModulePlugin = {
  name: "my-plugin",
  shouldResolve(id) {
    return id === "virtual:config";
  },
  build(id, importer, api) {
    return `export const version = "1.0.0";`;
  },
};
```

Register it in `vmc.config.ts`:

```ts
export default {
  plugins: [myPlugin],
};
```

Plugins receive a `TypeInfoApi` in `build()` for type-aware code generation:

```ts
build(id, importer, api) {
  const snapshot = api.file("types.ts", { baseDir: dirname(importer) });
  if (!snapshot.ok) return `export const names: string[] = [];`;

  const names = snapshot.snapshot.exports.map((e) => e.name);
  return `export const names = ${JSON.stringify(names)} as const;`;
}
```

## Packages


| Package                                                                          | Description                                                                  |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [@typed/app](packages/app/README.md)                                             | Router and HttpApi virtual module plugins, `defineApiHandler` helper         |
| [@typed/vite-plugin](packages/vite-plugin/README.md)                             | Vite integration -- `typedVitePlugin()` for zero-config virtual modules      |
| [@typed/virtual-modules](packages/virtual-modules/README.md)                     | Core virtual module plugin system and TypeInfoApi                            |
| [@typed/virtual-modules-vite](packages/virtual-modules-vite/README.md)           | Low-level Vite adapter for virtual module resolution                         |
| [@typed/virtual-modules-compiler](packages/virtual-modules-compiler/README.md)   | `vmc` CLI -- drop-in `tsc` with virtual module support                       |
| [@typed/virtual-modules-ts-plugin](packages/virtual-modules-ts-plugin/README.md) | TypeScript Language Service plugin for editor IntelliSense                   |
| [@typed/fx](packages/fx/README.md)                                               | `Fx` -- push-based reactive abstraction extending Effect                     |
| [@typed/template](packages/template/README.md)                                   | Streaming templates with Fx/Stream/Effect integration and hydration          |
| [@typed/router](packages/router/README.md)                                       | Type-safe routing with compile-time literal parsing and Schema decoding      |
| [@typed/navigation](packages/navigation/README.md)                               | Browser/memory navigation and routing types                                  |
| [@typed/ui](packages/ui/README.md)                                               | Web integration: HttpRouter, Link (builds on router + template + navigation) |
| [@typed/async-data](packages/async-data/README.md)                               | Async data states (NoData, Loading, Success, Failure, Optimistic)            |
| [@typed/guard](packages/guard/README.md)                                         | Effect-based guards with Schema decode/encode and composition                |
| [@typed/id](packages/id/README.md)                                               | ID generation: Cuid, Ksuid, NanoId, Ulid, Uuid                               |


## Architecture at a Glance

Typed adds one runtime abstraction to Effect: `**Fx**`, a push-based stream for modeling time-varying values. Browser events are naturally push-driven (clicks, timers, websockets), and `Fx` models this directly so UI updates and event handling align with the platform.

- `**Effect**` -- one-shot and scoped computations
- `**Fx**` -- push-driven values and events over time
- **Templates** -- tagged template literals with native `Fx`/`Stream`/`Effect` embedding
- **Routing** -- type-level literal parsing built on `find-my-way-ts`

Targeted text and attribute updates are O(1). `many(...)` list updates use O(n) keyed diffing.

## Examples

- **[Counter](examples/counter/README.md)** -- Minimal reactive counter with `@typed/fx` and `@typed/template`
- **[TodoMVC](examples/todomvc/README.md)** -- Full TodoMVC with routing, state, and templates

```bash
cd examples/counter && pnpm dev
cd examples/todomvc && pnpm dev
```

## Setup

```bash
pnpm install
pnpm build
```

## Scripts


| Command       | Description        |
| ------------- | ------------------ |
| `pnpm build`  | Build all packages |
| `pnpm test`   | Run tests          |
| `pnpm lint`   | Lint (oxlint)      |
| `pnpm format` | Format (oxfmt)     |


## Requirements

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (workspace uses `pnpm@10.0.0`)

## Releases

Install with the `beta` tag: `pnpm add @typed/fx@beta`


| Package    | Version      |
| ---------- | ------------ |
| fx         | 2.0.0-beta.0 |
| async-data | 1.0.0-beta.0 |
| guard      | 1.0.0-beta.0 |
| id         | 1.0.0-beta.0 |
| navigation | 1.0.0-beta.0 |
| router     | 1.0.0-beta.0 |
| template   | 1.0.0-beta.0 |
| ui         | 1.0.0-beta.0 |


