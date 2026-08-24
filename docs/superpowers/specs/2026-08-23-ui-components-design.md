# Restore `@typed/ui` component kit

Date: 2026-08-23
Source: [packages/ui @ 53bca13](https://github.com/TylorS/typed-smol/tree/53bca13f90d50c04f98ef42acc20d066ebcd3869/packages/ui)

## Goal

Rewrite the headless component kit from commit `53bca13` into today’s `packages/ui`, against Effect v4, current `@typed/fx`, and current `@typed/template`. The historical tree is the behavioral reference, not source we check out or edit in place.

Keep today’s `Link` and `HttpRouter` (including `streamingSsrForHttp`). Do not overwrite them.

## Non-goals

- No compiler.
- No `StartupRef`.
- No `Resumability` and no “raw handler closure” diagnostics.
- No custom overlay, JS click-toggle, focus-trap library, or JavaScript positioning engine.
- No fullstack example rewrite in this work.
- No `DataAttr`; named `RefSubject.hydrate` is the only schema-backed `data-*` state channel.

## Browser and platform baseline

The hard minimum is **Baseline 2026** and the support target is only the latest stable release of Chromium, Firefox, and Safari/WebKit. We do not wait for Baseline Widely Available's 30-month window, maintain legacy-browser branches, or ship compatibility polyfills. Users on an unsupported browser must update it.

A capability is eligible when it is Baseline Newly Available no later than 2026 and works in every latest stable target. A capability that exists only in one engine, a preview, or a beta stays out even if its specification is otherwise suitable. Re-check the current WebDX `web-features` data and stable-browser release notes when implementation begins; this document records the support snapshot from 2026-08-23.

Use the platform as the source of truth rather than mirroring native state in JavaScript or `data-*` attributes:

- Native open/closed state uses `:open` for `<details>` and `<dialog>`, and `:popover-open` for popovers. `:has()` may style an owning element from those states.
- Modal behavior, focus containment, inert surroundings, Escape handling, top-layer placement, and `::backdrop` come from `<dialog>`.
- Non-modal top-layer behavior, automatic-popover light dismiss, invoker relationships, and toggle events come from the Popover API.
- Overlay placement uses CSS Anchor Positioning, including implicit invoker anchors, named `anchor-name` / `position-anchor`, `position-area`, `anchor()`, `anchor-size()`, `@position-try`, `position-try-fallbacks`, `position-try-order`, and `position-visibility`.
- Disclosure uses `<details>`, `<summary>`, the `name` attribute for mutually exclusive groups, `toggle`, and `::details-content`.
- Form controls use the Constraint Validation API, `:user-valid`, `:user-invalid`, and `field-sizing: content` where appropriate.
- Component styling may use `@scope`, container queries, container style queries, `:focus-visible`, `@starting-style`, and `transition-behavior: allow-discrete`. Closing animations must not depend on the non-interoperable CSS `overlay` property.

The following remain deferred because at least one latest stable engine lacks them: `<dialog closedby>`, `popover="hint"`, interest invokers, customizable `<select>`, anchor-positioning transforms, anchor-position container queries, the new `position-anchor: normal | none` values, the preview-only anchor validity/visibility variants, and CSS `overlay`. Revisit them when they reach the same latest-stable intersection; do not build a compatibility abstraction in anticipation.

## Architecture

`@typed/ui` stays one package. New modules only talk downward.

1. **Substrate** — `Dom`. It creates no state, but every ref/prop/host composition path preserves callable hydration refs and their symbol-backed metadata.
2. **State machines** — `Collection`, `Composite`.
3. **Native platform (internal, not exported)** — `NativeDialog`, `NativePopover`.
4. **Widgets** — public headless components listed below.

Exports restore namespace barrels next to the existing `Link` / HTTP exports:

```ts
export * from "./HttpRouter.js";
export * from "./Link.js";
export * as Dialog from "./Dialog.js";
// …one namespace per public widget / substrate module
```

`Tab` re-exports `Tabs`. `Radio` re-exports `RadioGroup`. Tests live in `src/__tests__/`.

## State and hydration

Every public **stateful widget** `makeState`, plus `Composite.makeState`, is:

```ts
RefSubject.hydrate(StateSchema, initial);
```

`hydrate` accepts the normal `RefSubject` options plus an optional hydration name. The unnamed overload accepts any hydratable schema. The named overload requires a schema whose encoded type is `string`, because the encoded value is the public attribute value:

```ts
interface HydrateOptions<A> extends RefSubjectOptions<A> {
  readonly name?: string;
}

declare const OpenString: Schema.Codec<boolean, string>;

RefSubject.hydrate(OpenString, false, { name: "open" });
```

The optional name is an attribute suffix: `name: "open"` reads and writes `data-open`. Names must satisfy the template's safe HTML attribute-name rules and have one owner per element. Without a name, hydration continues to use `data-typed-refsubject`.

`hydrate` returns a callable `HydratedRefSubject` that is both the state and its specialized DOM ref:

```ts
interface HydratedRefSubject<A, E, R, RH> extends RefSubject<A, E, R>, HydrationRef<E, RH> {}

const view = Effect.gen(function* () {
  const state = yield* RefSubject.hydrate(StateSchema, initial);
  return html`<dialog ref=${state}>...</dialog>`;
});
```

There is no `.hydrateFromElement` property. The callable retains the existing symbol-backed `HydrationRefTypeId` metadata used by SSR and composition. It must satisfy `isHydrationRef`, `RefSubject.isRefSubject`, and `Fx.isFx`. A template `ref` part detects the hydration protocol and invokes the callable exactly once; in every non-`ref` position the same value remains a normal `RefSubject` / `Fx`. This requires the DOM and HTML renderers to recognize `Fx` protocols on callable values before treating an arbitrary function as non-renderable, and requires `RefSubject.isRefSubject` to accept a symbol-branded function.

The widget that owns the state places it on its host `ref`. When a caller also supplies a ref, `Dom.composeRefs(state, userRef)` must preserve the hydration protocol and metadata while running both DOM refs. `Dom.mergeProps` must retain that protocol in both its runtime value and static return type. Callers do not attach hydration themselves.

Stateful component abstractions should specialize around `hydrate` / `hydrateAll`, not wrap them in a generic UI state layer. Each owning host receives one hydration ref invocation. Stateless thin hosts such as `Button` participate by preserving a caller or parent component's hydration ref; they do not manufacture state solely to satisfy this rule.

Hydration has two attribute lifecycles:

- **Unnamed:** SSR writes every unnamed member into one versioned tuple at `data-typed-refsubject`, preserving flattened argument order. The DOM ref decodes the tuple and removes the attribute. It installs no ongoing DOM synchronization.
- **Named:** SSR writes the member's string-encoded value directly to `data-<name>`. The DOM ref decodes the value, retains the attribute, and forks one scope-owned subscription to that `HydratedRefSubject`. Each change is encoded through the same schema and calls `setAttribute` only when the encoded string differs. Closing the render scope interrupts the subscription.

If a named attribute is absent during a client-only render, initialize the state normally, encode its current value into the attribute, and then begin synchronization. A named hydration attribute owns that DOM name; callers must not also supply it as a static or template property on the same host.

This is the complete schema-backed `data-*` mechanism; there is no `DataAttr` module. Static `data-*` hooks remain ordinary template attributes.

`RefSubject.hydrateAll(first, ...rest)` flattens its arguments' hydration members and returns one `HydrationRef`. All unnamed members share the default tuple. Each named member owns its own scalar attribute; duplicate explicit names are rejected during composition rather than merged into a tuple:

```ts
const view = Effect.gen(function* () {
  const first = yield* RefSubject.hydrate(Schema.Number, 1);
  const second = yield* RefSubject.hydrate(Schema.Number, 2);
  const open = yield* RefSubject.hydrate(OpenString, true, {
    name: "open",
  });

  return html`<section ref=${RefSubject.hydrateAll(first, second, open)}></section>`;
});
```

```html
<section data-typed-refsubject='{"version":1,"values":[1,2]}' data-open="true"></section>
```

Initial server work, sampling, decoding, setting, failure delivery, missing-attribute initialization, and named synchronization startup use `Effect.all(..., UNBOUNDED)`. The template still invokes the composed ref only once. The ref completes initial hydration before returning, forks named synchronization within the render scope, and never makes the template wait on a never-ending subscription. SSR ref rendering accepts the protocol's complete list of encoded attribute entries rather than hard-coding one `data-typed-refsubject` string. The DOM-side `HydrationElement` contract adds `setAttribute` for named synchronization.

Widgets with more than one hydratable state use `hydrateAll` on the owning root. Hydration remains a specialized ref path; it must not be expressed as reactive property spreads or field-level template interpolations. It creates no ongoing subscription for unnamed state and exactly one ongoing subscription for each explicitly named state.

`Collection.makeState` is `RefSubject.make`, not hydrate. It is a runtime registry only.

The attribute contract is:

| Attribute                | Encoding                        | DOM lifetime                                                    |
| ------------------------ | ------------------------------- | --------------------------------------------------------------- |
| `data-typed-refsubject`  | Versioned tuple JSON            | Consumed and removed; no live synchronization                   |
| named `data-<name>`      | The named member's string codec | Retained and synchronized by one scope-owned state subscription |
| ordinary static `data-*` | Template literal                | Normal DOM attribute; not state or hydration                    |

Do not create a named `data-open` merely to duplicate a native `<details>`, `<dialog>`, or popover state. Tests and CSS use the native property, event, or pseudo-class. Named hydration is for state without an adequate native DOM or ARIA representation.

**Hydratable:** serializable widget state only — `open`, `value`, `activeId`, form `values` / `errors` / `meta` / `submitting`, and so on.

**Not hydratable:** `Collection` item `element` references and other DOM handles. `Collection` is a runtime registry: items `register` when they mount and unregister when the owning `Scope` closes. After hydration, the client re-registers elements. `Composite.activeId` hydrates; the collection itself does not.

Hydrate adds `Schema.SchemaError` on the ref. Widget Fx error and service channels come directly from `Renderable.Error` / `Renderable.Services` over the caller’s options (`onclick`, `ref`, renderables), same idea as today’s `Link`. There is no `Reactive` intermediary.

## Native component behavior

`NativeDialog` and `NativePopover` are small internal adapters around platform lifecycle events. They coordinate native state with the owning `RefSubject`; they do not recreate platform behavior.

- **Disclosure:** render `<details>` and `<summary>`. Drive changes through the native `open` state and `toggle` event. Use `name` for exclusive accordion groups. `Disclosure.Button` is the typed `<summary>` part and `Disclosure.Content` is ordinary content styled through `::details-content` when needed.
- **Dialog:** render `<dialog>`. Prefer declarative `commandfor` with `show-modal`, `close`, or `request-close` for triggers whose targets have stable IDs. Programmatic state changes call `showModal()`, `close()`, or `requestClose()`. Synchronize from `cancel`, `close`, and `toggle`; do not install a focus trap, inert manager, backdrop click layer, or Escape listener.
- **Popover:** render the native `popover` attribute. Prefer `popovertarget` / `popovertargetaction` or `commandfor` commands for stable trigger-target relationships. Programmatic changes use `showPopover()`, `hidePopover()`, or `togglePopover()`. Synchronize from `beforetoggle` and `toggle`, using `ToggleEvent.source` instead of separately tracking the invoker.
- **Tooltip and Hovercard:** use manual native popovers with Typed focus/hover delay effects. Do not use `popover="hint"` until Safari stable supports it.
- **Menu, Menubar, Select, and Combobox overlays:** use native popovers and anchor positioning while retaining their required ARIA composite behavior. Do not substitute customizable `<select>` until it is interoperable.

Popover invokers establish an implicit CSS anchor whenever possible. Explicit `anchor-name` / `position-anchor` is for non-invoker anchors or multiple-anchor layouts. Position fallback is CSS (`position-area`, `position-try-*`, `@position-try`), never a measurement loop or JavaScript positioning engine.

## Form schema

`Form.makeState` takes an optional `Schema.Codec<Values, unknown>` used by `validate` via `Schema.decodeUnknownEffect`. The codec is **not** part of hydratable state (functions are not serializable). It is held beside the ref — an argument to `makeState` / `validate` — while the hydrated snapshot is `values`, `defaultValues`, `errors`, `meta`, and `submitting` only. There is no `Schema.Optic` on form state.

## Form `*Input` family

There is no generic `Form.Input`. Each variant locks HTML `type`, a default `Schema.Codec<A, string>`, and allowed field names:

```ts
type FieldNameFor<Values, A> = {
  [K in keyof Values & string]: Values[K] extends A ? K : never;
}[keyof Values & string];
```

Callers may pass a compatible `codec` (`Codec<A, string>`) to refine (min, pattern, etc.) but cannot change the decoded field type.

| Export               | `type`           | Default codec             | Field type  |
| -------------------- | ---------------- | ------------------------- | ----------- |
| `TextInput`          | `text`           | `Schema.String`           | `string`    |
| `SearchInput`        | `search`         | `Schema.String`           | `string`    |
| `EmailInput`         | `email`          | `Schema.String`           | `string`    |
| `UrlInput`           | `url`            | `Schema.String`           | `string`    |
| `TelInput`           | `tel`            | `Schema.String`           | `string`    |
| `PasswordInput`      | `password`       | `Schema.String`           | `string`    |
| `HiddenInput`        | `hidden`         | `Schema.String`           | `string`    |
| `ColorInput`         | `color`          | `Schema.String`           | `string`    |
| `NumberInput`        | `number`         | `Schema.NumberFromString` | `number`    |
| `RangeInput`         | `range`          | `Schema.NumberFromString` | `number`    |
| `DateInput`          | `date`           | `Schema.DateFromString`   | `Date`      |
| `TimeInput`          | `time`           | `Schema.String`           | `string`    |
| `DateTimeLocalInput` | `datetime-local` | `Schema.String`           | `string`    |
| `MonthInput`         | `month`          | `Schema.String`           | `string`    |
| `WeekInput`          | `week`           | `Schema.String`           | `string`    |
| `MaskedInput`        | `text`           | mask codec (below)        | mask struct |

Already typed, keep as named exports: `Form.Checkbox` (`boolean` fields), `Form.Select` (`string` fields). Also keep `Form`, `Label`, `Description`, `Error`, `Submit`, `Reset`, `Push`, `Remove`, `Group`.

All `*Input` variants share one internal `renderInput({ type, codec })`.

## MaskedInput

A mask is an ordered list of literals and named slots. Each slot has a name, a `Schema.Codec<A, string>`, and optional `length` / charset. Encode paints the display string; decode produces a struct whose keys are the slot names.

```ts
const phone = Form.mask(
  "(",
  Form.slot("area", Schema.NumberFromString, { length: 3 }),
  ") ",
  Form.slot("prefix", Schema.NumberFromString, { length: 3 }),
  "-",
  Form.slot("line", Schema.NumberFromString, { length: 4 }),
);
// Encoded: "(555) 123-4567"
// Type:    { area: number; prefix: number; line: number }

Form.MaskedInput(state, "phone", { mask: phone });
```

`name` is `FieldNameFor<Values, MaskType>`. Literals are display-only. Slot codecs may differ (mixed value types). Incomplete or invalid input fails decode and writes a field error, same as `NumberInput` on `"abc"`.

Caret / selection while typing is best-effort in this work (format on input/blur). This is not a full masked-input editor. There is no tuple output and no `maskTo` collapse helper.

## Public widget surface

| Module                          | Parts                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `Disclosure`                    | `makeState`, `Button`, `Content`                                                                        |
| `Dialog`                        | `makeState`, `Trigger`, `Content`, `Close`, `Heading`, `Description`                                    |
| `Popover`                       | `makeState`, `Trigger`, `Content` — native Popover API only                                             |
| `Hovercard`, `Tooltip`          | focus/hover delays on native popover                                                                    |
| `Menu`, `Menubar`               | `makeState`, `Trigger`/`Root`, `Content`, `Item`                                                        |
| `Listbox`                       | `makeState`, `Root`, `Option`                                                                           |
| `Select`                        | `makeState`, `Trigger`, `Content`, `Option`                                                             |
| `Combobox`                      | `makeState`, `Input`, `Popover`, `Item`                                                                 |
| `Tabs`, `RadioGroup`, `Toolbar` | composite + collection                                                                                  |
| `Alert`                         | non-modal `role="alert"` live region; alert dialogs remain `Dialog` with `role="alertdialog"`           |
| `Meter`                         | native `<meter>` with hydratable scalar value                                                           |
| `Slider`, `SpinButton`          | native range and number inputs with hydratable finite values                                            |
| `Switch`                        | native button host with `role="switch"` and hydratable checked state                                    |
| `WindowSplitter`                | focusable `role="separator"`, hydratable finite range, arrows, Home/End, and collapse/restore           |
| `Carousel`                      | hydratable active/paused state, slide collection, and explicit previous/next/rotation controls          |
| `Tree`                          | hydratable active/expanded state, nested `role="group"`, and collection-backed tree navigation          |
| `Grid`                          | hydratable virtual active cell with `aria-activedescendant`, rows, cells, and headers                   |
| `TreeGrid`                      | tree expansion plus Grid virtual focus; nested hidden `rowgroup`s are the collapsed-row boundary        |
| `Form`                          | as above                                                                                                |
| Thin hosts                      | `Button`, `Checkbox`, `Role`, `Focusable`, `Heading`, `Group`, `Separator`, `VisuallyHidden`, `Command` |

CSS Anchor Positioning is part of the required platform contract, not an optional enhancement. Components expose stable trigger/overlay relationships and accept the CSS anchor properties needed for named, implicit, fallback, and visibility-aware positioning. The kit remains headless: applications own the actual placement rules.

## Error handling

- Hydration decode and synchronization-encode failures stay `Schema.SchemaError` on the affected hydratable ref. Other unnamed or named members still hydrate and synchronize concurrently.
- Form field decode failures write `errors[name]` and do not throw out of the input handler.
- `Form.validate` fails with `Schema.SchemaError` when the form codec fails, after writing field errors.
- User event handlers run first; if they `preventDefault`, built-in widget behavior does not run (same as `Link`).
- `Link` / `HttpRouter` error policy is unchanged (safe href neutralization, empty-bodied 404/400/500).

## Testing

Historical tests are the behavioral spec, not source we copy. Rewrite them against `RefSubject.hydrate` and the new Form APIs.

**Keep as-is:** current `Link` and `HttpRouter` tests (including security and streaming SSR).

**Do not revive:** `StartupRef`, `Resumability`, compiler, or resumability diagnostics.

Coverage, in build order:

1. Hydration protocol — callable `HydratedRefSubject`; callable `Fx` rendering outside `ref`; unnamed tuple grouping and removal; named scalar string encoding, retention, and live synchronization; duplicate-name rejection; mixed-name SSR output; one DOM ref invocation; unbounded member execution; scope cleanup; hydration-aware `Dom.composeRefs`.
2. Substrate — `Dom` merge/compose/ref, exact error/service preservation, hydration-protocol preservation through merged props, and both `on*` / `@*` event composition (runtime and type tests). There is no `Reactive` or `DataAttr` module or test suite.
3. State machines — `Collection` register/unregister on `Scope`; `Composite` movement, typeahead, roving tabindex. Collection is not hydrated; `activeId` is.
4. Widgets — each stateful public module: `makeState` hydrates and the callable state is the host ref. Browser tests exercise native `<details>`, `<dialog>`, Popover, invoker commands, `requestClose()`, `ToggleEvent.source`, CSS Anchor Positioning, native range/number controls, switch activation, splitter keyboard control, carousel collection movement, tree expansion, and grid/treegrid virtual focus in current stable Chromium, Firefox, and WebKit.
5. Form — each `*Input` constrains `name` to the right field type (type tests). Decode/encode via the default codec. `MaskedInput` round-trips named slots ↔ display string and writes field errors on incomplete/invalid input.
6. SSR smoke — render unnamed tuple state and named scalar state to HTML; hydrate both; assert the unnamed attribute is removed; mutate named state; assert its retained attribute updates; close the scope; assert synchronization stops.

## Done

- `@typed/ui` builds.
- `test:types`, `test:node`, and `test:browser` pass.
- Browser coverage runs against the latest stable Chromium, Firefox, and WebKit supported by the test runner; there is no old-browser fallback suite.
- README documents the restored kit, callable/named hydration and its two attribute lifecycles, the Baseline 2026 policy, native Dialog/Popover/Anchor Positioning behavior, Form `*Input`s, and `MaskedInput`.
- `Link` / `HttpRouter` behavior is unchanged.

## Platform references

- [WebDX web-features](https://github.com/web-platform-dx/web-features) — compatibility and Baseline data; support snapshot checked with `web-features` 3.35.1.
- [WebKit features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) — anchor positioning and dialog toggle.
- [WebKit features in Safari 26.2](https://webkit.org/blog/17640/webkit-features-for-safari-26-2/) — invoker commands, `field-sizing`, and expanded anchor positioning.
- [WebKit features in Safari 26.5](https://webkit.org/blog/17938/webkit-features-for-safari-26-5/) — `:open` and `ToggleEvent.source`.
- [WebKit in Safari 27 beta](https://webkit.org/blog/17967/news-from-wwdc26-webkit-in-safari-27-beta/) — preview-only anchor additions that are explicitly deferred.
