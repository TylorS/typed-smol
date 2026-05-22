import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";

export interface AsyncDataMessage {
  readonly kind: "loading" | "error";
  readonly text: string;
}

export const Message = Fx.fn("Message")((messageRef: RefSubjectType<AsyncDataMessage>) => {
  const message = RefSubject.proxy(messageRef);
  const className = RefSubject.map(message.kind, (kind) => `async-data async-data-${kind}`);
  return html`<p class=${className}>${message.text}</p>`;
});
