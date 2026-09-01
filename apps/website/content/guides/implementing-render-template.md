---
title: Implement a RenderTemplate target
summary: Build or decorate a renderer at the public RenderTemplate boundary while keeping parsing, output ownership, and platform policy inside the target.
section: Integration
kind: deep-dive
order: 10.1
---

Start from the same template an application author would write. `RenderTemplate` is the service that
later interprets it for a target.

```ts
import { html } from "@typed/template";

export const preferencesPanel = html`<section aria-labelledby="preferences-title">
  <h1 id="preferences-title">Workspace preferences</h1>
  <p>Changes are saved automatically.</p>
</section>`;
```

Its one call receives the literal's `TemplateStringsArray` and interpolation array, then returns
`Fx<RenderEvent, E, R | Scope>`. That boundary keeps authoring renderer-neutral: this value can
target DOM, hydratable HTML, static HTML, or another output system without changing the markup API.

Most applications should provide `DomRenderTemplate` or `HtmlRenderTemplate`; they should not write
a renderer. Implement this contract when you are building a framework primitive, an instrumented
target, or an adapter with a genuine alternate output medium. Do not use it merely to mount a foreign
widget—use the `RenderEvent` integration boundary for that.

## Implement the public RenderTemplate contract

A target may wrap another target without changing a template's public type. The decorator below
obtains the existing service, returns a function with the same `(strings, values)` shape, and observes
each emitted `RenderEvent`. Its requirements remain those of the delegated renderer plus the Scope
that owns a live render.

```ts
import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, RenderTemplate } from "@typed/template";

const observedRenderTemplate = Layer.effect(
  RenderTemplate,
  Effect.map(RenderTemplate, (renderTemplate) => (strings, values) =>
    renderTemplate(strings, values).pipe(
      Fx.tap(() => Effect.log("Template emitted rendered output")),
    ),
  ),
).pipe(Layer.provide(DomRenderTemplate));

export const BrowserRenderTarget = observedRenderTemplate;
```

This is a complete public `RenderTemplate` implementation because it delegates all literal parsing,
part interpretation, output ownership, and finalization to `DomRenderTemplate`. It is a useful first
target extension: it preserves the full behavior of a proven target and makes one isolated policy
change visible.

To implement a new medium rather than decorate one, use the same return contract. Parse/cache static
literal structure per `TemplateStringsArray` identity, interpret each value according to its parsed
part, and emit only renderer-owned `RenderEvent` values. The DOM implementation emits
`DomRenderEvent`; the HTML implementation emits ordered `HtmlRenderEvent` chunks. Do not use a
string as a substitute for renderer-owned HTML output: ordinary strings are data and must remain
escaped at a node part.

## Keep renderer-only machinery at the boundary

The target owns its parsed-template cache, scheduling policy, node/HTML representation, and any
target-specific cleanup. The Fx returned from a call owns live per-render work through its Scope.
An application template owns none of those implementation details; it only declares static markup
and renderable values.

The author writes static markup and `Renderable` values; the target parses/caches that literal,
normalizes the values without erasing their `E`/`R` channels, and emits owned DOM or HTML render
events. It must close the per-render Scope on interruption, including subscriptions, listeners,
queued work, and target resources. Effect's [Scope guide](https://www.effect.website/docs/v4/resource-management/scope/)
is the resource model to use rather than inventing another teardown protocol.

## Make target behavior explicit

Document which `RenderEvent` types your target emits, whether it is finite (as an HTML response is)
or live (as a DOM mount is), and how it treats node identity, errors, services, and cancellation.
If it can adopt output created elsewhere, document the marker/version compatibility boundary. If it
cannot, produce fresh owned output rather than guessing how to mutate arbitrary nodes.

For the browser, `DomRenderTemplate` caches parsed literal structure, clones static fragments, sets
up native event listeners, and maintains only the parts/ranges it owns. For SSR,
`HtmlRenderTemplate` produces ordered escaped chunks and hydration markers; `StaticHtmlRenderTemplate`
deliberately omits adoption metadata. These are different targets with the same authoring surface,
not a DOM target pretending to be a string renderer.

## Test a renderer target as a contract

Start with a static literal, a scalar dynamic part, a nested template, an Effect that fails, and an
Fx that must finalize when its rendering Scope closes. Then test the target-specific promise: DOM
identity and native events for a browser target; escaping, ordering, finite completion, and marker
compatibility for an HTML target. A decorator should run the same tests as its delegate plus one
test for its added policy. Keep those tests at the public `html`/`RenderTemplate` boundary so an
internal parser refactor cannot silently change observable behavior.
