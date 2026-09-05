---
title: "Choosing Typed UI components"
summary: "Start with the browser interaction, then choose semantic HTML, a public UI family, composition, or a new family."
section: "UI"
kind: "guide"
order: 4.1
---

Choose the smallest boundary that owns the interaction.

1. Use semantic HTML when the browser already provides the complete interaction.
2. Use a public `@typed/ui` family when it provides the required state, keyboard, focus, overlay, or form contract.
3. Compose that family's public parts for a screen-specific arrangement.
4. Author a family only when a new browser-behavior contract will be reused.

## Start with semantic HTML

Use `html` for document structure and native controls whose browser behavior is sufficient: headings,
labels, form grouping, status text, links, buttons, and ordinary `<details>`. A native element starts
with the right semantics, keyboard behavior, focus model, and form participation. Do not replace it
with a clickable `div` or recover its behavior with a role attribute.

```ts
import { html } from "@typed/template";

const accountSummary = html`
  <section aria-labelledby="account-heading">
    <h2 id="account-heading">Account</h2>
    <p>Your subscription renews on 15 September.</p>
  </section>
`;
```

Consult MDN for the native [button](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button),
[select](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select), and
[dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) elements.
If native behavior is not enough, choose an interaction pattern before choosing visuals.

## Use a family when it owns an interaction contract

Use a public family for a behavior that must coordinate more than a native element: a `Dialog` for a
modal task, `Popover` for anchored supporting content, `Tabs` for linked tabs and panels, or `Select`,
`Listbox`, `Combobox`, and `Menu` for their distinct selection and command models. The [WAI-ARIA APG
patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) describe those contracts; roles alone do not
implement them.

Choose from what the person does, not from what looks similar:

- Navigate to a location with an anchor or `Link`; invoke an action with a button.
- Reveal in-flow supporting content with native details or `Disclosure`; open an anchored transient
  surface with `Popover`; complete a modal task with `Dialog`.
- Use `Select` or `Listbox` to choose data, `Combobox` to enter text with matches, and `Menu` to invoke
  commands.

## Find the existing family before building one

The library covers small controls as well as compound widgets. Start here when a screen needs an
interaction that is not in the first example:

| Need | Public family | Application decision |
| --- | --- | --- |
| A command or location | [Button](/reference/modules/%40typed%2Fui%2FButton), [Link](/reference/modules/%40typed%2Fui%2FLink) | Action Effect versus navigation destination |
| An independent choice, including a partially selected group | [Checkbox](/reference/modules/%40typed%2Fui%2FCheckbox) | Boolean or `"mixed"`; label and form participation |
| An immediately applied on/off setting | [Switch](/reference/modules/%40typed%2Fui%2FSwitch) | Who persists the setting and reports failure |
| One choice from visible alternatives | [RadioGroup](/reference/modules/%40typed%2Fui%2FRadioGroup) | Value, shared state/collection, labels |
| A numeric value to edit | [Slider](/reference/modules/%40typed%2Fui%2FSlider), [SpinButton](/reference/modules/%40typed%2Fui%2FSpinButton) | Bounds, step, units, visible value |
| A measurement within a known range | [Meter](/reference/modules/%40typed%2Fui%2FMeter) | Meaningful bounds and accessible description; use native `progress` for task completion |
| Views within one location | [Tabs](/reference/modules/%40typed%2Fui%2FTabs), [Tab](/reference/modules/%40typed%2Fui%2FTab) | Tab/panel IDs and selection policy |
| Persistent command groups | [Toolbar](/reference/modules/%40typed%2Fui%2FToolbar), [Menubar](/reference/modules/%40typed%2Fui%2FMenubar) | Commands and enabled state |
| Hierarchical or two-dimensional navigation | [Tree](/reference/modules/%40typed%2Fui%2FTree), [Grid](/reference/modules/%40typed%2Fui%2FGrid), [TreeGrid](/reference/modules/%40typed%2Fui%2FTreeGrid) | Relationships, row/cell identities, selection |
| A sequence of slides or a resizable pane | [Carousel](/reference/modules/%40typed%2Fui%2FCarousel), [WindowSplitter](/reference/modules/%40typed%2Fui%2FWindowSplitter) | Content, labels, dimensions, and limits |
| Structure and supporting semantics | [Heading](/reference/modules/%40typed%2Fui%2FHeading), [Group](/reference/modules/%40typed%2Fui%2FGroup), [Separator](/reference/modules/%40typed%2Fui%2FSeparator), [Alert](/reference/modules/%40typed%2Fui%2FAlert), [VisuallyHidden](/reference/modules/%40typed%2Fui%2FVisuallyHidden) | Document hierarchy, names, and announcements |

For a normal form field, the schema-bound [Form family](/explore/forms-as-a-browser-contract)
is often the better entry point than constructing independent control state. For example, a
button-backed Switch is an interaction state, not automatically a named native checkbox submitted
with a form. Choose the state and transport contract together.

This small component composes a real switch with a live explanation. Rendering borrows its state;
there is no subscription callback or second boolean to keep synchronized:

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Switch from "@typed/ui/Switch";

const Notifications = component(function* () {
  const state = yield* Switch.makeState({ checked: true });
  const explanation = state.pipe(
    RefSubject.map(({ checked }) => checked ? "Notifications enabled" : "Notifications paused"),
  );

  return html`<section>
    ${Switch.Switch({ state, content: "Notifications" })}
    <p>${explanation}</p>
  </section>`;
});
```

`Notifications` is already an Fx because its generator has no parameters. Pass it to a template or
renderer directly. Use a parameterized generator when callers must supply state, content, or work.

## Compose public parts for application UI

An existing family is not a monolithic widget. Application code owns state and assembles its public
parts; rendering later owns listeners and other render-lifetime resources.

```ts
import * as Effect from "effect/Effect";
import * as Dialog from "@typed/ui/Dialog";

const keyboardHelp = Effect.gen(function* () {
  const state = yield* Dialog.makeState();

  return [
    Dialog.Trigger({ state, content: "Keyboard help" }),
    Dialog.Content({
      state,
      id: "keyboard-help",
      label: "Keyboard help",
      content: "Press Tab to move between controls.",
    }),
  ];
});
```

Compound families may also require a collection. Create it with the family's public `makeCollection`,
then pass the same state and collection to its root, items, and panels. It registers mounted items in
DOM order so the family can provide its documented active-item, typeahead, selection, and focus
behavior. See [UI collections, focus, and keyboard behavior](/explore/ui-collections-and-focus) and
[selection, autocomplete, and command surfaces](/explore/selection-autocomplete-and-command-surfaces)
for those constructions.

## Author a family only for a new reusable contract

Do not create a component merely to wrap a one-off page fragment. Compose semantic markup and public
parts directly. Create a family when an interaction will be reused and needs a documented state,
transition, native host, custom-host contract, and browser behavior that no public family already
supplies. Use public `Dom.renderHost` at that boundary, not from ordinary application UI. The
[component construction guide](/explore/building-ui-components) shows that path.

## Responsibilities and tests

Typed verifies the component-level contract: public state transitions, generated native and ARIA
relationships, registered collection behavior, and focused browser behavior such as real events,
focus movement, Escape, and native overlay synchronization. Authors must still choose the right
interaction; provide meaningful labels, content, stable IDs, value ownership, and document
structure; and ensure a custom host applies every supplied prop, handler, and composed ref.

Test public state transitions without rendering when they express application behavior. Add a focused
browser test when correctness depends on the platform: click or keyboard dispatch, focus, form
submission, top-layer behavior, rendered attributes, or hydration. That division keeps the component
contract and the screen's own accessibility decisions visible and testable.

Continue with [building UI components](/explore/building-ui-components) for a reusable public
contract, [overlays](/explore/overlays-disclosure-and-transient-ui) for transient surfaces, and
[Effect v4](https://effect.website/docs/v4) for the Effect values and services composed by these parts.
