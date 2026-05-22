import { Fx, RefAsyncData } from "@typed/fx";
import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { html, many, type RenderEvent } from "@typed/template";
import type { Scope } from "effect/Scope";
import { Message, type AsyncDataMessage } from "./Message.js";

export const AsyncDataView = Fx.fn("AsyncDataView")(
  <A, E, Err, R, E2, R2>(
    data: RefAsyncData.RefAsyncData<A, E, Err, R>,
    render: (value: RefSubjectType<A>) => Fx.Fx<RenderEvent, E2, R2 | Scope>,
  ) =>
    RefAsyncData.matchFx(data, {
      NoData: () => messages(loading),
      Loading: () => messages(loading),
      Failure: () => messages(error),
      Success: render,
      Optimistic: render,
    }),
);

const messages = (items: readonly AsyncDataMessage[]) =>
  html`${many(Fx.succeed(items), (message) => message.kind, Message)}`;

const loading: readonly AsyncDataMessage[] = [{ kind: "loading", text: "Loading..." }];

const error: readonly AsyncDataMessage[] = [{ kind: "error", text: "Unable to load this page." }];
