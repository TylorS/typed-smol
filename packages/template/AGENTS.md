# @typed/template

## Intent

`@typed/template` is the **core UI layer** for typed-smol apps: HTML literals over Effect, reactive streams, DOM + SSR + hydration. Templates are **Fx streams** (`Fx<RenderEvent, E, R>`); rendering is stream-based, not vdom-like. Agents should treat this as the primary way to build type-safe, reactive UIs in the typed-smol stack.

## Capabilities

- **Declarative UI**: `html` tag; interpolate `Renderable` values (primitives, Effects, Fx/Stream, arrays).
- **Reactive rendering**: RefSubject, Fx in templates; DOM updates driven by stream emissions.
- **Dual targets**: `DomRenderTemplate` (browser) and `HtmlRenderTemplate` (SSR); same templates, different outputs.
- **Hydration**: `makeHydrateContext`, `HydrateContext` for attaching to existing SSR DOM.
- **Keyed lists**: `many(values, getKey, render)` for efficient list diffing and stateful list items.
- **Event handling**: `EventHandler.make` with Effect; options (preventDefault, stopPropagation, etc.).
- **Render queue**: `RenderQueue`, `RenderPriority` for batched updates (Sync, Raf, Idle).

## Mental model

- Templates parse to AST → parts (text, attr, event) → rendered via `RenderTemplate` (service).
- **DOM path**: `render(fx, container)` → diff/patch or hydrate.
- **HTML path**: `renderToHtml` / `renderToHtmlString` → stream of HTML strings.

## Key exports / surfaces

- `html`, `render`, `RenderTemplate`, `DomRenderTemplate`, `HtmlRenderTemplate`, `EventHandler`, `many`
- Dependencies: `@typed/fx`, `effect`, `html5parser`

## Constraints

- Effect skill loading: `.cursor/rules/effect-skill-loading.mdc`
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`

## Pointers

- README for full API reference
- Examples: `examples/counter` (minimal reactive state + DOM), `examples/todomvc` (routing, layers, full stack)
- Sibling: `@typed/ui` for Link, SSR helpers (`ssrForHttp`, `handleHttpServerError`)
- Root AGENTS.md for bootup/modes
