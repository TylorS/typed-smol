# Callable and Named `RefSubject` Hydration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `RefSubject.hydrate` return one callable state/ref value, add safe scalar named hydration attributes with scope-owned live synchronization, preserve grouped unnamed hydration, and teach `@typed/template` to render and consume the expanded protocol correctly.

**Architecture:** `@typed/fx` remains the sole owner of hydration schemas, member composition, DOM initialization, and named synchronization. A hydration ref exposes a list of SSR attribute entries instead of one hard-coded value. `@typed/template` only recognizes that protocol, serializes the entries safely, runs the ref once before other reactive parts, and treats a callable hydrated state as an `Fx` everywhere outside `ref`.

**Tech Stack:** TypeScript, Effect v4, `@typed/fx`, `@typed/template`, Vitest, happy-dom, pnpm, oxfmt, oxlint.

**Spec:** [`docs/superpowers/specs/2026-08-23-ui-components-design.md`](../specs/2026-08-23-ui-components-design.md)

## Global Constraints

- This is the prerequisite plan, not the complete `@typed/ui` restoration.
- Do not add `DataAttr`, a second hydration primitive, reactive property spreads for hydration, or `.hydrateFromElement` compatibility aliases.
- Do not touch `packages/ui` in this plan. `Dom.composeRefs` is the first consumer in the following substrate plan, where it can preserve the protocol deliberately.
- Do not change the existing `Link` or `HttpRouter` behavior.
- Preserve the current user-owned `pnpm-lock.yaml`, `docs/`, and `examples/vdom-bench/` worktree changes.
- Use `Effect.all(effects, UNBOUNDED)` for every independent member phase named by the spec. Do not replace it with templating fan-out or nested per-field subscriptions.
- Do not commit unless the user explicitly asks for a commit.
- The Baseline 2026 browser re-check is not needed for this slice because it introduces no native UI capability. Perform that re-check at the start of the native UI substrate/widget plan.

---

## Task 1: Make the hydrated state itself callable

**Files:**

- Modify: `packages/fx/src/RefSubject/Hydration.ts`
- Modify: `packages/fx/src/RefSubject/RefSubject.ts`
- Modify: `packages/fx/src/RefSubject/__tests__/Hydration.test.ts`
- Create: `packages/fx/src/RefSubject/__tests__/Hydration.type-test.ts`

### Interfaces

Replace the single-string SSR protocol and `.hydrateFromElement` wrapper with these public shapes:

```ts
export interface HydrationAttribute {
  readonly name: string;
  readonly value: string;
}

export interface HydrationElement {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

export interface HydrationRef<E = never, R = never> {
  (element: HydrationElement): Effect.Effect<void, never, R | Scope.Scope>;
  readonly [HydrationRefTypeId]: {
    readonly members: ReadonlyArray<HydrationMember>;
    readonly server: Effect.Effect<void>;
    readonly toAttributes: Effect.Effect<ReadonlyArray<HydrationAttribute>, E, R>;
  };
}

export interface HydratedRefSubject<A, E = never, R = never, RH = R>
  extends RefSubject<A, E, R>, HydrationRef<E, RH> {}
```

Update `HydratedRefSubject.HydrationError` and `.HydrationServices` to infer directly from `HydrationRef`, with no property lookup:

```ts
export type HydrationError<T> = T extends HydrationRef<infer E, any> ? E : never;
export type HydrationServices<T> = T extends HydrationRef<any, infer R> ? R : never;
```

### Steps

- [ ] Add failing runtime assertions to the first hydration test:

```ts
assert.strictEqual(typeof ref, "function");
assert.strictEqual(RefSubject.isHydrationRef(ref), true);
assert.strictEqual(RefSubject.isRefSubject(ref), true);
assert.strictEqual(Fx.isFx(ref), true);
assert.strictEqual(yield * ref, 1);
yield * RefSubject.set(ref, 2);
assert.strictEqual(yield * ref, 2);
```

- [ ] Replace every `ref.hydrateFromElement(element)` call in the focused `@typed/fx` tests with `ref(element)`. Replace metadata access with `ref[HydrationRefTypeId].toAttributes` and assert the unnamed entry is:

```ts
[
  {
    name: RefSubject.HYDRATION_ATTRIBUTE,
    value: '{"version":1,"values":[7]}',
  },
];
```

- [ ] Add a compile-time contract in `Hydration.type-test.ts` showing the returned success type extends both `RefSubject.RefSubject<number, ...>` and `RefSubject.HydrationRef<...>`, and that it remains valid input to `RefSubject.set` and an `Fx` combinator.

- [ ] Run the new tests before implementation and confirm they fail because `HydratedRefSubject` is not callable, `.hydrateFromElement` still exists, and `toAttributes` does not exist:

```bash
corepack pnpm --filter @typed/fx test -- src/RefSubject/__tests__/Hydration.test.ts
corepack pnpm --filter @typed/fx test:types
```

- [ ] In `hydrate`, build the specialized hydration function once and put the concrete `RefSubject` instance in its prototype chain:

```ts
const hydrationRef = makeHydrationRef([member]);
return Object.setPrototypeOf(hydrationRef, ref) as HydratedRefSubject<
  Schema.Schema.Type<S>,
  E | Schema.SchemaError,
  never,
  Schema.Codec.DecodingServices<S> | Schema.Codec.EncodingServices<S>
>;
```

This is intentionally not `Object.assign(ref, ...)`: the returned value must remain directly callable. Putting `ref` in the function's prototype chain preserves its bound mutation methods, effects, version/subscriber state, `FxTypeId`, `RefSubjectTypeId`, and `instanceof RefSubjectImpl` behavior without creating a proxy or a second subscription owner.

- [ ] Broaden the `RefSubject.isRefSubject` guard to accept branded objects and branded functions:

```ts
export function isRefSubject(value: any): value is RefSubject<any, any, any> {
  return (
    value !== null &&
    value !== undefined &&
    (typeof value === "object" || typeof value === "function") &&
    value[RefSubjectTypeId] === RefSubjectTypeId
  );
}
```

- [ ] Change `makeHydrationRef` metadata from `toAttribute` to `toAttributes`. Keep this task's unnamed encoding semantics identical except for returning the `{ name, value }` list.

- [ ] Extend the test element helper with `setAttribute`, even though unnamed hydration must never call it. Track writes and assert unnamed hydration removes only `data-typed-refsubject`, performs no live DOM write, and has zero subscribers after initial hydration.

- [ ] Re-run the focused runtime and type tests until both pass.

---

## Task 2: Add named scalar attributes and minimal live synchronization

**Files:**

- Modify: `packages/fx/src/RefSubject/Hydration.ts`
- Modify: `packages/fx/src/RefSubject/__tests__/Hydration.test.ts`
- Modify: `packages/fx/src/RefSubject/__tests__/Hydration.type-test.ts`

### Interfaces

Expose one options type but enforce the encoded-string requirement through overloads:

```ts
export interface HydrateOptions<A> extends RefSubjectOptions<A> {
  readonly name?: string;
}

type HydrationInput<A, E, R> = A | Effect.Effect<A, E, R> | Stream.Stream<A, E, R> | Fx.Fx<A, E, R>;

type HydrateEffect<S extends Schema.Top, E, R> = Effect.Effect<
  HydratedRefSubject<
    Schema.Schema.Type<S>,
    E | Schema.SchemaError,
    never,
    Schema.Codec.DecodingServices<S> | Schema.Codec.EncodingServices<S>
  >,
  never,
  R | Scope.Scope
>;

export function hydrate<S extends Schema.Codec<any, string, any, any>, E = never, R = never>(
  schema: S,
  effect: HydrationInput<Schema.Schema.Type<S>, E, R>,
  options: HydrateOptions<Schema.Schema.Type<S>> & { readonly name: string },
): HydrateEffect<S, E, R>;

export function hydrate<S extends Schema.Top, E = never, R = never>(
  schema: S,
  effect: HydrationInput<Schema.Schema.Type<S>, E, R>,
  options?: HydrateOptions<Schema.Schema.Type<S>> & { readonly name?: undefined },
): HydrateEffect<S, E, R>;
```

Keep `HydrationInput` and `HydrateEffect` private; they only remove duplication from the overloads. Do not weaken the named overload to `Schema.Top` or `any` at the public boundary.

Keep each erased member as data plus the two environment signals. Derive encoding, decoding,
failure delivery, sampling, attribute writes, and synchronization in shared helpers instead of
allocating a capability bundle for every member:

```ts
interface HydrationMember {
  readonly schema: Schema.Top;
  readonly attributeName: string | undefined;
  readonly ref: RefSubject<any, any, any>;
  readonly server: Effect.Effect<void>;
  readonly hydrate: (
    value: Effect.Effect<any, Schema.SchemaError>,
  ) => Effect.Effect<void>;
}
```

The callable `run` and `toEffect` delegates remain necessary: they read
`CurrentComputedBehavior` at render time, after the underlying `RefSubject` has captured its
construction services. Do not add a second eager behavior check in `hydrate`.

### Name policy

Use one helper in `@typed/fx`, because that package cannot depend upward on `@typed/template`:

```ts
function toHydrationAttributeName(name: string): string {
  const attributeName = `data-${name}`.toLowerCase();
  if (!name || attributeName === HYDRATION_ATTRIBUTE || hasInvalidAttributeCharacter(attributeName)) {
    throw new TypeError(`Invalid hydration attribute name: ${name}`);
  }
  return attributeName;
}

function hasInvalidAttributeCharacter(name: string): boolean {
  return [...name].some((character) => {
    const codePoint = character.codePointAt(0)!;
    return codePoint <= 0x20 ||
      (codePoint >= 0x7f && codePoint <= 0x9f) ||
      `"'/>=<`.includes(character);
  });
}
```

`hasInvalidAttributeCharacter` must apply the same control-character and `"'/>=<` exclusions as the template renderer. Lower-casing makes HTML's case-insensitive attribute identity explicit, so `open` and `OPEN` collide predictably. Reject `typed-refsubject` because it would collide with the reserved unnamed tuple.

### Steps

- [ ] Add type tests proving:

```ts
RefSubject.hydrate(Schema.Number, 1);
RefSubject.hydrate(Schema.NumberFromString, 1, { name: "count" });

// @ts-expect-error named hydration requires a string-encoded codec
RefSubject.hydrate(Schema.Number, 1, { name: "count" });
```

- [ ] Add runtime tests for all named lifecycle cases before implementation:

  - SSR encodes `Schema.NumberFromString` as `{ name: "data-count", value: "7" }`, not JSON.
  - Existing `data-count="7"` decodes to `7`, remains on the element, and does not evaluate the fallback initializer.
  - Missing `data-count` evaluates the initializer, writes its encoded current value once, then synchronizes.
  - `RefSubject.set(state, 8)` changes the attribute to `"8"`.
  - Re-emitting the same encoded value does not call `setAttribute` again.
  - Closing the hydration scope removes the one subscriber; later state changes do not mutate the element.
  - An encode failure fails only the affected state with `Schema.SchemaError` and leaves other named-state subscriptions alive.
  - Unsafe, empty, and reserved names throw `TypeError`.
  - `hydrateAll(a, b)` rejects duplicate normalized names synchronously.

- [ ] Add a mixed-composition test with two unnamed `Schema.Number` states and one named `Schema.NumberFromString` state. Assert `toAttributes` returns, in deterministic order, the unnamed tuple first and named scalar entries in argument order:

```ts
[
  {
    name: "data-typed-refsubject",
    value: '{"version":1,"values":[1,2]}',
  },
  { name: "data-open", value: "1" },
];
```

- [ ] Add a concurrency regression using two initializers that increment a shared `running` count, `yield* Effect.yieldNow`, then decrement it. Serialize them with `hydrateAll(...)[HydrationRefTypeId].toAttributes` and assert `maxRunning === 2`; the current `{ concurrency: 1 }` implementation must produce `1`.

- [ ] Run the focused tests and confirm the named overload, scalar entries, live writes, duplicate detection, and concurrency assertions fail against the current implementation.

- [ ] Implement the two overloads and compute/validate `attributeName` before constructing the returned Effect. Keep `eq` behavior unchanged.

- [ ] Split composed members into `unnamed` and `named` once inside `makeHydrationRef`. Reject duplicate `attributeName` values with:

```ts
throw new TypeError(`Duplicate hydration attribute: ${attributeName}`);
```

- [ ] Keep one versioned JSON tuple codec for `unnamed`. Do not create single-value default attributes and do not put named members into that tuple.

- [ ] Build `toAttributes` as:

  1. all member `server` effects with `UNBOUNDED`;
  2. one unnamed tuple encode, if needed, plus each named sample/encode, all with `UNBOUNDED`;
  3. default tuple entry first, followed by named entries in flattened member order.

- [ ] Implement DOM initialization as independent tasks passed to one `Effect.all(tasks, UNBOUNDED)`:

  - For unnamed members: read the default attribute once; if present, decode the full tuple before setting any state, set or fail all unnamed members with `UNBOUNDED`, and remove the attribute only after successful setting. If absent, run every unnamed `server` effect with `UNBOUNDED`.
  - For each named member: read its scalar attribute; if present, decode and deliver that value; if absent, run its server initializer, sample it, encode it, and set the attribute only when different.
  - Decode and encode failures are delivered to only that named member. One member's handled failure must not cancel another member's initialization.

- [ ] After all initial tasks complete, start named synchronization with `Effect.all(named.map(start), UNBOUNDED)`, where each `start` uses `Effect.forkScoped`. Return after the fibers start; never join the subscriptions.

- [ ] Implement each named member's synchronization with the underlying ref's `run` method and one `Sink`:

```ts
const synchronize = (element: HydrationElement) =>
  ref.run(
    Sink.make(
      () => Effect.void,
      (value) =>
        Effect.matchEffect(Schema.encodeEffect(schema)(value), {
          onFailure: (error) => ref.onFailure(Cause.fail(error)),
          onSuccess: (encoded) =>
            Effect.sync(() => {
              if (element.getAttribute(attributeName) !== encoded) {
                element.setAttribute(attributeName, encoded);
              }
            }),
        }),
    ),
  );
```

Use `initializer.dom(Effect.fail(error))` only for initial hydration decode failures. A later synchronization encode failure must use `ref.onFailure(Cause.fail(error))`; completing the already-resolved hydration deferred would silently lose it.

- [ ] Replace every remaining hydration-local `{ concurrency: 1 }` with the shared:

```ts
const UNBOUNDED = { concurrency: "unbounded" } as const;
```

- [ ] Re-run the focused `@typed/fx` runtime and type tests until they pass.

---

## Task 3: Render complete hydration attribute lists safely in SSR

**Files:**

- Modify: `packages/template/src/Html.ts`
- Modify: `packages/template/src/HtmlChunk.ts`
- Modify: `packages/template/src/__tests__/Html.test.ts`
- Modify: `packages/template/src/__tests__/Html.security.test.ts`

### Steps

- [ ] Update the existing HTML hydration tests to use `ref=${count}`. Add a mixed test:

```ts
const first = yield * RefSubject.hydrate(Schema.Number, 1);
const second = yield * RefSubject.hydrate(Schema.Number, 2);
const open = yield * RefSubject.hydrate(Schema.NumberFromString, 1, { name: "open" });
const ref = RefSubject.hydrateAll(first, second, open);
const output = (yield * getHtmlRenderEvents(html`<section ref=${ref}></section>`)).join("");

expect(output).toContain(
  'data-typed-refsubject="{&quot;version&quot;:1,&quot;values&quot;:[1,2]}"',
);
expect(output).toContain('data-open="1"');
```

- [ ] Retain the static-render assertion: `getStaticHtml(...)` runs `metadata.server` but emits neither unnamed nor named hydration metadata.

- [ ] Add a security regression using a deliberately forged symbol-branded hydration ref whose `toAttributes` contains an attribute name such as `x" onclick="alert(1)`. Assert interactive SSR emits no injected event attribute while still rendering a safe entry. This defends the renderer boundary even though `RefSubject.hydrate` already validates names.

- [ ] Run the focused tests and confirm they fail because `Html.ts` reads `toAttribute` and `HtmlChunk.ts` hard-codes `data-typed-refsubject`:

```bash
corepack pnpm --filter @typed/template test:node -- \
  src/__tests__/Html.test.ts \
  src/__tests__/Html.security.test.ts
```

- [ ] In `Html.ts`, map the interactive `ref` part over the entire list:

```ts
return Fx.unwrap(
  Effect.map(renderable[RefSubject.HydrationRefTypeId].toAttributes, (attributes) =>
    Fx.succeed(HtmlRenderEvent(render(attributes), last)),
  ),
);
```

- [ ] In `HtmlChunk.ts`, replace the ref renderer with a list renderer:

```ts
ref: (builder, attribute, placement) =>
  builder.part(attribute, (value) =>
    addAttributeSpace(renderHydrationAttributes(value), placement),
  ),
```

- [ ] Implement `renderHydrationAttributes` by accepting only arrays of `{ name: string, value: string }`, applying the existing `isSerializableAttributeName` check to every name, rendering values through the existing `renderAttribute`/`renderToEscapedString` path, and joining valid entries with one space. Do not special-case `data-typed-refsubject` in the template package.

- [ ] Re-run the two focused HTML test files until they pass.

---

## Task 4: Preserve callable `Fx` semantics outside `ref`

**Files:**

- Modify: `packages/template/src/Render.ts`
- Modify: `packages/template/src/Html.ts`
- Modify: `packages/template/src/__tests__/Html.test.ts`
- Modify: `packages/template/src/__tests__/Render.test.ts`
- Modify: `packages/template/src/__tests__/contracts.type-test.ts`

### Steps

- [ ] Add failing SSR coverage that uses the exact same callable hydrated state as both `ref` and content:

```ts
const count = yield * RefSubject.hydrate(Schema.Number, 7);
const output = (yield * getHtmlRenderEvents(html`<button ref=${count}>${count}</button>`)).join("");

expect(output).toContain("<!--n_1-->7<!--/n_1-->");
```

- [ ] Add a nested/data-path regression, because both renderers currently discard functions before checking `Fx` in their recursive lifting helpers:

```ts
const count = yield * RefSubject.hydrate(Schema.Number, 7);
const output = yield * getStaticHtml(html`<div .data=${{ count }}>${[count]}</div>`);
expect(output).toContain('data-count="7"');
expect(output).toContain(">7</div>");
```

Use the existing template syntax accepted by the parser; if `.data` serializes differently in current tests, assert its established output rather than changing dataset behavior.

- [ ] Add a DOM renderer test that mounts `html` with the hydrated state in a normal text or attribute position, mutates it with `RefSubject.set`, drains the render queue using the existing test helper, and asserts the DOM updates. This proves the callable is still subscribed as one `Fx` outside `ref`.

- [ ] Add a type contract showing a `HydratedRefSubject` contributes its `Fx` error/services in ordinary render positions and hydration codec services in `ref` position. `Scope.Scope` must remain in the rendered template's services.

- [ ] Run the focused tests and type tests; confirm the nested cases fail because `liftRenderableToFx` switches on `typeof renderable === "function"` first:

```bash
corepack pnpm --filter @typed/template test:node -- \
  src/__tests__/Html.test.ts \
  src/__tests__/Render.test.ts
corepack pnpm --filter @typed/template test:types
```

- [ ] In `Render.ts`, narrow protocol recognition to the callable branch. Do not move `Fx.isFx` ahead of the `typeof` switch, because that would change precedence for non-callable hybrid renderables:

```ts
function liftRenderableToFx<E = never, R = never>(
  renderable: Renderable<unknown, E, R>,
): Fx.Fx<any, E, R> {
  switch (typeof renderable) {
    case "function":
      return Fx.isFx(renderable) ? renderable : Fx.null;
    // Keep the existing undefined, object, and primitive branches unchanged.
  }
}
```

- [ ] Apply the same callable-branch check to the three-argument helper in `Html.ts`, while retaining its current static/dynamic behavior for ordinary functions:

```ts
function liftRenderableToFx<E, R>(
  renderable: Renderable<unknown, E, R>,
  isStatic: boolean,
  propertyAncestors?: ReadonlySet<object>,
): Fx.Fx<any, E, R> {
  switch (typeof renderable) {
    case "function":
      return Fx.isFx(renderable)
        ? takeOneIfNotRenderEvent(renderable)
        : isStatic
          ? Fx.empty
          : Fx.succeed(HtmlRenderEvent(TEXT_START, true));
    // Keep the existing undefined, object, and primitive branches unchanged.
  }
}
```

- [ ] Do not change `matchRenderable` unless its new test fails: its current order already checks `Fx.isFx` before `isFunction`.

- [ ] Re-run the focused runtime and type tests until they pass.

---

## Task 5: Verify hydration priority, one invocation, and scope cleanup end to end

**Files:**

- Modify: `packages/template/src/__tests__/Hydration.test.ts`
- Modify: `packages/fx/src/RefSubject/__tests__/Hydration.test.ts`

### Steps

- [ ] Change the existing view from `ref=${count.hydrateFromElement}` to `ref=${count}` and retain its strongest assertions: the server DOM node is adopted, the fallback initializer is not evaluated, the state hydrates to `7`, reactive attributes never transiently write `0`, and the unnamed attribute is removed.

- [ ] Add an invocation counter around a composed hydration ref without splitting its members:

```ts
const hydration = RefSubject.hydrateAll(first, second, named);
let calls = 0;
const ref = Object.assign(
  (element: RefSubject.HydrationElement) => {
    calls++;
    return hydration(element);
  },
  { [RefSubject.HydrationRefTypeId]: hydration[RefSubject.HydrationRefTypeId] },
);
```

Render once and assert `calls === 1`. This verifies template ref setup does not expand members into extra template subscriptions.

- [ ] Add the complete SSR/client smoke:

  1. server-render one unnamed and one named state on the same host;
  2. hydrate fresh client states from that HTML;
  3. assert the unnamed tuple is removed;
  4. assert the named scalar is retained;
  5. mutate the named state and assert the retained attribute changes;
  6. close only the render scope;
  7. mutate the state again and assert the attribute no longer changes.

- [ ] Assert `subscriberCount` is exactly `0` for the unnamed state and `1` for the named state while the render scope is live, then `0` for the named state after scope closure. Account for any explicit test observers separately; do not loosen this to `> 0`.

- [ ] Add/retain the malformed tuple test proving unnamed tuple decoding is atomic: no unnamed member is partially initialized and the attribute remains when tuple decoding fails. Add a parallel named test proving one malformed scalar does not stop another valid named member.

- [ ] Run the focused end-to-end tests:

```bash
corepack pnpm --filter @typed/fx test -- src/RefSubject/__tests__/Hydration.test.ts
corepack pnpm --filter @typed/template test:node -- src/__tests__/Hydration.test.ts
```

- [ ] Review the implementation for subscription ownership. There must be:

  - no subscription for unnamed hydration;
  - exactly one scope-owned subscription per named member;
  - no member expansion by the template renderer;
  - no subscription that outlives the provided render scope.

---

## Task 6: Document and validate the prerequisite

**Files:**

- Modify: `packages/fx/README.md`
- Modify: `packages/template/README.md`
- Review only: `docs/superpowers/specs/2026-08-23-ui-components-design.md`

### Steps

- [ ] Add one concise `RefSubject` README example covering both lifecycles:

```ts
const count = yield * RefSubject.hydrate(Schema.Number, 0);
const page = yield * RefSubject.hydrate(Schema.NumberFromString, 1, { name: "page" });

html`<section ref=${RefSubject.hydrateAll(count, page)}>${count}</section>`;
```

Document that unnamed state is a consumed tuple with no ongoing subscription; named state is a retained scalar `data-*` attribute with one scope-owned synchronization subscription; and the returned state itself is the DOM ref.

- [ ] Update the template README hydration section to state that symbol-branded hydration refs render all protocol-provided attributes in interactive SSR, run once before ordinary reactive parts, and remain ordinary `Fx` values outside a `ref` part.

- [ ] Search for stale public API references and remove all `.hydrateFromElement`/`.toAttribute` uses from live packages and READMEs:

```bash
rg -n 'hydrateFromElement|\.toAttribute\b' packages
```

The command must return no matches. The approved design spec and this implementation plan may continue to mention the removed spelling when explaining the migration.

- [ ] Run formatting on touched files:

```bash
corepack pnpm exec oxfmt \
  packages/fx/src/RefSubject/Hydration.ts \
  packages/fx/src/RefSubject/RefSubject.ts \
  packages/fx/src/RefSubject/__tests__/Hydration.test.ts \
  packages/fx/src/RefSubject/__tests__/Hydration.type-test.ts \
  packages/template/src/Html.ts \
  packages/template/src/HtmlChunk.ts \
  packages/template/src/Render.ts \
  packages/template/src/__tests__/Html.test.ts \
  packages/template/src/__tests__/Html.security.test.ts \
  packages/template/src/__tests__/Hydration.test.ts \
  packages/template/src/__tests__/Render.test.ts \
  packages/template/src/__tests__/contracts.type-test.ts \
  packages/fx/README.md \
  packages/template/README.md
```

- [ ] Run the complete package checks, not only focused tests:

```bash
corepack pnpm --filter @typed/fx test
corepack pnpm --filter @typed/fx test:types
corepack pnpm --filter @typed/template test:node
corepack pnpm --filter @typed/template test:types
corepack pnpm --filter @typed/template test:browser
corepack pnpm --filter @typed/fx build
corepack pnpm --filter @typed/template build
corepack pnpm exec oxlint \
  packages/fx/src/RefSubject/Hydration.ts \
  packages/fx/src/RefSubject/RefSubject.ts \
  packages/template/src/Html.ts \
  packages/template/src/HtmlChunk.ts \
  packages/template/src/Render.ts
git diff --check
```

- [ ] Review `git diff -- packages/fx packages/template docs/superpowers/plans/2026-08-23-callable-named-refsubject-hydration.md`. Confirm no `packages/ui`, `Link`, `HttpRouter`, lockfile, or benchmark changes were introduced by this plan.

- [ ] Compare the resulting behavior against the spec's “State and hydration,” “Error handling,” and hydration testing sections. Record any environmental test limitation in the handoff; do not weaken an assertion to accommodate it.

## Completion Criteria

- `RefSubject.hydrate(...)` returns one value that is callable, an `Fx`, and a `RefSubject`.
- `.hydrateFromElement` and singular `toAttribute` are gone from live code.
- Unnamed members serialize as one versioned tuple, remove that attribute after successful hydration, and create no subscription.
- Named members require a string-encoded schema, serialize as direct scalar `data-*` values, retain and minimally synchronize those attributes, and stop on scope closure.
- `hydrateAll` rejects duplicate names, groups unnamed members, preserves named entries, invokes once, and uses unbounded member phases.
- DOM and HTML rendering recognize callable `Fx` values before ordinary functions.
- Focused tests, complete package tests, type tests, browser tests, builds, lint, formatting, and `git diff --check` pass, or the handoff names a verified unrelated/environmental limitation.
- The next implementation plan can add `packages/ui/src/Dom.ts`; its `composeRefs` must preserve `HydrationRefTypeId` metadata and still invoke the composed hydration ref once.
