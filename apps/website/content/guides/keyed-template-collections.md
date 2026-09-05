---
title: "Change a keyed template collection"
summary: "Keep one rendered range per stable key so insertions, removals, and moves preserve the browser state that belongs to an item."
section: "Templates"
kind: "guide"
order: 3.3
---

Use `many` when a live collection can add, remove, reorder, or update logical items. It accepts an
`Fx<ReadonlyArray<A>, E, R>`, a stable key function, and a renderer for each item. The key is not a
hint for array indexes: it is the identity of the rendered child range. The result is a `Many`
renderer descriptor, not another `Fx`; that lets the DOM and HTML renderers consume the collection
directly instead of flattening child output through a generic collection stream.

For an initial, fixed list, an array of child templates is simpler. `many` pays for keyed lifetime
management because it preserves a retained item's DOM nodes when the collection changes. That
preserves node identity. Browser state such as focus and selection also depends on the platform move
operation; the fallback insertion path can disconnect and reconnect a retained node.

## Render each item from its RefSubject

The item renderer receives `RefSubject<A>`, not a snapshot. When an item with the same key changes,
Typed updates that subject and keeps the already-mounted child range alive. Derive the fields a row
needs from the subject; do not close over the source array or rebuild a separate stream per render.

```ts
import { RefSubject } from "@typed/fx";
import { html, many } from "@typed/template";
import { component } from "@typed/ui/Component";

interface Task {
  readonly id: string;
  readonly title: string;
  readonly done: boolean;
}

export const taskList = component(function* () {
  const tasks = yield* RefSubject.make<ReadonlyArray<Task>>([
    { id: "docs", title: "Write the guide", done: false },
    { id: "review", title: "Review native events", done: false },
  ]);

  const taskRows = many(
    tasks,
    (task) => task.id,
    (task, id) =>
      html`<li data-task-id=${id}>
        <input type="checkbox" .checked=${task.pipe(RefSubject.map((value) => value.done))} />
        <span>${task.pipe(RefSubject.map((value) => value.title))}</span>
      </li>`,
  );

  return html`<ul aria-label="Tasks">${taskRows}</ul>`;
});
```

This page's `tasks` source is scoped because it creates mutable state. A Scope is Effect's resource
lifetime: when the rendered output is interrupted, the collection subscription and all retained
child ranges are finalized together. The child subject is deliberately scoped more narrowly: removing
one key closes only that child's work.

To change this particular collection from an application program, keep the subject itself in the
same scope that owns the page, then apply one update. `RefSubject.update` is state logic and can be
tested without a document.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

interface Task {
  readonly id: string;
  readonly title: string;
  readonly done: boolean;
}

const markReviewed = (tasks: RefSubject.RefSubject<ReadonlyArray<Task>>) =>
  RefSubject.update(tasks, (current) =>
    current.map((task) => (task.id === "review" ? { ...task, done: true } : task)),
  );

export const verifyTransition = Effect.scoped(
  Effect.gen(function* () {
    const state = yield* RefSubject.make<ReadonlyArray<Task>>([
      { id: "review", title: "Review native events", done: false },
    ]);
    yield* markReviewed(state);
    return (yield* state)[0].done;
  }),
);
```

## What the DOM reconciler does

On the DOM target, the renderer keeps a map from key to item value, `RefSubject`, child Scope, and
concrete nodes. A new key starts one child Scope and one item renderer. A retained key whose value is
not equal receives the next value through its existing `RefSubject`; an unchanged retained value is
not published again. A removed key closes only that child Scope. Reordering retained keys reuses
their concrete nodes; where available, the local range diff uses `moveBefore` for an
already-connected node and falls back to `insertBefore` otherwise.

The work is local, but a list emission is not O(1). Typed validates the next keys, checks the previous
order for removals, and visits the next values: O(`a + b`) for previous and next item counts, plus
key/equality work and the concrete-node range diff. Retained-key lookup is O(1) on average. The
important fast path is behavioral: a pure reorder does not rerun unchanged item state, and adding or
removing one key starts or closes only that key's child work.

Keys must be unique among the current entries and stable for the item's logical lifetime. Duplicate
keys fail with `Cause.IllegalArgumentError` in both DOM and HTML rendering. Do not use array indexes
when items can move—the same index would then identify a different task and retain the wrong browser
state.

## DOM and SSR have different lifetimes

The HTML renderer does not keep a response open to reconcile future list emissions. It reads the
initial array, validates its keys, renders it in source order, and writes keyed hydration markers. It
does not retain live child identity after that response pass. Local `symbol` keys also fail for
hydratable output because their identity cannot cross serialization; use a string, number, or
`Symbol.for()` key at the server boundary.

That distinction is intentional:

| Target | Collection behavior | Lifetime |
| --- | --- | --- |
| DOM | direct keyed entry map; changed children update, retained ranges move, removed scopes close | live until its parent Scope closes |
| HTML / SSR | validated initial entries render once in source order with hydration markers | finite response work |

Choose `HtmlRenderTemplate` for a hydratable server response and `StaticHtmlRenderTemplate` only when
no browser adoption is needed. Read [Rendering HTML on the server](/explore/rendering-html-on-the-server)
and [Hydrating Typed HTML](/explore/hydrating-typed-html) for the response/adoption boundary.

## Verify the behavior that keys promise

Test state transitions with `RefSubject` first. Then mount `taskList` into a real test document with
`DomRenderTemplate.using(document)`, focus an input in the `review` row, reorder the source with the
same `id`, and assert that the focused input is the same node after the update. That test checks the
reason to use keys: retained identity, not merely the final text order. The [testing guide](/explore/testing-typed-systems)
shows the public mounting pattern.
