# `@typed/react` integration

Date: 2026-08-24

## Goal

Add an optional `@typed/react` package with two explicit ownership directions:

1. `view(...)` embeds a React subtree in a Typed template. Typed owns the document, route, Effect scope, host element, server response, and state handoff. React owns only the descendants of its host.
2. `attachment(...)` embeds a Typed template in a React-owned host. React owns the host element. A caller-supplied `ManagedRuntime` provides the Typed program's services, while the attachment owns and interrupts only its mounted Typed fiber.

The first prototype must cover reactive React inputs, client rendering, hydration, streaming SSR, build-time static generation, static-only views, and the reverse browser attachment. It must prove these modes through package-level Node and real-browser tests.

## Non-goals

- No React Router integration. `@typed/router` remains the owner when Typed hosts React.
- No React Server Components or Flight protocol.
- No partial prerender/resume support in the first prototype.
- No island manifest, component-name registry, dynamic-import generator, or lazy visibility/interaction activation.
- No edge/Web-Stream renderer in the first prototype. Streaming SSR and SSG use React's dedicated Node stream APIs.
- No general `ForeignView` protocol in `@typed/template` unless the prototype proves a missing core capability that cannot remain package-local.
- No implicit treatment of arbitrary `ReactNode` values as `@typed/template` `Renderable` values.
- No automatic serialization of arbitrary React props. Hydratable state composes through the existing schema-backed `RefSubject.hydrate` / `hydrateAll` protocol.
- No reverse-direction React SSR component. The first reverse bridge is an attachment ref for a browser-owned host; it can hydrate pre-existing Typed markup because Typed's normal `render` path already attempts hydration.
- No package-owned global runtime. A reverse attachment borrows the caller's `ManagedRuntime` unless a later, separately named owned-runtime API is designed.

## Baseline

- `react` and `react-dom`: peer range `>=19.2.0 <20`, tested with `19.2.8`.
- `@types/react`: tested with `19.2.18`.
- `@types/react-dom`: tested with `19.2.5`.
- Effect: the workspace catalog version, currently `4.0.0-rc.111`.
- TypeScript: the workspace catalog version, currently `7.0.2`.
- Browser tests: the workspace Playwright/Vitest Chromium setup.

React 19.2 is required because the reverse bridge uses ref cleanup functions. React's root APIs also provide the required multiple-root, `identifierPrefix`, repeated `root.render`, and `root.unmount` contracts. Streaming SSR uses `renderToPipeableStream`; SSG uses `prerenderToNodeStream`.

## Ownership and boundaries

`@typed/react` is an adapter package. `@typed/template` must not depend on React, and the `@typed/react` root export must not import `react-dom/client`, `react-dom/server`, `react-dom/static`, or Node built-ins.

The package has these public entry points:

- `@typed/react` — `view`, `attachment`, renderer service/types, errors, and public options.
- `@typed/react/Client` — browser `ReactRender` Layer using `createRoot` and `hydrateRoot`.
- `@typed/react/Server` — Node streaming `ReactRender` Layer using `renderToPipeableStream`.
- `@typed/react/Static` — Node SSG `ReactRender` Layer using `prerenderToNodeStream`.

Applications explicitly provide one React renderer Layer wherever they provide `DomRenderTemplate`, `HtmlRenderTemplate`, or `StaticHtmlRenderTemplate`. This keeps browser and Node dependencies out of the wrong bundle.

## Why the adapter is renderer-backed

`@typed/template` already models templates as `Fx<RenderEvent, E, R>` selected through the `RenderTemplate` service. `HtmlRenderEvent` is a renderer-owned transport intended for integrations, and the HTML renderer preserves a nested stream until its event with `last: true`. These are the correct seams for React output.

Three alternatives are rejected:

1. Returning a client-created `DomRenderEvent` directly cannot obtain the existing server host reliably during Typed hydration.
2. Adding `ReactNode` to core `Renderable` would make `@typed/template` depend on React and collide with the current recursive handling of ordinary objects.
3. Adding a framework-generic foreign-renderer protocol to template core is premature. The package-local host/ref/content composition is sufficient for the prototype.

## Public `view` surface

The primary input accepts a React node directly or one produced by Effect, Stream, or Fx:

```ts
export type ReactNodeInput<E = never, R = never> =
  | React.ReactNode
  | Effect.Effect<React.ReactNode, E, R>
  | Stream.Stream<React.ReactNode, E, R>
  | Fx.Fx<React.ReactNode, E, R>;

export type ViewMode = "hydrate" | "client" | "static";

export interface ViewOptions<EH = never, RH = never> {
  readonly mode?: ViewMode;
  readonly identifierPrefix?: string;
  readonly hydration?: RefSubject.HydrationRef<EH, RH>;
  readonly onCaughtError?: ReactClient.RootOptions["onCaughtError"];
  readonly onRecoverableError?: ReactClient.RootOptions["onRecoverableError"];
  readonly onUncaughtError?: ReactClient.RootOptions["onUncaughtError"];
}

export function view<E, R, EH = never, RH = never>(
  input: ReactNodeInput<E, R>,
  options?: ViewOptions<EH, RH>,
): Fx.Fx<
  RenderEvent,
  E | EH | ReactRenderError,
  R | RH | Scope.Scope | RenderTemplate | ReactRender
>;
```

`mode` defaults to `"hydrate"`.

Input normalization checks Fx, Effect, and Stream protocols explicitly. Every other value, including React arrays and React element objects, is one React node emission. It must not recursively interpret React element properties.

The constructors remain one `view` API in this prototype. The three modes are a small closed union with exact semantics, not a general option matrix.

## Rendering time and activation are separate axes

The supplied renderer Layer controls when HTML is produced:

| Layer          | Server/build behavior                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| `Client.layer` | No HTML transport. Mount or hydrate inside the Typed host ref.                  |
| `Server.layer` | Start piping at React `onShellReady`; stream each string chunk into Typed HTML. |
| `Static.layer` | Wait for React Suspense data and emit the completed prerender stream.           |

The per-view mode controls whether HTML exists and whether the browser activates it:

| Mode      | Server/Static Layer | Client Layer                                            |
| --------- | ------------------- | ------------------------------------------------------- |
| `hydrate` | Render React HTML   | `hydrateRoot`; later input emissions call `root.render` |
| `client`  | Emit no React HTML  | `createRoot`; every input emission calls `root.render`  |
| `static`  | Render React HTML   | Do nothing; no React root is created                    |

This supports mixed pages without conflating SSG with non-interactivity. A build can use `Static.layer` while individual views are either hydratable or permanently static.

An application that uses `StaticHtmlRenderTemplate` removes Typed hydration metadata globally. In that configuration, only `static` React views are valid. Build-time SSG followed by client hydration instead uses normal `HtmlRenderTemplate` plus `Static.layer`, preserving the Typed host/ref metadata.

## Typed host template

`view` returns an ordinary Typed template fragment with one real React host:

```ts
html`<div data-typed-react-root=${mode} style="display: contents" ref=${composedRef}>
  ${renderer.content(nodes, options)}
</div>`;
```

The prototype intentionally uses a real `div` with `display: contents` so React always receives an `HTMLElement` without adding a layout box. SVG, MathML, table-internal placement, custom host tags, shadow roots, and caller-supplied host attributes are deferred.

The HTML renderer's Typed node boundary comments may surround React's server output inside this host. Browser tests must prove that React 19.2 hydrates successfully with those non-React comments present. If it does not, the implementation must stop and revise the host contract rather than suppressing React hydration errors or patching parser behavior.

The ref is the only DOM handoff. No global query selector, host registry, or manual traversal identifies the React root.

## Hydratable state composition

`ViewOptions.hydration` accepts one existing `HydrationRef`, commonly from `RefSubject.hydrate` or `RefSubject.hydrateAll`.

`view` composes that ref with the client renderer's mount ref while preserving the original `HydrationRefTypeId` metadata. On the server, `HtmlRenderTemplate` sees the protocol and writes its schema-encoded attributes onto the React host. In the browser, the composed ref:

1. runs the hydration ref to decode and install the client state;
2. waits for that initial hydration effect to complete;
3. starts the React root subscription in the current Typed scope.

The React subtree should derive its first node from the hydrated RefSubject when server/client equality matters:

```ts
const count = yield * RefSubject.hydrate(Schema.Number, initialCount);

return React.view(
  Fx.map(count, (value) => React.createElement(Counter, { value })),
  { mode: "hydrate", hydration: count },
);
```

The integration does not invent a second prop serializer.

## Client renderer

`Client.layer` implements renderer content as a single `null` emission. During Typed hydration, the existing node-part updater ignores that first client emission, preserving React's server HTML. The host ref then performs React activation.

For `hydrate`, the first React node emission calls `hydrateRoot(host, node, rootOptions)`. For `client`, it calls `createRoot(host, rootOptions)` followed by `root.render(node)`. For `static`, it neither subscribes to the input nor creates a root.

Every later input emission calls `root.render(node)` on the same root. The adapter never recreates the root merely because props changed, so compatible React component state is preserved.

The mount effect forks the input observation into the current Typed `Scope` and returns after startup. It registers `root.unmount()` as a finalizer on that scope. This is required even when the input Fx completes after its first value: the React root lives until the Typed view is removed.

Root option callbacks are passed through. React errors delivered through `onCaughtError`, `onRecoverableError`, and `onUncaughtError` remain callback notifications because React does not expose them as a synchronous Effect failure channel.

## Streaming server renderer

`Server.layer(options?)` uses React's Node streaming API. It takes exactly the first React node emission for each view and renders it as one server snapshot.

For `hydrate` and `static` modes:

1. Call `renderToPipeableStream(node, options)` with the view's `identifierPrefix` and Layer-level `nonce`, `progressiveChunkSize`, and `onError` policy.
2. Pipe into a `PassThrough` only from `onShellReady`.
3. Set UTF-8 string decoding on the stream so a multi-byte code point split across Buffer chunks is not corrupted.
4. Emit every non-final string as `HtmlRenderEvent(chunk, false)`.
5. Emit exactly one terminal `HtmlRenderEvent("", true)` when the stream ends.
6. On Typed scope interruption, call React's `abort()` and destroy the bridge stream.

For `client` mode, emit only the terminal empty event. An input that completes without a node also emits one terminal empty event so the surrounding Typed HTML stream can continue.

`onShellError` fails with `ReactRenderError`. React's recoverable `onError` callback is reported through the Layer option but does not fail a stream whose shell remains valid.

The integration does not ask React to emit bootstrap scripts. The Typed application owns its document and client entry. React may still emit its inline streaming/Suspense instructions inside the host; a Layer-level CSP nonce is forwarded when configured.

## Static renderer

`Static.layer(options?)` uses `prerenderToNodeStream`. It takes the first React node emission and waits for React Suspense data before the API resolves, then converts the returned `prelude` Node stream into the same `HtmlRenderEvent` chunk protocol.

An `AbortController` is tied to the Typed scope so interruption aborts prerendering and destroys any obtained stream. `client` mode emits no React HTML. `hydrate` and `static` modes emit the completed prerender output; client activation is determined later by `Client.layer` and the view mode.

Static generation does not claim progressive delivery: React's prerender API intentionally waits for all content. The test must distinguish this from `Server.layer`, whose fallback shell is observable before delayed content resolves.

## Renderer service

The root package defines one Context service with two package-internal operations exposed through a stable public type:

```ts
export interface ReactRenderService {
  readonly content: <E, R>(
    nodes: Fx.Fx<React.ReactNode, E, R>,
    options: NormalizedViewOptions,
  ) => Fx.Fx<RenderEvent | null, E | ReactRenderError, R | Scope.Scope>;

  readonly mount: <E, R>(
    nodes: Fx.Fx<React.ReactNode, E, R>,
    options: NormalizedViewOptions,
  ) => (host: HTMLElement) => Effect.Effect<void, E | ReactRenderError, R | Scope.Scope>;
}

export class ReactRender extends Context.Service<ReactRender, ReactRenderService>()(
  "@typed/react/ReactRender",
) {}
```

`NormalizedViewOptions` is internal. Browser and Node entry points construct Layers for this service; applications do not implement it in the first prototype.

## Reverse attachment

The reverse bridge is a React 19 ref callback:

```ts
export interface AttachmentOptions<E> {
  readonly onExit?: (exit: Exit.Exit<void, E>) => void;
}

export function attachment<E, R, ER>(
  runtime: ManagedRuntime.ManagedRuntime<R, ER>,
  template: Fx.Fx<RenderEvent | null, E, R | Scope.Scope>,
  options?: AttachmentOptions<E | ER>,
): React.RefCallback<HTMLElement>;
```

Usage:

```ts
const runtime = ManagedRuntime.make(
  AppLayer.pipe(Layer.provideMerge(DomRenderTemplate.using(document))),
);

const typedAttachment = attachment(runtime, typedTemplate);

function ReactPanel() {
  return React.createElement("div", { ref: typedAttachment });
}
```

For a non-null host, the attachment constructs:

```ts
Effect.scoped(Fx.drain(render(template, host)));
```

and starts it with `runtime.runCallback`. The callback returned by `runCallback` becomes the React ref cleanup function, so React unmount interrupts the Typed fiber. Interruption closes the render scope, removes event listeners, stops reactive subscriptions, and runs template finalizers.

The `ManagedRuntime` is borrowed:

- Attachment cleanup does not call `runtime.dispose()`.
- Multiple attachments may share one runtime and its Layer-built services.
- The caller disposes the runtime when the surrounding React application or ownership boundary ends.
- Tests must prove the runtime is still usable after one attachment unmounts.

The attachment host is exclusive: React must not also reconcile ordinary React children inside the same element while Typed is mounted. The initial prototype exports the low-level stable callback constructor only. A `useAttachment` hook is deferred until dependency and callback update semantics are designed; callers can memoize `attachment(...)` when constructing it inside a React component.

## Errors

`ReactRenderError` is a tagged public error containing:

- phase: `"server-shell" | "server-stream" | "static-prerender" | "static-stream"`;
- the original unknown cause.

The input Effect/Fx error `E`, hydration error `EH`, and `ReactRenderError` remain visible on `view`'s Fx error channel. Server recoverable rendering errors that React handles after producing a valid shell are reported through the configured callback and do not become terminal `ReactRenderError`s.

`attachment` cannot return an Effect error through React's ref type. Its terminal result is available through `AttachmentOptions.onExit`. If no callback is supplied, Effect's ManagedRuntime runner retains its normal reporting behavior.

## Package and file structure

Create these focused files:

- `packages/react/package.json` — exports, peer/runtime/dev dependencies, scripts.
- `packages/react/tsconfig.json` — library build with DOM and Node types needed by exported subpaths.
- `packages/react/tsconfig.type-tests.json` — public error/service inference checks.
- `packages/react/vitest.config.ts` — Node SSR/SSG and contract tests.
- `packages/react/vitest.browser.config.ts` — real Chromium client/hydration/attachment tests.
- `packages/react/src/index.ts` — root public exports only.
- `packages/react/src/ReactRender.ts` — service and normalized internal contracts.
- `packages/react/src/View.ts` — input normalization, host template, hydration-ref composition.
- `packages/react/src/Attachment.ts` — ManagedRuntime-backed React ref callback.
- `packages/react/src/Client.ts` — client Layer.
- `packages/react/src/Server.ts` — Node streaming Layer and stream bridge.
- `packages/react/src/Static.ts` — Node prerender Layer.
- `packages/react/src/ReactRenderError.ts` — tagged error.
- `packages/react/src/__tests__/...` — Node, browser, and type tests split by behavior.
- `packages/react/README.md` — ownership rules, mode matrix, both direction examples.

Update the workspace catalog with tested React and React type versions, the lockfile, and the root TypeScript project references. No existing package gains a React dependency.

## Dependencies

Runtime dependencies:

- `@typed/fx: workspace:*`
- `@typed/template: workspace:*`
- `effect: catalog:`

Peer dependencies:

- `react: >=19.2.0 <20`
- `react-dom: >=19.2.0 <20`

Development dependencies include the catalog versions of React, React DOM, their type packages, TypeScript, Vitest, Playwright browser provider, Playwright, and Node types.

## Testing and acceptance

### Type contracts

- A plain React node produces no new error or service requirements beyond `Scope`, `RenderTemplate`, and `ReactRender`.
- Effect, Stream, and Fx inputs preserve their error and service channels.
- A supplied HydrationRef adds its error and hydration services.
- `attachment` accepts a runtime that provides every non-Scope template requirement and exposes `E | ER` through `onExit`.
- Browser, Server, and Static entry points can be imported independently without pulling a sibling environment entry point into their emitted JavaScript.

### Client browser

- `client` mounts an initially empty host with `createRoot`.
- A reactive Fx input updates props through the same root and preserves component-local React state.
- Removing the Typed view calls React effect cleanup exactly once through `root.unmount`.
- `static` creates no React root or input subscription.

### SSR and hydration browser path

- Node rendering with `Server.layer` produces a full Typed document containing the React host and React HTML.
- Browser rendering with `Client.layer` and the same view calls `hydrateRoot`, not `createRoot`.
- Typed boundary comments inside the host do not produce React recoverable hydration errors. If they do, the host design must change before acceptance.
- Schema-backed RefSubject state is decoded on the host before the React root receives its first client node.
- A React event works after hydration, and later Fx prop updates preserve React state.
- Scope closure unmounts the hydrated root.

### Streaming SSR

- A React Suspense fallback chunk is observable before a controlled Promise resolves.
- Resolved content and React's continuation instructions arrive before the terminal event.
- Typed markup following the React view is emitted after the React view's terminal event.
- Interruption calls React `abort` and closes the Node bridge stream.
- Split UTF-8 byte sequences survive chunk conversion.

### SSG

- `Static.layer` waits for controlled Suspense data and emits resolved content without progressive fallback delivery.
- `hydrate` SSG output hydrates under `Client.layer` when outer Typed hydration metadata is preserved.
- `static` SSG output remains inert under `Client.layer`.
- `client` mode omits React HTML from SSG output.
- Prerender interruption aborts through the scope-owned AbortController.

### Reverse attachment

- A React root mounts an empty host whose attachment renders a Typed template.
- Typed RefSubject updates change DOM inside the React-owned host.
- React unmount interrupts the Typed fiber and runs one Typed finalizer.
- The shared ManagedRuntime remains usable after attachment cleanup.
- Explicit runtime disposal releases Layer resources after every attachment is gone.

### Validation commands

- focused Node tests for `@typed/react`;
- focused Chromium tests for `@typed/react`;
- package type tests and build;
- package formatting/lint;
- root TypeScript project-reference build;
- `git diff --check`.

Existing unrelated workspace failures must be reported separately from failures introduced by this package.

## Delivery sequence

Implementation should proceed as independently testable vertical slices:

1. Package contract, `ReactRender`, host template, client-only `view`, reactive props, and unmount.
2. ManagedRuntime-backed reverse `attachment` and lifecycle tests.
3. Buffered single-chunk server proof using the renderer-owned HTML transport, followed immediately by the streaming Node bridge.
4. Full SSR-to-browser hydration with HydrationRef composition.
5. SSG renderer and mixed `hydrate` / `client` / `static` modes.
6. Package export, type-contract, README, and workspace validation.

Each slice must remain working before the next mode is added. The prototype is not complete until the real browser hydration and streaming timing tests pass.
