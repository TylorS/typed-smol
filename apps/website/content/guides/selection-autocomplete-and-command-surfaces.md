---
title: "Selection, autocomplete, and command surfaces"
summary: "Choose Select, Listbox, Combobox, or Menu from the interaction people perform, then compose its public state and collection parts."
section: "UI"
kind: "guide"
order: 4.5
---

A list of words is not necessarily a list of choices. Start with the action the person takes:
commit one known value, browse a visible set, edit a query while navigating matches, or invoke a
command. That decision determines both the right native/ARIA contract and what keyboard behavior
people expect.

| Person's task | Use | State and focus model |
| --- | --- | --- |
| Choose one known value from a compact control | a native `<select>`, or `Select` when a custom popup is required | `value`, `activeId`, and popup `open` are separate; the button opens a listbox |
| Browse and commit from a list that stays visible | `Listbox` | Moving real focus also commits the selected `value` |
| Type text and navigate matching suggestions | `Combobox` | The native input retains focus; `activeId` is exposed with `aria-activedescendant` |
| Run Save, Duplicate, or Export | `Menu` | Items are actions, not a form value; a trigger opens a menu and focus returns on Escape |

Prefer the browser's `<select>` for ordinary form data. Use the compound `Select` only when a
button, a [native popover](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API), and
custom-rendered options are genuine requirements. A `Menu` is never a substitute for a country
or timezone field: its items execute commands.

## A workspace picker: Select or Listbox

Suppose a project has three known environments. A compact header control is a `Select`; its button
opens a `role=listbox` native popover. Stable `id`s identify options, while `value`s are the data
the application keeps. The `collection` is the mounted-item registry that gives keyboard movement,
typeahead, disabled-item handling, focus, and DOM order something concrete to operate on.

```ts
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui";
import * as Select from "@typed/ui/Select";

export const EnvironmentPicker = component(function* () {
  const state = yield* Select.makeState({ id: "environment", value: "production" });
  const collection = yield* Select.makeCollection();

  return [
    Select.Trigger({
      state,
      content: state.pipe(RefSubject.map(({ value }) => `Environment: ${value}`)),
    }),
    Select.Content({
      state,
      collection,
      content: [
        Select.Option({
          state,
          collection,
          id: "development",
          value: "development",
          content: "Development",
        }),
        Select.Option({
          state,
          collection,
          id: "staging",
          value: "staging",
          content: "Staging",
        }),
        Select.Option({
          state,
          collection,
          id: "production",
          value: "production",
          content: "Production",
        }),
      ],
    }),
  ];
});
```

`Select.Trigger` renders a native button with `aria-haspopup="listbox"`, `aria-expanded`, and a
native popover target. `Select.Content` renders the manual popover listbox and `Select.Option`
renders `role=option` with `aria-selected`. Arrow/Home/End move the active option; Enter or Space
commits it; printable keys type ahead; Escape closes the popup and restores the trigger. Moving
only changes `activeId`; `Select.select(state, id, value)` changes the value and closes it.

On a settings page where all environments are already visible, use `Listbox` instead. Its
`Root`, `Option`, `makeState`, and `makeCollection` have the same stable-id and collection shape,
but roving focus immediately selects the focused option. Give the root an accessible `label`.

```ts
import { component } from "@typed/ui";
import * as Listbox from "@typed/ui/Listbox";

export const EnvironmentList = component(function* () {
  const state = yield* Listbox.makeState({ value: "staging", activeId: "staging" });
  const collection = yield* Listbox.makeCollection();

  return Listbox.Root({
    state,
    collection,
    label: "Environment",
    content: [
      Listbox.Option({ state, collection, id: "development", value: "development", content: "Development" }),
      Listbox.Option({ state, collection, id: "staging", value: "staging", content: "Staging" }),
      Listbox.Option({ state, collection, id: "production", value: "production", content: "Production" }),
    ],
  });
});
```

`Listbox.Root` supplies `role=listbox`, `aria-label`, and the active-descendant relationship;
each `Listbox.Option` supplies `role=option`, `aria-selected`, and `aria-disabled`. Focus the
root to initialize the first enabled choice, then use arrows or typeahead to move through mounted
options in DOM order. Call `Listbox.select` or `Listbox.move` when testing the state transition
without a browser.

## Search a city; keep commands separate

For a city field, typed text is the primary interaction, so use `Combobox`. Filtering is
application policy: derive each item's `hidden` property from the query. The component detects
hidden mounted options and skips them during keyboard navigation; it does not guess a remote
query, loading state, or whether arbitrary text is valid.

```ts
import { RefSubject } from "@typed/fx";
import { component } from "@typed/ui";
import { html } from "@typed/template";
import * as Combobox from "@typed/ui/Combobox";

const cities = ["Amsterdam", "Boston", "Chicago"] as const;

export const CitySearch = component(function* () {
  const state = yield* Combobox.makeState({ id: "city" });
  const collection = yield* Combobox.makeCollection();
  const hiddenUnlessMatching = (city: string) =>
    RefSubject.map(
      state,
      ({ value }) => value.length > 0 && !city.toLocaleLowerCase().includes(value.toLocaleLowerCase()),
    );

  return html`<div>
    <label for="city-input">City</label>
    ${Combobox.Input({ state, collection, placeholder: "Search cities" })}
    ${Combobox.Popover({
      state,
      collection,
      content: cities.map((city) =>
        Combobox.Item({
          state,
          collection,
          id: city.toLocaleLowerCase(),
          value: city,
          content: city,
          props: { "?hidden": hiddenUnlessMatching(city) },
        }),
      ),
    })}
  </div>`;
});
```

`Combobox.Input` is a native input with `role=combobox`, `aria-controls`, `aria-expanded`, and
`aria-activedescendant`; the input id for `id: "city"` is `city-input`, so the native label above
is correctly associated. `Combobox.Popover` is the controlled `role=listbox` native popover and
each `Combobox.Item` is a `role=option`. Input focus opens the suggestions. Arrow keys change the
active id but keep DOM focus in the input, Enter selects the active item and closes it, and Escape
closes it. `Combobox.setValue(state, query)` is the public state transition to exercise when
testing filtering behavior.

Use a separate `Menu` for adjacent workspace actions. Its caller-owned click handler performs the
command; `Menu` supplies the popup, keyboard traversal, item activation, and focus restoration.

```ts
import * as Effect from "effect/Effect";
import { component } from "@typed/ui";
import * as Menu from "@typed/ui/Menu";

export const WorkspaceActions = component(function* () {
  const state = yield* Menu.makeState({ id: "workspace-actions" });
  const collection = yield* Menu.makeCollection();

  return [
    Menu.Trigger({ state, content: "Workspace actions" }),
    Menu.Content({
      state,
      collection,
      label: "Workspace actions",
      content: [
        Menu.Item({
          state,
          collection,
          id: "export",
          content: "Export report",
          props: { onclick: Effect.log("export report") },
        }),
        Menu.Item({
          state,
          collection,
          id: "duplicate",
          content: "Duplicate workspace",
          props: { onclick: Effect.log("duplicate workspace") },
        }),
      ],
    }),
  ];
});
```

`Menu.Trigger` is a button with `aria-haspopup="menu"`; `Menu.Content` is a manual native
popover with `role=menu`; and `Menu.Item` is a `role=menuitem`. Arrow keys and typeahead rove
focus through the registered items, Enter/Space activates the focused command, and Escape returns
focus to the trigger. `Menu.setOpen(state, open)` is useful for an application-driven open/close
transition. For toggles and mutually exclusive commands, use `Menu.CheckboxItem` and
`Menu.RadioItem` with caller-owned `checked` state rather than turning menu items into values.

## Keep the contracts intact, then test them

Typed provides the state constructors, collection registration, native popover wiring, roles, ARIA
relationships, keyboard/focus behavior, typeahead, and browser-level tests for these contracts.
Authors must provide stable IDs and text values, visible labels, selected-value ownership, the
filter/query/loading/error policy for comboboxes, and the actual effects behind commands. If a
custom host is necessary, retain the props, event handlers, and composed refs received at the DOM
boundary; replacing them with role attributes alone breaks the contract.

Test one layer at a time. Unit-test `Select.select`, `Listbox.select`/`Listbox.move`,
`Combobox.setValue`, and `Menu.setOpen` by reading the resulting state. Then use browser tests for
the behavior state alone cannot prove: the emitted button/input/listbox/menu relationships,
Arrow/Enter/Escape and typeahead, hidden-option filtering, DOM focus versus
`aria-activedescendant`, disabled items, and focus restoration. The [WAI-ARIA Authoring Practices
patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) define the interaction vocabulary; the native
HTML and ARIA output is the implementation contract to assert.

Shared collection and focus mechanics are covered in [UI collections, focus, and keyboard behavior](/explore/ui-collections-and-focus).

## Make query, selection, and persistence explicit

A filtered combobox has several distinct values: the current input text, the active keyboard
candidate, the selected domain record, and possibly a persisted form value. Decide which change
commits the domain value. Typing a city name is not proof that the person selected a city ID.
Keep a selected ID in application state when the server requires one, and clear or revalidate it
when the input changes. A popup choice also does not automatically become a native named form
control; integrate its value with [Form](/explore/forms-as-a-browser-contract) deliberately.

For remote suggestions, derive the query from state, suppress repeated queries, and use
[Fx switching](/explore/fx-higher-order-and-concurrency) when a new query should interrupt an older
request. Render loading, no matches, and request failure as distinct states. Keep non-option status
text outside the option collection so keyboard movement cannot select “Loading…”. Do not hide a
selected option and leave `activeId` pointing at an unrelated or missing element; reconcile active
identity when the result set changes.

When results reorder, render them with [keyed collections](/explore/keyed-template-collections).
Use a domain ID for the key and a document-unique DOM ID for the option. Two city pickers on the
same screen need different root and option IDs even if their result data is identical.

See [Select](/reference/modules/%40typed%2Fui%2FSelect),
[Listbox](/reference/modules/%40typed%2Fui%2FListbox),
[Combobox](/reference/modules/%40typed%2Fui%2FCombobox), and
[Menu](/reference/modules/%40typed%2Fui%2FMenu) for public state and part signatures.
Their lazy work composes with [Effect v4](https://effect.website/docs/v4).
