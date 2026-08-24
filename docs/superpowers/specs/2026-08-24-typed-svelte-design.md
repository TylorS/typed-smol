# `@typed/svelte` bidirectional integration design

## Goal

Prototype one package that supports both framework boundaries:

1. A Svelte component can be rendered as a Typed template value with reactive props, Svelte stores, SSR, and client hydration.
2. A Typed template can be rendered inside a Svelte element through `{@attach ...}` using an application-owned `ManagedRuntime`.

The prototype should establish lifecycle and renderer contracts before optimizing packaging or adding broad convenience APIs.

## Public shape

```ts
import * as Svelte from "@typed/svelte";

const island = Svelte.view(Counter, props);

const client = island.pipe(
  render(document.body),
  Fx.drain,
  Effect.provide(Layer.merge(DomRenderTemplate.using(document), Svelte.Dom)),
);

const server = renderToHtmlString(island).pipe(
  Effect.provide(Layer.merge(HtmlRenderTemplate, Svelte.Html)),
);
```

`view` accepts a Svelte component plus plain, `Effect`, `Stream`, or `Fx` props. It requires a `SvelteRender` service. `Dom` and `Html` are the initial implementations of that service.

Store adapters are intentionally honest about Svelte's synchronous store contract:

```ts
const readable = yield * Svelte.toReadable(source, initial);
const writable = yield * Svelte.toWritable(refSubject);
```

The prototype adapters accept non-failing Typed sources. Typed failures do not have a faithful representation in a Svelte `Readable<A>` or `Writable<A>` and will not be silently discarded.

The reverse direction is built around a reusable runtime:

```svelte
<script lang="ts">
  import { attachment } from "@typed/svelte";
  import { counterView, runtime } from "./typed.js";
</script>

<div {@attach attachment(runtime, counterView)}></div>
```

The caller creates the `ManagedRuntime` with `DomRenderTemplate.using(document)` and all services required by the view. The attachment starts one scoped render fiber. Cleanup interrupts that fiber but never disposes the runtime, so one runtime can serve many attachments and outlive individual Svelte components.

## Svelte inside Typed

`view` always renders one stable host:

```html
<typed-svelte style="display: contents">...</typed-svelte>
```

Both renderers use the same Typed template strings so Typed SSR and hydration agree on structure.

The DOM renderer mounts one internal Svelte bridge component. Props flow through one Svelte store. Later Typed emissions update the store instead of remounting the component, preserving Svelte local state, transitions, bindings, and context. Closing the owning Typed scope unsubscribes from props and calls Svelte `unmount`.

During Typed hydration the renderer calls Svelte `hydrate` against the existing host. The dynamic Typed child part remains inert on the client so it does not delete Svelte's server output before the nested hydration begins.

Svelte hydrates a renderer-owned inner `<typed-svelte-root style="display: contents">`. Typed's dynamic range markers remain outside that inner target, so Svelte sees its own hydration marker as the first child and can reuse the server nodes instead of silently mounting a duplicate subtree.

The HTML renderer takes the first props emission and calls Svelte's server `render` API for the same internal bridge. Its body is inserted through `HtmlRenderEvent`, the renderer-owned custom-integration transport. `Html.using({ onHead })` can collect `<svelte:head>` output; body rendering does not guess where an application owns its document head.

`idPrefix`, Svelte context, intro/recovery/error transforms, and outro cleanup are forwarded where the corresponding Svelte API supports them. Applications rendering multiple islands that use `$props.id()` should provide stable, distinct prefixes.

## Typed inside Svelte

`attachment(runtime, view)` returns a Svelte `Attachment<HTMLElement>`.

- Attach: run `render(view, element)` as a scoped effect through the supplied `ManagedRuntime`.
- Reactive attachment replacement: Svelte calls cleanup for the old attachment, which interrupts the old render, then starts the new one.
- Detach: interrupt the render fiber so Typed scopes and finalizers run.
- Runtime ownership: never create or dispose the supplied runtime.

Attachments do not run during Svelte SSR. This boundary is a client island by design; server rendering Typed inside Svelte would need a separate Svelte SSR primitive rather than pretending an attachment participates in SSR.

## Error and lifetime rules

- Errors from `view` props stay in the Typed error channel.
- The Svelte mount is created only after the first props value.
- A props stream that completes leaves the last Svelte view mounted until the Typed scope closes.
- A props failure tears down the Svelte mount and fails the Typed render.
- Attachment render errors remain on the runtime fiber. The prototype does not invent a second callback error channel.
- Svelte store adapters support `E = never`; a future explicit `Exit` or `Result` adapter can preserve failures.

## Prototype limits

- The `display: contents` custom host is not valid in every parser context, notably table internals and SVG. Those contexts need a future anchor/range transport.
- The HTML renderer is first-value SSR, not streaming Svelte SSR.
- The reverse attachment is client-only.
- The internal Svelte bridge is packaged as Svelte source, so consumers need normal Svelte-aware tooling.

## Acceptance checks

- Reactive props update without remounting or losing Svelte local state.
- Typed scope closure unmounts Svelte exactly once.
- Server output contains Svelte body and exposes head output.
- Browser hydration reuses server DOM without warnings and remains reactive.
- Readable/writable adapters synchronize across the boundary and stop on scope closure.
- Svelte attachment syntax renders Typed content, finalizes it on replacement/detach, and leaves `ManagedRuntime` usable.
- Build output contains JavaScript, declarations, and the internal `.svelte` bridge.
