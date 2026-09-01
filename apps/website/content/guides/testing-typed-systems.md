---
title: Testing Typed systems
summary: Test each Typed contract at the smallest boundary that owns its behavior.
section: Applications
kind: guide
order: 9
---

Test the boundary that owns the claim. An `Fx` test should not need a browser; a state test should
not need markup; a DOM test should assert native behavior and identity; a route test should not
depend on the browser's history. This keeps failures local for application developers and protects
the public contracts that library authors maintain.

Use [`@effect/vitest`](https://www.npmjs.com/package/@effect/vitest) as the harness. Its
`it.effect` runs an Effect test with the Scope it owns, so examples can acquire a `RefSubject`, run
an Fx, or mount a renderer without manually calling `Effect.runPromise` or wrapping the test in
`Effect.scoped`. `layer` shares an application layer across a related group of tests.

## 1. Prove finite and live `Fx` behavior

For a finite producer, collect values and assert the result. `Fx.collectAll` starts the source when
the test runs, preserves order, and completes when the source completes:

```ts
import { Effect } from "effect"
import { expect, it } from "@effect/vitest"
import * as Fx from "@typed/fx/Fx"

it.effect("maps and filters a finite producer", Effect.fn("mapsAndFilters")(function* () {
    const values = yield* Fx.collectAll(
      Fx.fromIterable([1, 2, 3, 4]).pipe(
        Fx.filter((n) => n % 2 === 0),
        Fx.map((n) => n * 2),
      ),
    )
    expect(values).toEqual([4, 8])
  }))
```

Use `Fx.collectUpTo` or `Fx.take` for an open source; collecting an infinite source never finishes.
For a callback source, test the owner as well as delivery. A returned cleanup is registered in the
subscription Scope, so interruption must release it:

```ts
import { Effect, Fiber } from "effect"
import { expect, it } from "@effect/vitest"
import * as Fx from "@typed/fx/Fx"

it.effect("cleans up a live callback source", Effect.fn("cleansUpCallback")(function* () {
    let active = 0
    const source = Fx.callback<number>(() => {
      active++
      return Effect.sync(() => active--)
    })

    const fiber = yield* Fx.collectAllFork(source)
    yield* Effect.yieldNow
    expect(active).toBe(1)
    yield* Fiber.interrupt(fiber)
    expect(active).toBe(0)
  }))
```

The same shape catches leaked timers, sockets, observers, and subscriptions. Use `Effect.exit` when
the claim is a typed failure, rather than asserting on an untyped rejected Promise.

## 2. Test `RefSubject` state without a DOM

`RefSubject.make` gives a current value and an update stream. Test transitions and derived views
directly; reserve browser tests for interaction, focus, ARIA, and other platform behavior:

```ts
import { Effect } from "effect"
import { expect, it } from "@effect/vitest"
import { RefSubject } from "@typed/fx"

it.effect("preserves a state invariant", Effect.fn("preservesStateInvariant")(function* () {
    const selected = yield* RefSubject.make<ReadonlySet<string>>(new Set<string>())
    const count = RefSubject.map(selected, (ids) => ids.size)

    yield* RefSubject.update(selected, (ids) => new Set([...ids, "invoice-42"]))
    yield* RefSubject.update(selected, (ids) => new Set([...ids, "invoice-42"]))

    expect([...(yield* selected)]).toEqual(["invoice-42"])
    expect(yield* count).toBe(1)
  }))
```

This proves the domain invariant without a renderer or event simulation. If the assertion is about
observations, start `Fx.observe` in `Effect.forkScoped`, wait for `subscriberCount` to reach the
expected value, then call `RefSubject.set`; a fixed sleep can hide a scheduling race.

## 3. Assert DOM identity and cleanup

Use a real `Document` with `DomRenderTemplate.using`; test rendered semantics rather than internal
part markers. For keyed collections, keep an element reference, reorder the source, and assert that
the same element remains:

```ts
import { Effect } from "effect"
import { expect, it } from "@effect/vitest"
import { Fx, RefSubject } from "@typed/fx"
import { DomRenderTemplate, html, isHtmlElement, many, render } from "@typed/template"

const keepsKeyedIdentity = Effect.fn("keepsKeyedIdentity")(function* () {
  const initial = [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ] as const
  const items = yield* RefSubject.make<ReadonlyArray<(typeof initial)[number]>>(initial)
  const view = html`<ul>${many(
    items,
    (item) => item.id,
    (item) => html`<li>${RefSubject.map(item, (value) => value.label)}</li>`,
  )}</ul>`
  const [rendered] = yield* render(view, document.body).pipe(
    Fx.provide(DomRenderTemplate.using(document)),
    Fx.take(1),
    Fx.collectUpTo(1),
  )
  if (rendered === undefined || !isHtmlElement(rendered)) throw new Error("render failed")
  const original = rendered.querySelectorAll("li")[1]

  yield* RefSubject.set(items, [initial[1], initial[0]])
  yield* Effect.yieldNow
  expect(rendered.querySelectorAll("li")[0]?.textContent).toBe("B")
  expect(rendered.querySelectorAll("li")[1]).toBe(original)
})

it.effect("keeps keyed DOM identity across a reorder", keepsKeyedIdentity)
```

Assert `textContent`, attributes, native properties, events, and identity. The repository's browser
identity tests also preserve input value, selection, dialog state, and custom-element lifecycle
across keyed moves. For cleanup, keep a render running in a scoped fiber with
`Fx.drain(render(view, host).pipe(Fx.provide(layer)))`; interrupt it, dispatch another native event,
and assert that the handler is no longer called. That proves listener ownership instead of merely
proving that one click worked.

## 4. Exercise memory routing and the SSR boundary

`TestRouter` is the deterministic, in-memory router layer. It lets a matcher test decode and select
routes without global history:

```ts
import { Effect } from "effect"
import { expect, layer } from "@effect/vitest"
import { Fx } from "@typed/fx"
import { Navigation } from "@typed/navigation"
import * as Matcher from "@typed/router/Matcher"
import * as Route from "@typed/router/Route"
import { TestRouter } from "@typed/router/Router"

layer(TestRouter({ url: "http://localhost/users/1" }))("memory routing", (it) => {
  it.effect("matches a route and navigates in memory", Effect.fn("matchesMemoryRoute")(function* () {
      const route = Route.Join(Route.Parse("users"), Route.Param("id"));
      const matcher = Matcher.empty.match(route, (params) => Fx.map(params, ({ id }) => `user:${id}`));

      expect(yield* Fx.collectAll(Fx.take(matcher, 1))).toEqual(["user:1"]);
      yield* Navigation.navigate("http://localhost/users/2");
      const currentEntry = yield* Navigation.currentEntry;
      expect(currentEntry.url.pathname).toBe("/users/2");
    }))
})
```

Use a `Latch` or `Deferred` when observing matcher output across multiple navigations; a sleep is
not a synchronization contract. Keep browser-history tests small and separate from route decoding.

SSR and hydration are separate claims. The server test checks serialized state:

```ts
import { Effect, Schema } from "effect"
import { expect, it } from "@effect/vitest"
import { RefSubject } from "@typed/fx"
import { HtmlRenderTemplate, html, renderToHtmlString } from "@typed/template"

it.effect("serializes state for hydration", Effect.fn("serializesHydrationState")(function* () {
    const count = yield* RefSubject.hydrate(Schema.Finite, 7)
    const output = yield* renderToHtmlString(html`<button ref=${count}>${count}</button>`).pipe(
      Effect.provide(HtmlRenderTemplate),
    )
    expect(output).toContain("data-typed-refsubject=")
    expect(output).toContain("<!--n_1-->7<!--/n_1-->")
  }))
```

The browser half places that string in a test document, renders the same template with
`DomRenderTemplate`, and asserts adoption of the original element, restoration of `7`, removal of
the hydration attribute, and a later update after `RefSubject.set`. Test static SSR separately:
`StaticHtmlRenderTemplate` intentionally omits interactive hydration metadata.

## Keep public type contracts executable

Runtime tests cannot detect an erased error or service channel. Repository `.type-test.ts` files use
exact equality and intentional negative checks:

```ts
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import type * as Fx from "@typed/fx/Fx";
import { html, type RenderTemplate } from "@typed/template";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
class Service extends Context.Service<Service, { readonly value: string }>()("docs/Service") {}
const value = Effect.gen(function* () {
  yield* Service;
  return yield* Effect.fail("failed" as const);
});
const view = html`<p>${value}</p>`;
type _Errors = Assert<Equal<Fx.Error<typeof view>, "failed">>;
type _Services = Assert<Equal<Fx.Services<typeof view>, Service | Scope.Scope | RenderTemplate>>;
// @ts-expect-error nested failures must remain visible
const _erased: Fx.Fx<unknown, never, Fx.Services<typeof view>> = view;
```

An unused `@ts-expect-error` fails the type test. Add the same style of check for `many` keys,
hydration codecs, and router registration requirements.
