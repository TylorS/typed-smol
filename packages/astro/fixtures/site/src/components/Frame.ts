import * as Component from "@typed/astro/Component";
import { html } from "@typed/template";

export default Component.make(
  (props: { id: string }, slots) =>
    html`<aside id=${props.id}>${slots.default}${slots.heading}</aside>`,
);
