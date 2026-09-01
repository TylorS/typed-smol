---
title: Overlays, disclosure, and transient UI
summary: Choose the smallest public UI contract for expanded content, top-layer information, modal work, and commands.
section: UI
kind: guide
order: 4.4
---

"Opens something" is not one interaction. A section that expands in the document, a small
top-layer panel, a modal decision, a short description, and an interactive card make different
promises about focus, dismissal, and keyboard interaction. Choose that promise first; do not style
one generic overlay into every one of these jobs.

Typed builds these families on native browser semantics: [HTML `details`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details),
the [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API), and [the `dialog` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).
The corresponding accessibility decisions are described by the APG [disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/),
[modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), and [tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) patterns.

## Choose by the job of the content

| The content needs to… | Use | It is not for… |
| --- | --- | --- |
| Remain in document flow while being revealed or hidden | `Disclosure` | A floating command surface or a blocking decision |
| Appear in the top layer without becoming a dialog | `Popover` | Required focus management or a task that blocks the page |
| Take focused interaction, usually while the rest of the page is inert | `Dialog` | A small description or an anchored preview |
| Describe an anchor; contain no required controls | `Tooltip` | Links, fields, buttons, or persistent instructions |
| Let pointer or focus move into an interactive, named preview | `Hovercard` | A modal task or a non-interactive tooltip |
| Offer a keyboard-navigable set of commands | `Menu` | Persistent form values or arbitrary document content |

`Disclosure` renders native `<details>` and `<summary>`. `Popover`, `Tooltip`, and
`Hovercard` render `popover="manual"` content in the native top layer. A manual popover is not
the browser's auto/light-dismiss popover: model dismissal explicitly in state, and use the supplied
Escape behavior where it matches the interaction. `Dialog` renders a real `<dialog>` and opens
modally by default, so the browser owns top-layer placement, page inertness, and the dialog focus
lifecycle.

## Compose state, trigger, and content

Every family exposes a renderer-independent hydrated `state`. Create it in the Effect that owns the
widget, then give the same state to its public parts. `makeState` is Scope-owned because it creates a
`RefSubject`; the returned parts are inert `Fx` values. Rendering those values later owns DOM
listeners, native-element synchronization, and reactive props for the renderer's Scope.

Use `Disclosure` when the additional material is part of the page. The browser toggles its summary;
Typed observes the native `toggle` event and keeps `state.open` synchronized. Application code can
also use `Disclosure.setOpen(state, open)` without a mounted renderer.

```ts
import { Effect } from "effect";
import * as Disclosure from "@typed/ui/Disclosure";

const advancedSettings = Effect.gen(function* () {
  const state = yield* Disclosure.makeState();

  return Disclosure.Content({
    state,
    content: [
      Disclosure.Button({ content: "Advanced settings" }),
      "These controls remain in the page flow.",
    ],
  });
});
```

For a top-layer panel, compose `Popover.Trigger` and `Popover.Content`. Supplying matching
`controls` and `props.id` emits the native `popovertarget` relationship. Omitting `controls` selects
the public state-driven trigger fallback, which is the portable choice when native target attributes
are unavailable. Both forms synchronize native `beforetoggle`/`toggle` events back to the same
state.

```ts
import { Effect } from "effect";
import * as Popover from "@typed/ui/Popover";

const preferencesPanel = Effect.gen(function* () {
  const state = yield* Popover.makeState();

  return [
    Popover.Trigger({ state, controls: "preferences", content: "Preferences" }),
    Popover.Content({
      state,
      props: { id: "preferences" },
      content: "A short settings panel.",
    }),
  ];
});
```

Use `Dialog` when the interaction needs dialog behavior. `Dialog.Content` requires exactly one
accessible naming strategy: `label` or `labelledBy`. It uses `showModal()` by default; set
`modal: false` only when the interaction is intentionally non-modal. Its trigger, close, and
request-close controls use state fallbacks when `controls` is omitted. Supplying `controls` instead
selects native `commandfor` commands and therefore requires browser command-attribute support.

```ts
import { Effect } from "effect";
import * as Dialog from "@typed/ui/Dialog";

const deleteAccountDialog = Effect.gen(function* () {
  const state = yield* Dialog.makeState();

  return [
    Dialog.Trigger({ state, content: "Delete account" }),
    Dialog.Content({
      state,
      labelledBy: "delete-account-title",
      describedBy: "delete-account-description",
      content: [
        Dialog.Heading({ id: "delete-account-title", content: "Delete account" }),
        Dialog.Description({
          id: "delete-account-description",
          content: "This action cannot be undone.",
        }),
        Dialog.RequestClose({ state, content: "Cancel" }),
        Dialog.Close({ state, content: "Delete" }),
      ],
    }),
  ];
});
```

`RequestClose` deliberately takes the cancelable close-request path; a consumer can prevent its
native `cancel` event. `Close` is the direct close path, appropriate after an accepted action. The
native dialog also reports `cancel`, `close`, and `toggle` back into `state.open`. Give the dialog a
clear exit and a sensible first focusable control; verify the browser's resulting focus behavior for
the task rather than recreating a focus trap around an ordinary `div`.

## Keep a tooltip descriptive; use a hovercard for interaction

`Tooltip.makeState` and `Hovercard.makeState` require a stable `id`. It is the server/client-safe
relationship between their anchor and their content. Their default anchors are `<span>` elements:
they receive pointer events, but not focus until the host itself is focusable. Set `props.tabindex`
or supply a natively focusable host; focus on a descendant does not bubble to the default span.

`Tooltip.Anchor` adds `aria-describedby`, and `Tooltip.Content` is a manual popover with
`role="tooltip"`. It opens on pointer entry or direct host focus, closes on Escape, and keeps itself
open while the pointer moves from anchor to description. Its content must remain explanatory; do
not put a needed interactive action inside it.

```ts
import { Effect } from "effect";
import * as Tooltip from "@typed/ui/Tooltip";

const saveHelp = Effect.gen(function* () {
  const state = yield* Tooltip.makeState({ id: "save-help" });

  return [
    Tooltip.Anchor({ state, props: { tabindex: 0 }, content: "Save" }),
    Tooltip.Content({ state, content: "Stores your current changes." }),
  ];
});
```

When the content includes a link, button, or other focusable interaction, use `Hovercard` instead.
It gives its manual popover `role="dialog"` and requires exactly one of `label` or `labelledBy`.
Its anchor uses `aria-controls`; focus moving from that anchor into the card keeps it open, but the
card is not modal and does not trap focus. Escape, pointer departure, and focus leaving the card
close it through the shared state.

```ts
import { Effect } from "effect";
import { html } from "@typed/template";
import * as Hovercard from "@typed/ui/Hovercard";

const authorCard = Effect.gen(function* () {
  const state = yield* Hovercard.makeState({ id: "ada-lovelace-card" });

  return [
    Hovercard.Anchor({ state, props: { tabindex: 0 }, content: "Ada Lovelace" }),
    Hovercard.Content({
      state,
      label: "Ada Lovelace",
      content: html`<a href="/authors/ada-lovelace">Read profile</a>`,
    }),
  ];
});
```

For a command list, choose `Menu`, not any of the five families above. `Menu` combines its state
with a collection so Arrow keys, typeahead, enabled-item movement, Escape, and focus restoration
have a command-specific contract. See [UI collections, focus, and keyboard behavior](/explore/ui-collections-and-focus).

## What to test

Typed provides native hosts, public `setOpen` transitions, state synchronization from native
`toggle`/`cancel`/`close` lifecycles, and type-level accessible-name constraints for `Dialog` and
`Hovercard`. Authors must provide the correct family, a meaningful trigger name, stable ids where
required, an accessible dialog/card name, content that matches the chosen contract, and an
intentional dismissal/result policy. A custom host must preserve the semantic props, event handlers,
and composed ref that the public part supplies.

Test the domain transition without rendering: create the state, call the relevant `setOpen`,
`Dialog.close`, or `Dialog.requestClose`, and assert the value or cancellation policy. Then add a
focused browser test at the native boundary:

| Family | Browser assertion worth making |
| --- | --- |
| `Disclosure` | Activating `<summary>` changes native `details.open` and `state.open`. |
| `Popover` | The target relationship or fallback opens the manual popover; `toggle` and Escape return state to closed. |
| `Dialog` | Opening creates the expected modal/non-modal behavior; accepted close and a prevented `cancel` request have different results. |
| `Tooltip` | Pointer and direct host focus open it; Escape closes it; required instructions are not trapped in its content. |
| `Hovercard` | Pointer/focus transfer from anchor into card keeps it open; Escape and leaving both regions close it. |

That split keeps application policy independently testable while proving the browser behavior that
only a real `<details>`, Popover API host, or `<dialog>` can provide.
