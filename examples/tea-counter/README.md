# TEA Counter Example

TEA (The Elm Architecture) example built on `@typed/fx` and `@typed/template`. Implements a tea-effect-like experience: **init → update → view → subscriptions** with Commands and Subscriptions.

## Packages used

- `@typed/fx` — Fx streams, RefSubject for reactive state
- `@typed/template` — html literals, render, DomRenderTemplate
- `effect`

## How to run

From the repo root:

```bash
pnpm install
pnpm build
```

Then:

```bash
cd examples/tea-counter && pnpm dev
```

Starts the Vite dev server (e.g. [http://localhost:3001](http://localhost:3001)).

**Other commands** (from `examples/tea-counter`):

- `pnpm build` — production build
- `pnpm preview` — serve the production build locally

## Structure

- `src/main.ts` — Entry point: `Tea.run(Tea.program(init, update, view), document.body)`
- `src/tea/` — TEA primitives: Cmd, Sub, Tea (program + run)
- `src/Counter.ts` — Counter module: Model, Msg, init, update, view

## TEA Pattern

```ts
// init: [Model, Cmd<Msg>]
export const init: [Model, Cmd.Cmd<Msg>] = [{ count: 0 }, Cmd.none];

// update: (msg, model) => [Model, Cmd<Msg>]
export const update = (msg: Msg, model: Model): [Model, Cmd.Cmd<Msg>] => { ... };

// view: (modelRef) => (dispatch) => template
export const view = (modelRef) => (dispatch) => html`...`;

// subscriptions: (model) => Sub<Msg> (optional)
```

See [tea-effect](https://github.com/savkelita/tea-effect) for the reference implementation.
