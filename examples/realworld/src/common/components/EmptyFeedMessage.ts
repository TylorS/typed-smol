import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

export const EmptyFeedMessage = Fx.fn("EmptyFeedMessage")(
  <A extends string>(message: RefSubjectType<A>) =>
    html`<p class="empty-feed-message">${message}</p>`,
);
