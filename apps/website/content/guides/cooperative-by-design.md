---
title: "Cooperative by design"
summary: "A concept guide to how Typed combines effectful work and DOM cooperation: one push contract and one rendering contract, without ownership fights."
section: "Learning paths"
kind: "concept"
order: -1
---

You are typing a query. A socket pushes updates. Focus moves. A library updates a canvas over time.
UIs are push systems.

`Fx` is where `Effect` and push-based semantics meet.

A pull model can describe what to ask for.
`Fx` describes what keeps arriving, and how that arrival is composed.

## Everything that changes enters as `Fx`

`Fx` is the shared language for different time models:

- a single `Effect` result,
- ongoing event streams,
- and finite/incremental values.

```ts
import { Effect, Stream } from "effect"
import { Fx } from "@typed/fx"

type Issue = { readonly id: string; readonly title: string }
type SearchUnavailable = {
  readonly _tag: "SearchUnavailable"
  readonly reason: string
}

const searchIssues: (query: string) => Effect.Effect<ReadonlyArray<Issue>, SearchUnavailable> = (query) =>
  query === ""
    ? Effect.fail({ _tag: "SearchUnavailable", reason: "query must not be empty" })
    : Effect.succeed([{ id: "i-1", title: `issue for ${query}` }])

// Pull-oriented iterable source: Stream advances this iterator per demand.
const workQueue: Stream.Stream<string, never> = Stream.fromIterable(
  (function* () {
    yield "typed"
    yield "push"
    yield "render"
  })(),
)

const seedIssues: ReadonlyArray<Issue> = [
  { id: "seed-1", title: "Initial issue" },
  { id: "seed-2", title: "Seed issue" },
]

// One-shot effect -> one emission with the same contract.
const byQuery: Fx.Fx<ReadonlyArray<Issue>, SearchUnavailable> =
  Fx.fromEffect(searchIssues("typed"))

// Convert a pull-oriented Stream into the same cooperative contract.
const fromKeys: Fx.Fx<string, never> = Fx.fromStream(workQueue)

// Batch/iterable values -> emissions in order.
const fromValues: Fx.Fx<Issue, never> = Fx.fromIterable(seedIssues)

const liveResults = fromKeys.pipe(
  Fx.map((query) => query.trim()),
  Fx.skipRepeats,
  Fx.switchMapEffect((query) =>
    query === ""
      ? Effect.succeed([] as ReadonlyArray<Issue>)
      : searchIssues(query)
  ),
)
```

`Stream` is the right bridge when upstream work is pull-oriented or backpressured.
Keep demand/buffer policy in `Stream`, then cross into rendering-time behavior with `Fx.fromStream`.
After crossing, `Fx` applies push policies consistently (`switchMapEffect`, buffering, cancellation).

When all change streams are represented as `Fx`, every part of the UI can reuse the same policies:
latest-only replacement, backpressure, cancellation, buffering, and failure handling.
`2 pushes make a push`; your app doesn't need pull loops to stay responsive.

## RenderEvent: capture DOM and streaming HTML at the same boundary

`RenderEvent` is the second contract: not *how often* something changes, but *what kind of output a producer already owns*.

`Fx` handles sequencing and lifecycle.
`RenderEvent` handles whether output is live DOM or serializer-owned HTML chunks.

### DOM-node-based output: `DomRenderEvent`

This is for third-party widgets that expose a real node (or range) that must remain identity-stable.

```ts
import { DomRenderEvent } from "@typed/template/RenderEvent"
import { html } from "@typed/template"
import { Fx } from "@typed/fx"
import { Effect } from "effect"

const mountEditor = (host: HTMLElement): Effect.Effect<void> =>
  Effect.sync(() => {
    host.innerText = "Editor mounted"
  })

const editorHost = (doc: Document): HTMLElement => doc.createElement("div")

const editorEvent: Fx.Fx<DomRenderEvent, never> = Fx.fromEffect(
  Effect.gen(function* () {
    const host = yield* Effect.sync(() => editorHost(document))
    host.id = "article-editor"
    yield* mountEditor(host)
    return DomRenderEvent(host)
  }),
)

const page = html`<section>${editorEvent}</section>`
```

The important part is what is captured: the exact host node and its identity, not a serialized replacement.
Typed owns placement; the external editor keeps its own lifecycle and internals.

### Streaming HTML output: `HtmlRenderEvent`

This is for serializer-owned HTML that must stream in order into another HTML-oriented host.
`HtmlRenderEvent` can carry ordered chunks from any source you already trust to serialize.

```ts
import { HtmlRenderEvent } from "@typed/template/RenderEvent"
import { Fx } from "@typed/fx"

const preview: Fx.Fx<HtmlRenderEvent, never> = Fx.fromIterable([
  HtmlRenderEvent("<article><h2>Saved issue</h2>", false),
  HtmlRenderEvent("<p>Render with a known serializer.</p>", false),
  HtmlRenderEvent("</article>", true),
])
```

This is the critical distinction: the stream can be long, async, and chunked.
The chunks stay ordered, and the final chunk has `last: true`.
No other integration can usually interleave third-party HTML output into a typed render pipeline this way without collapsing it to a single blob or losing completion semantics.

You can compose both kinds in the same renderable surface:

```ts
import { html } from "@typed/template"
import { DomRenderEvent, HtmlRenderEvent } from "@typed/template/RenderEvent"
import { Fx } from "@typed/fx"

const editorPortion: Fx.Fx<DomRenderEvent, never> = Fx.sync(() =>
  DomRenderEvent(document.createElement("section")),
)
const htmlPortion: Fx.Fx<HtmlRenderEvent, never> = Fx.fromIterable([
  HtmlRenderEvent("<article><h2>Saved issue</h2>", false),
  HtmlRenderEvent("<p>Render with a known serializer.</p>", false),
  HtmlRenderEvent("</article>", true),
])

const mixed = html`<main>
  <section id="editor">${editorPortion}</section>
  <article>${htmlPortion}</article>
</main>`
```

`Fx` gives both producers a shared scheduling and cancellation model.
`RenderEvent` keeps each representation honest and non-invasive.

## No ownership wars

Typed templates only own what they render.

It does not own unknown classes, script-added attributes, or listeners it did not declare.
That allows third-party integrations and host-specific scripts to remain active.

```ts
import { html } from "@typed/template"
import { Fx, RefSubject } from "@typed/fx"
import { component } from "@typed/ui/Component"

const StatusStrip = component(function* () {
  const busy = yield* RefSubject.make(false)

  const tone = RefSubject.map(busy, (isBusy) =>
    isBusy ? "status-strip status-strip--saving" : "status-strip"
  )

  return html`
    <section id="status-strip" class=${tone}>
      <p role="status">Changes are tracked.</p>
      <button id="save-all" class="button">Save all</button>
    </section>`
})

// Outside template ownership, external scripts can still annotate.
document.getElementById("save-all")?.classList.add("third-party-pulse")
document.getElementById("save-all")?.setAttribute("data-shortcut", "Cmd+S")
```

The template updates `status-strip` and the declared button contract.
It does not erase externally attached behavior or remove unknown classes because it was never the host of that behavior.

## Lifetimes stay deliberate

`Scope` is where cooperation becomes predictable.

A component owns what is local to that component.
A page-level service can outlive a component and still stay explicit.

```ts
import { Effect } from "effect"
import { EventHandler, html } from "@typed/template"
import { RefSubject } from "@typed/fx"
import { component } from "@typed/ui/Component"

const persistTitle = (title: string): Effect.Effect<void> =>
  Effect.sync(() => {
    if (title.length === 0) {
      return
    }
  })

type Props = { readonly id: string }

const IssueField = component(function* ({ id }: Props) {
  const title = yield* RefSubject.make("")

  const onInput = EventHandler.make((event: InputEvent & { currentTarget: HTMLInputElement }) =>
    RefSubject.set(title, event.currentTarget.value)
  )

  const onBlur = EventHandler.make(() =>
    Effect.gen(function* () {
      const current = yield* title
      yield* persistTitle(current)
    })
  )

  return html`<label for=${id}>Issue title</label>
    <input id=${id} .value=${title} oninput=${onInput} onblur=${onBlur} />`
})
```

When `IssueField` unmounts, local subscriptions and state are released with its scope.
When the page scope closes, broader services are released in the right order.
No global runtime is hidden behind local view code.

## Product-level result

When both contracts stay separate and composable, the app becomes visibly better:

- request work is canceled intentionally, not accidentally,
- stale updates stop overriding current state,
- ownership boundaries stay intact between host, Typed rendering, and external systems.

The product effect is simple: fewer hidden transitions, fewer lost edits, fewer lifecycle leaks.

## Proof through practice

A compact end-to-end pattern:

```ts
import { Effect } from "effect"
import { Fx } from "@typed/fx"

type Issue = { id: string; title: string }
const search = (query: string): Effect.Effect<ReadonlyArray<Issue>, never> =>
  Effect.succeed([{ id: `found-${query}`, title: `Search result: ${query}` }])
const querySource: Fx.Fx<string, never> = Fx.fromIterable(["typed", "push", "render"])

type SearchResult = { readonly phase: "query" | "results"; readonly value: ReadonlyArray<Issue> }

const searchFlow = querySource.pipe(
  Fx.switchMapEffect((query) =>
    search(query.trim()).pipe(
      Effect.map((results) => ({ phase: "results", value: results } as SearchResult)),
    )
  ),
  )

```

```ts
import { HtmlRenderEvent } from "@typed/template/RenderEvent"

const mountHtml = (event: HtmlRenderEvent): void => {
  if (event.last) {
    console.log("final HTML chunk")
  }
}

const mountEditor = (node: HTMLElement): void => {
  node.dataset.mounted = "true"
}

const editorNode: HTMLElement = document.createElement("article")

mountEditor(editorNode)
mountHtml(HtmlRenderEvent("<p>Streaming preview chunk</p>", true))
```

`Fx` makes everything in motion explicit.
`RenderEvent` makes every output representation explicit.
That is `Cooperative by design`. 
