import * as Schema from "effect/Schema";
import { Fx, RefSubject } from "@typed/fx";
import { hydrate } from "@typed/fx/RefSubject";
import { BrowserRouter } from "@typed/router/Router";
import { EventHandler, html } from "@typed/template";
import * as ButtonComponent from "../src/Button.js";
import * as CheckboxComponent from "../src/Checkbox.js";
import * as FormComponent from "../src/Form.js";
import { Link as LinkComponent } from "../src/Link.js";
import * as MeterComponent from "../src/Meter.js";
import * as RadioGroupComponent from "../src/RadioGroup.js";
import * as SliderComponent from "../src/Slider.js";
import * as SpinButtonComponent from "../src/SpinButton.js";
import * as SwitchComponent from "../src/Switch.js";
import { story } from "./story.js";

export default { title: "Inputs" };

const button = Fx.gen(function* () {
  const state = yield* hydrate(Schema.FiniteFromString, 0, { name: "button-story" });
  const saveStatus = RefSubject.map((count: number) =>
    count === 0 ? "Changes pending" : `Changes saved ${count} time${count === 1 ? "" : "s"}`,
  )(state);
  const hydrateState = RefSubject.hydrateAll(state);

  return html`<section aria-label="Save changes" ref=${hydrateState}>
    <p>Use the typed event handler to persist the change.</p>
    ${ButtonComponent.Button({
      content: "Save changes",
      onclick: EventHandler.make(() => RefSubject.update(state, (count) => count + 1)),
    })}
    <output aria-live="polite">${saveStatus}</output>
  </section>`;
});

export const Button = story(button);

const checkbox = Fx.gen(function* () {
  const state = yield* CheckboxComponent.makeState({ checked: true });
  return html`<label>Subscribe to updates ${CheckboxComponent.Input({ state })}</label>`;
});

export const Checkbox = story(checkbox);

const form = Fx.gen(function* () {
  const phone = FormComponent.mask(
    "(",
    FormComponent.slot("area", Schema.FiniteFromString, { length: 3 }),
    ") ",
    FormComponent.slot("line", Schema.FiniteFromString, { length: 4 }),
  );
  const ContactForm = FormComponent.make(Schema.Struct({ email: Schema.String, phone }));
  const formState = yield* ContactForm.state({
    email: "",
    phone: { area: 555, line: 1234 },
  });

  return ContactForm.Root({
    form: formState,
    content: html`${ContactForm.Group({
      label: "Contact information",
      content: html`<div>
          ${ContactForm.Label({ for: "email", content: "Email" })}
          ${ContactForm.EmailInput({ name: "email", props: { id: "email", required: true } })}
          ${ContactForm.Error({ name: "email" })}
        </div>
        <div>
          ${ContactForm.Label({ for: "phone", content: "Phone" })}
          ${ContactForm.MaskedInput({ name: "phone", mask: phone, props: { id: "phone" } })}
          ${ContactForm.Error({ name: "phone" })}
        </div>`,
    })}
    ${ContactForm.Submit({ content: "Save" })} ${ContactForm.Reset({ content: "Reset" })}`,
  });
});

export const Form = story(form);

export const Link = story(
  Fx.provide(LinkComponent({ href: "/components", content: "Browse components" }), BrowserRouter()),
);

const meter = Fx.gen(function* () {
  const state = yield* MeterComponent.makeState({ value: 40 });
  return html`<div class="story-field">
    <label for="storage">Storage</label>
    ${MeterComponent.Meter({
      state,
      min: 0,
      max: 100,
      low: 25,
      high: 75,
      props: { id: "storage" },
    })}
  </div>`;
});

export const Meter = story(meter);

const radioGroup = Fx.gen(function* () {
  const state = yield* RadioGroupComponent.makeState({ value: "small" });
  const collection = yield* RadioGroupComponent.makeCollection();

  return RadioGroupComponent.Root({
    state,
    collection,
    label: "Size",
    content: html`<label for="small">Small</label>
      ${RadioGroupComponent.Item({ state, collection, id: "small", name: "size", value: "small" })}
      <label for="large">Large</label>
      ${RadioGroupComponent.Item({ state, collection, id: "large", name: "size", value: "large" })}`,
  });
});

export const RadioGroup = story(radioGroup);

const slider = Fx.gen(function* () {
  const state = yield* SliderComponent.makeState({ value: 60 });
  return html`<div class="story-field">
    <label for="volume">Volume</label>
    ${SliderComponent.Slider({ state, min: 0, max: 100, step: 1, props: { id: "volume" } })}
  </div>`;
});

export const Slider = story(slider);

const spinButton = Fx.gen(function* () {
  const state = yield* SpinButtonComponent.makeState({ value: 2 });
  return html`<div class="story-field">
    <label for="quantity">Quantity</label>
    ${SpinButtonComponent.SpinButton({ state, min: 0, max: 10, step: 1, props: { id: "quantity" } })}
  </div>`;
});

export const SpinButton = story(spinButton);

const switchControl = Fx.gen(function* () {
  const state = yield* SwitchComponent.makeState({ checked: true });
  return SwitchComponent.Switch({ state, content: "Notifications" });
});

export const Switch = story(switchControl);
