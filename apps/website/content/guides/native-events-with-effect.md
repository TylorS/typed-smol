---
title: "Handle native events with Effect"
summary: "Attach real browser listeners whose work is an Effect, while keeping listener options, errors, services, and lifetime explicit."
section: "Templates"
kind: "guide"
order: 3.4
---

An event interpolation such as `onclick=${handler}` uses the platform's event model. Typed does not
create synthetic events or ask a component runtime to redispatch them. Use an `Effect` directly when
the event data is irrelevant; use `EventHandler.make` when the browser event selects the work.

Rendering installs the listener; the mount Scope owns the registration and any handler fiber it
starts. Closing that Scope removes the listener and interrupts outstanding work.

## Make an event-aware Effect handler

`EventHandler.make` receives a native-event-shaped value and can return either `void` or an Effect.
Here, form data comes from the submit event and the handler returns an Effect that performs the
submission. Its error and service requirements flow through the template just like a dynamic value's.

```ts
import { Context, Data, Effect } from "effect";
import * as EventHandler from "@typed/template/EventHandler";
import { html } from "@typed/template";

class SaveRejected extends Data.TaggedError("SaveRejected")<{
  readonly message: string;
}> {}

interface Preferences {
  readonly save: (timezone: string) => Effect.Effect<void, SaveRejected>;
}

const Preferences = Context.Service<Preferences>("Preferences");

const savePreferences = EventHandler.make(
  Effect.fn("savePreferences")(function* (event: SubmitEvent) {
    const form = event.currentTarget as HTMLFormElement;
    const timezone = new FormData(form).get("timezone");

    if (typeof timezone !== "string") {
      return yield* Effect.fail(new SaveRejected({ message: "Timezone is required" }));
    }

    const preferences = yield* Preferences;
    return yield* preferences.save(timezone);
  }),
  { preventDefault: true },
);

export const preferencesForm = html`<form onsubmit=${savePreferences}>
  <label>Timezone <input name="timezone" value="America/New_York" /></label>
  <button>Save</button>
</form>`;
```

The handler sees the browser event through a forwarding proxy. Its properties and methods forward
to the native event, while `currentTarget` identifies the delegated element; it is not object-identical
to the browser's original event. Keep event data in the handler and state transitions in a `RefSubject`
or service—neither requires a component instance.

## Native options stay native

The second `make` argument is `AddEventListenerOptions` plus Typed's three pre-handler controls:
`preventDefault`, `stopPropagation`, and `stopImmediatePropagation`. The convenience combinators
record the same options on a handler description. They do not replace capture, bubbling, passive
listeners, or default actions with framework semantics.

```ts
import { Effect } from "effect";
import * as EventHandler from "@typed/template/EventHandler";
import { html } from "@typed/template";

const recordScroll = EventHandler.make(
  (event: Event) => Effect.log(`scroll target: ${(event.currentTarget as Element | null)?.nodeName}`),
  { passive: true, capture: true },
);

const closeOnce = EventHandler.once(
  EventHandler.make(() => Effect.log("Dismissed the tip")),
);

export const interactions = html`<section onscroll=${recordScroll}>
  <button type="button" onclick=${closeOnce}>Dismiss</button>
</section>`;
```

A passive listener must not call `preventDefault`; that is a browser rule, not a Typed exception.
`EventHandler.once` removes the delegated registration after the first matching event, across its
active mounts. An unrelated event does not consume it. Use
`EventHandler.preventDefault(handler)` when composing a reusable handler whose semantic choice is
to prevent the native default action.

## Errors are not thrown across the event boundary

Expected handler failures remain in the template's `E` channel. Decide recovery near the mounted
application, or transform a reusable handler with `EventHandler.catchCause`. This example records
the failure as an Effect rather than throwing from a callback.

```ts
import { Effect } from "effect";
import * as EventHandler from "@typed/template/EventHandler";
import { html } from "@typed/template";

const submit = EventHandler.make(() => Effect.fail("Save rejected"));
const recoverSave = EventHandler.catchCause(submit, (cause) =>
  Effect.logError(`Could not save preferences: ${cause}`),
);

export const safePreferencesForm = html`<form onsubmit=${recoverSave}>
  <button>Save</button>
</form>`;
```

An application can instead let `SaveRejected` reach its error policy and render a recovery view.
The important part is that the error remains typed and visible; calling `try/catch` around a template
literal would not catch work that occurs later when a user submits the form.

## Test native behavior at the boundary

Unit-test the state/service operation separately. For this boundary, mount the form using
`DomRenderTemplate.using(document)`, dispatch a real cancelable `SubmitEvent`, and assert that the
event was prevented and the service received the submitted value. Also close the mount Scope and
assert that a later event no longer invokes the handler. This verifies browser options and resource
cleanup without relying on a synthetic-event test helper.
