import * as Component from "@typed/astro/Component";
import * as Effect from "effect/Effect";
import * as RefSubject from "@typed/fx/RefSubject";
import { html } from "@typed/template";

export default Component.make((props: { id: string; initial: number }, slots) =>
  Effect.gen(function* () {
    const count = yield* RefSubject.make(props.initial);
    return html`<section id=${props.id}>
      <button @click=${RefSubject.update(count, (n) => n + 1)}>${count}</button
      >${slots.default}${slots.heading}
    </section>`;
  }),
);
