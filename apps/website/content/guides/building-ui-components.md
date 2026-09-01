---
title: Building UI components
summary: Author one lazy, stateful UI component from public Typed primitives and test its state and browser boundaries separately.
section: UI
kind: guide
order: 4
---

Build a component when a repeated interaction needs a small public contract. This guide develops a
save control: it shows a live status, runs a caller-supplied save action, and uses a real native
button. The caller supplies its label and save work; the control owns only the short-lived visual
phase of one rendered instance.

## 1. Start with props and a public UI part

Name inputs after what callers know, not after DOM implementation details. A label is a component
input; `Button.Button` is the public semantic host that solves keyboard activation and native button
behavior.

```ts
import { component } from "@typed/ui/Component";
import * as Button from "@typed/ui/Button";

interface SaveButtonProps {
  readonly label: string;
}

const SaveButton = component(function* (props: SaveButtonProps) {
  return Button.Button({ content: props.label });
});

const accountSave = SaveButton({ label: "Save account" });
```

`component(function* (props) { ... })` turns the parameterized generator into a component function.
`SaveButton(props)` returns lazy rendered output as `Fx`; it does not create an element, attach a
listener, or run an Effect yet. The returned `Button.Button` is a Template renderable, and
`component` lifts that result into the same Fx boundary.

## 2. Add local state and name its transitions

The save phase belongs to the control because it describes this particular rendered interaction, not
the account's domain state. Keep transitions as normal named functions so they are usable in tests
and event Effects without inspecting rendered output.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Button from "@typed/ui/Button";

type SavePhase = "idle" | "saving" | "saved";

const beginSave = <E, R>(phase: RefSubject.RefSubject<SavePhase, E, R>) =>
  RefSubject.set(phase, "saving");

const finishSave = <E, R>(phase: RefSubject.RefSubject<SavePhase, E, R>) =>
  RefSubject.set(phase, "saved");

interface SaveButtonProps {
  readonly label: string;
  readonly save: Effect.Effect<void>;
}

const SaveButton = component(function* (props: SaveButtonProps) {
  const phase = yield* RefSubject.make<SavePhase>("idle");
  const runSave = Effect.gen(function* () {
    yield* beginSave(phase);
    yield* props.save;
    yield* finishSave(phase);
  });

  return html`<section>
    <output role="status">${phase}</output>
    ${Button.Button({ content: props.label, onclick: runSave })}
  </section>`;
});
```

`RefSubject.make` runs only when the component's Fx runs, so each mounted save control gets its own
phase. `beginSave` and `finishSave` are local UI transitions; account data stays in caller-owned
state or in the supplied `save` Effect. If failure needs a visible phase, add an explicit `failed`
variant and a recovery policy—do not turn an expected failure into a stale “saved” label.

## 3. Let a prop be static or live

Labels often start static and later need live localization or availability text. `Renderable` already
accepts a snapshot, an `Fx`, an Effect, and other template-supported values. Normalize once with
`liftRenderableToFx` when the component must transform the value before rendering it.

```ts
import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { html, liftRenderableToFx, type Renderable } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Button from "@typed/ui/Button";

type SavePhase = "idle" | "saving" | "saved";

const beginSave = <E, R>(phase: RefSubject.RefSubject<SavePhase, E, R>) =>
  RefSubject.set(phase, "saving");
const finishSave = <E, R>(phase: RefSubject.RefSubject<SavePhase, E, R>) =>
  RefSubject.set(phase, "saved");

interface SaveButtonProps<E, R> {
  readonly label: Renderable<string, E, R>;
  readonly save: Effect.Effect<void, E, R>;
}

const SaveButton = component(function* <E, R>(props: SaveButtonProps<E, R>) {
  const phase = yield* RefSubject.make<SavePhase>("idle");
  const buttonLabel = liftRenderableToFx<E, R>(props.label).pipe(
    Fx.map((label) => (label === "Save" ? label : `Save ${label}`)),
  );
  const runSave = Effect.gen(function* () {
    yield* beginSave(phase);
    yield* props.save;
    yield* finishSave(phase);
  });

  return html`<section>
    <output role="status">${phase}</output>
    ${Button.Button({ content: buttonLabel, onclick: runSave })}
  </section>`;
});

const profileSave = SaveButton({ label: "profile", save: Effect.void });
```

The component's Fx carries the errors and service requirements of both `save` and `label`; nothing
inside the component silently supplies or catches them. A static label emits once, while an `Fx`
label continues to update its button content. Do not accept a writable RefSubject merely to display
it—the component has no reason to mutate caller-owned label state.

## 4. Test the transition, then the browser event

The transition test needs no renderer or document:

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { assert, it } from "vitest";

type SavePhase = "idle" | "saving" | "saved";
const beginSave = <E, R>(phase: RefSubject.RefSubject<SavePhase, E, R>) =>
  RefSubject.set(phase, "saving");
const finishSave = <E, R>(phase: RefSubject.RefSubject<SavePhase, E, R>) =>
  RefSubject.set(phase, "saved");

const movesThroughSavePhases = Effect.fn("movesThroughSavePhases")(function* () {
  const phase = yield* RefSubject.make<SavePhase>("idle");
  yield* beginSave(phase);
  yield* finishSave(phase);
  assert.strictEqual(yield* phase, "saved");
});

it("moves through the local save phases", () =>
  movesThroughSavePhases().pipe(Effect.scoped, Effect.runPromise));
```

Use one focused browser test for the boundary that state cannot prove: the real button event updates
rendered output and invokes the supplied save work.

```ts
import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { assert, it } from "vitest";
import { component } from "@typed/ui/Component";
import * as Button from "@typed/ui/Button";

type SavePhase = "idle" | "saving" | "saved";
const beginSave = <E, R>(phase: RefSubject.RefSubject<SavePhase, E, R>) =>
  RefSubject.set(phase, "saving");
const finishSave = <E, R>(phase: RefSubject.RefSubject<SavePhase, E, R>) =>
  RefSubject.set(phase, "saved");

const SaveButton = component(function* (save: Effect.Effect<void>) {
  const phase = yield* RefSubject.make<SavePhase>("idle");
  const runSave = Effect.gen(function* () {
    yield* beginSave(phase);
    yield* save;
    yield* finishSave(phase);
  });
  return html`<section>
    <output role="status">${phase}</output>
    ${Button.Button({ content: "Save", onclick: runSave })}
  </section>`;
});

const clicksSaveButton = Effect.fn("clicksSaveButton")(function* () {
  let saves = 0;
  yield* render(SaveButton(Effect.sync(() => saves++)), document.body).pipe(Fx.take(1), Fx.drain);

  document.querySelector<HTMLButtonElement>("button")?.click();
  yield* Effect.yieldNow;

  assert.strictEqual(saves, 1);
  assert.strictEqual(document.querySelector("output")?.textContent, "saved");
});

it("updates the status after a real click", () =>
  clicksSaveButton().pipe(
    Effect.provide(DomRenderTemplate.using(document)),
    Effect.scoped,
    Effect.runPromise,
  ));
```

`Button.Button` keeps native button semantics; callers still must give it a meaningful label and
choose the right interaction. If this grows into form submission, a dialog, or a command menu,
compose the appropriate public Form, Dialog, or Menu family rather than adding ad-hoc roles and
handlers to this component.
