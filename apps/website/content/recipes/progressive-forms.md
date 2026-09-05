---
slug: progressive-forms
title: Enhance a server form with a Typed status region
summary: Keep native submission and no-JavaScript behavior while Typed owns one live validation hint.
---

A newsletter signup or account settings form can work before JavaScript loads. The server owns the form action and authoritative validation; the browser owns normal input, constraint validation, and submission; Typed owns a small status region. This is useful when migrating one feature of a server-rendered page without replacing the whole form.

For a new fully Typed form, start with [forms as a browser contract](/explore/forms-as-a-browser-contract). This recipe instead enhances existing HTML and preserves the server's fallback path.

## Ship a functional server form first

Serve the following markup from the page. `/newsletter` is an application endpoint you implement; it must validate the submitted data and return a usable result or field errors even with JavaScript disabled. Use the server framework's normal CSRF protection for endpoints that require it.

```html
<form id="newsletter" action="/newsletter" method="post">
  <label for="newsletter-email">Email address</label>
  <input id="newsletter-email" name="email" type="email" required autocomplete="email"
    aria-describedby="newsletter-hint">
  <p id="newsletter-hint" aria-live="polite"></p>
  <button type="submit">Subscribe</button>
</form>
```

The live region starts empty; the label and native input contract do not depend on Typed. It is the only descendant range that the enhancement will render into. Do not mount a second renderer over the entire form merely to update a hint.

## Subscribe to input without taking over submit

Run this in the browser after the markup exists. Each mount has one render fiber; its owner can stop the enhancement when a server-driven navigation removes the form.

```ts
import { Effect, ManagedRuntime } from "effect";
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";
import { DomRenderTemplate, render } from "@typed/template/Render";

const form = document.getElementById("newsletter");
const input = document.getElementById("newsletter-email");
const hint = document.getElementById("newsletter-hint");
if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement) || hint === null) {
  throw new Error("Newsletter enhancement requires its server markup");
}

const hints = Fx.callback<string>((emit) => {
  const update = () => emit.succeed(
    input.value.length === 0 ? "" :
      input.validity.valid ? "Email format looks valid." : "Enter a complete email address.",
  );
  input.addEventListener("input", update);
  update();
  return Effect.sync(() => input.removeEventListener("input", update));
});

const runtime = ManagedRuntime.make(DomRenderTemplate.using(document));
runtime.runFork(Effect.scoped(Fx.drain(render(html`${hints}`, hint))));
export const removeNewsletterEnhancement = () => runtime.dispose();
```

The example never prevents submission and never claims that syntactically valid email proves deliverability. The browser retains the entered value and performs native validation. Read `validity.valid` for a hint; calling `reportValidity` on every keystroke would add intrusive browser UI. For long validation messages, consider reporting after blur rather than announcing each intermediate edit.

If application code triggers submission, use `form.requestSubmit()` when you want submit-button semantics and constraint validation. `form.submit()` bypasses that event/validation path. The [requestSubmit contract](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit) explains the distinction.

## Decode again at the server boundary

Browser validation is a convenience and can be bypassed. The following decoder accepts a real `FormData` value and rejects missing or non-string email fields. It intentionally does not claim to validate email deliverability; add your server's documented email policy and confirmation workflow there.

```ts
import { Schema } from "effect";

const Newsletter = Schema.Struct({ email: Schema.String });
export const decodeNewsletter = (data: FormData) =>
  Schema.decodeUnknownEffect(Newsletter)({ email: data.get("email") });
```

For repeated field names, use `getAll` and decode an array. Checkboxes and disabled controls have distinct submission semantics; do not infer a domain object by blindly treating every form key as one string. Keep that mapping next to server validation. See the [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData).

## Verify both paths

Submit with JavaScript disabled and inspect successful and invalid server responses. With the enhancement enabled, type an invalid address, fix it, submit with Enter, and submit with the button. The result should follow the same endpoint and browser validation behavior.

Then remove the page through the actual navigation mechanism and call `removeNewsletterEnhancement`; assert that its listener stops. If your server navigation reuses the same page module, recreate the enhancement for the new elements rather than keeping references to removed DOM. A browser test should preserve the input's node identity, value, and focus while the Typed hint changes. No hydration is needed for this empty, dedicated status region.
