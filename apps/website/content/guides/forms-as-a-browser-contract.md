---
title: "Forms as a browser contract"
summary: "Build schema-bound forms from native controls while keeping values, validation, submission, and accessibility relationships explicit."
section: "UI"
kind: "guide"
order: 4.3
---

A form is a browser interaction before it is application state. Someone must be able to find a
label, enter a value with the native control, correct an error, and submit with the keyboard.
`@typed/ui/Form` keeps those jobs on `<form>`, `<label>`, `<input>`, `<select>`, and `<button>`;
the application owns the decoded values, validation messages, interaction metadata, and the work
performed after a valid submission.

For the browser baseline, read the [HTML form element](https://html.spec.whatwg.org/multipage/forms.html#the-form-element),
[MDN's form guide](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms),
and [ARIA error identification guidance](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA21).

## Start with one typed model

Build a trial-request form from the value that the application actually needs. `Form.make` accepts
one `Schema.Struct`; every bound control below infers a compatible field name from that Struct.
The number field has a string browser representation but a decoded `number` in the submit handler.

```ts
import { Effect, Schema } from "effect";
import { html } from "@typed/template";
import * as Form from "@typed/ui/Form";

const TrialRequest = Form.make(
  Schema.Struct({
    email: Schema.String,
    teamSize: Schema.FiniteFromString.pipe(Schema.check(Schema.isGreaterThan(0))),
    plan: Schema.String,
    productUpdates: Schema.Boolean,
  }),
);

const trialRequestView = Effect.gen(function* () {
  const form = yield* TrialRequest.state(
    { email: "", teamSize: 1, plan: "starter", productUpdates: false },
    { id: "trial-request" },
  );

  return TrialRequest.Root({
    form,
    content: [
      TrialRequest.Label({ for: "trial-email", content: "Work email" }),
      TrialRequest.Description({
        props: { id: "trial-email-help" },
        content: "We will use this only to set up your trial.",
      }),
      TrialRequest.EmailInput({
        name: "email",
        props: { id: "trial-email", autocomplete: "email", required: true },
      }),
      TrialRequest.Error({ name: "email" }),

      TrialRequest.Label({ for: "trial-team-size", content: "People on your team" }),
      TrialRequest.NumberInput({
        name: "teamSize",
        props: { id: "trial-team-size", min: 1, required: true },
      }),
      TrialRequest.Error({ name: "teamSize" }),

      TrialRequest.Label({ for: "trial-plan", content: "Plan" }),
      TrialRequest.Select({
        name: "plan",
        props: { id: "trial-plan" },
        content: html`<option value="starter">Starter</option>
          <option value="team">Team</option>`,
      }),
      TrialRequest.Error({ name: "plan" }),

      TrialRequest.Group({
        label: "Email preferences",
        content: [
          TrialRequest.Checkbox({
            name: "productUpdates",
            props: { id: "trial-product-updates" },
          }),
          TrialRequest.Label({
            for: "trial-product-updates",
            content: "Send me product updates",
          }),
        ],
      }),

      TrialRequest.Submit({ content: "Start trial" }),
      TrialRequest.Reset({ content: "Clear form" }),
    ],
    onValidSubmit: Effect.fn((values) =>
      Effect.log(`Create ${values.plan} trial for ${values.email} (${values.teamSize} people)`),
    ),
  });
});
```

`trialRequestView` describes state construction and UI; it does not mount anything. The renderer's
existing Scope owns the resulting DOM listeners and subscriptions, while the `FormState` remains a
separate application value.

The `id` is intentionally stable. It makes generated error IDs deterministic across server rendering
and browser hydration.

## Add native semantics before custom behavior

The example is ordinary HTML in the places where HTML already has the right behavior:

- `EmailInput`, `NumberInput`, `Checkbox`, and `Select` produce their corresponding native
  controls. A mismatched field, such as `NumberInput({ name: "email" })`, is rejected at compile
  time.
- `Label({ for, content })` gives the control an accessible name and browser click-to-focus
  behavior. Use a stable control ID whenever the label is separate from the control.
- `Select` accepts real `option` and `optgroup` markup; let the browser supply its keyboard and
  form semantics before reaching for a custom select or combobox.
- `Submit` is a native `type="submit"` button, so Enter and assistive-technology activation reach
  the form's one submit handler. `Reset` restores Typed's state rather than letting DOM and state
  drift apart.

`Form.Description` is deliberately a neutral host for visible instructions; it does not invent a
relationship to a control. `Form.Error` is different: when a field has an error, it renders a
`role="alert"` region and the field receives the matching `aria-invalid` and `aria-describedby`.
In the current public contract that error relationship is authoritative, so do not set a competing
`aria-describedby` on a form control just to link a description. Put essential instructions in a
clear label or visible nearby text, and use a custom control only if you can preserve every prop,
ref, and event that Form supplies.

## Let the form validate, then submit decoded values

On a submit event, `Root` prevents the browser navigation, validates the whole decoded state, and
calls `onValidSubmit` only on success. It sets `state.submitting` for the lifetime of an async
handler and clears it even when that work fails or is interrupted. Field edits decode immediately;
failed decoding retains the last valid decoded value and records a field error.

Use browser constraints such as `required`, `min`, `autocomplete`, and a suitable input type for
their immediate platform feedback. Put the application invariant in the Schema as well: the
`teamSize` schema above still rejects zero or a negative decoded value, including a value set by
application code. Have `onValidSubmit` perform the server request and translate a rejected request
into the product's recovery state; a form schema cannot decide that policy for you.

Typed provides schema decoding, type-compatible field bindings, whole-form validation, native
submit/reset handling, `submitting` lifetime, and error attributes/alerts. Authors must provide
meaningful labels and instructions, stable IDs, appropriate native metadata, valid select options,
a real success action, and useful recovery copy for server failures.

### Keep submission state visible

`submitting` describes work in progress; it does not itself disable controls or make the server
operation idempotent. Bind it to the UI and put duplicate-write policy in the submit service when
more than one action can reach that service.

```ts
import { Effect, Schema } from "effect";
import { RefSubject } from "@typed/fx";
import * as Form from "@typed/ui/Form";

const Profile = Form.make(Schema.Struct({ name: Schema.String }));

const profileView = Effect.gen(function* () {
  const form = yield* Profile.state({ name: "Ada" }, { id: "profile" });
  const submitting = form.pipe(RefSubject.map((current) => current.submitting));

  return Profile.Root({
    form,
    props: { "aria-busy": submitting },
    content: [
      Profile.Label({ for: "profile-name", content: "Display name" }),
      Profile.TextInput({ name: "name", props: { id: "profile-name" } }),
      Profile.Error({ name: "name" }),
      Profile.Submit({
        content: "Save profile",
        props: { "?disabled": submitting },
      }),
    ],
    onValidSubmit: (values) => Effect.log(`Save ${values.name}`),
  });
});
```

A server rejection is different from a decoding error. Keep the entered values available for
correction and show the server's useful explanation. The form does not infer field errors from an
HTTP response or retry mutations on its own. Neither native input constraints nor client Schema
validation replace validation and authorization at the server boundary.

### Choose defaults, reset, and encoded values deliberately

The initial object passed to `state` contains decoded values: `teamSize: 1`, not the string `"1"`.
The field Codec bridges native strings and those values. This matters when editing an incomplete
number: the browser can temporarily hold text that cannot be decoded, while the form keeps its last
valid value and an error. Do not read the DOM's text as if it were validated domain state.

Use `Form.setValue` for a programmatic field change and `Form.validate` when a non-submit command
needs the same invariant. Keep whole-form defaults stable for the instance and distinguish “reset
to the initial values” from “load another record”. A second record should get the intended state
and IDs, rather than inheriting touched/error metadata from the previous record.

For a reusable form field component, accept the bound factory or the explicit Form state that owns
that field. Avoid introducing a second local RefSubject for the same value. Nested markup does not
need nested `<form>` elements: compose groups and controls within one Root.

### Choose a bound control from the field Codec

The bound factory covers more than the controls used above:

| Field contract | Bound parts |
| --- | --- |
| A string represented by a native string input | `TextInput`, `SearchInput`, `EmailInput`, `UrlInput`, `TelInput`, `PasswordInput`, `HiddenInput`, `ColorInput`, `TimeInput`, `DateTimeLocalInput`, `MonthInput`, `WeekInput` |
| A number represented by a string Codec | `NumberInput`, `RangeInput` |
| A Date represented by a string Codec | `DateInput` |
| A custom string Codec | `MaskedInput` |
| Boolean selection | `Checkbox` |
| A string chosen from native options | `Select` |
| An array field edited by explicit actions | `Push`, `Remove` |

Choose both the decoded value and its encoded representation before choosing the input. A custom
Codec still needs an input whose browser representation it understands. For arrays, `Push` and
`Remove` change state; they do not render an entire repeated field editor. Compose the fields with
[keyed templates](/explore/keyed-template-collections), give each logical item a stable identity,
and keep labels/error relationships unique across rows. These helpers do not invent nested field
paths; define how an item editor updates its parent array explicitly.

The state-explicit API is useful when a library component receives state from its caller:
`Form.makeState`, `Form.Form`, and controls with explicit `state` and `name` keep the same underlying
contract. The schema-bound factory is usually shorter in application code because its Root
provides the current form to its descendants. Do not place a bound input outside that Root unless
you deliberately provide the required form context.

## Keep the server and browser on one boundary

Create fresh form state in each runtime from the same factory, defaults, and explicit ID. Server
rendering serializes the state through the form host's hydration ref; browser rendering restores it
and reattaches the live schema and field codecs. Render the same `trialRequestView` inner template
on both sides of the hydration host—do not replace the server form with a separately shaped client
form. The full handoff is covered in [Server rendering and hydration](/explore/server-rendering-and-hydration).

## Test state first, then one browser fact

Test the form contract without a document: programmatic state changes, whole-form validation, and
the exact error state. This test needs a Scope because `state` allocates a `RefSubject`; no renderer
is involved.

```ts
import { Effect, Exit, Schema } from "effect";
import { expect, it } from "vitest";
import * as Form from "@typed/ui/Form";

const TrialRequest = Form.make(
  Schema.Struct({ teamSize: Schema.FiniteFromString.pipe(Schema.check(Schema.isGreaterThan(0))) }),
);

const rejectsNonPositiveTeamSize = Effect.fn("rejectsNonPositiveTeamSize")(function* () {
  const form = yield* TrialRequest.state({ teamSize: 1 });
  yield* Form.setValue(form, "teamSize", 0);

  const result = yield* Effect.exit(Form.validate(form));
  const currentState = yield* form;

  expect(Exit.isFailure(result)).toBe(true);
  expect(currentState.errors.teamSize).toBeDefined();
});

it("rejects a non-positive team size before submission", () =>
  rejectsNonPositiveTeamSize().pipe(Effect.scoped, Effect.runPromise));
```

Then add a focused browser test for the platform-owned claim: a label focuses its input, a native
`input` or `change` event updates decoded state, Enter submits, an invalid field points at its
alert, or an async submission keeps `submitting` true. Avoid duplicating those facts in every
form's state test. [Testing Typed systems](/explore/testing-typed-systems) shows the renderer setup
for those assertions.

See [Form](/reference/modules/%40typed%2Fui%2FForm) for bound and state-explicit constructors,
[RefSubject state composition](/explore/composing-refsubject-state) for derived views, and
[Effect v4](https://effect.website/docs/v4) for Schema and Effect composition.
