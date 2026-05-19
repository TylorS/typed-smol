import * as AsyncData from "@typed/async-data";
import { Fx, RefSubject } from "@typed/fx";
import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { html, many, type RenderEvent } from "@typed/template";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import type { Scope } from "effect/Scope";

interface AsyncDataMessage {
  readonly kind: "loading" | "error";
  readonly text: string;
}

export const AsyncDataMessages = <A, E, Err, R>(
  data: RefSubject.Computed<AsyncData.AsyncData<A, E>, Err, R>,
) =>
  html`${many(Fx.map(data, asyncDataMessages), (message) => message.kind, Message)}`;

export const AsyncDataSuccess = <A, E, Err, R, E2, R2>(
  data: RefSubject.Computed<AsyncData.AsyncData<A, E>, Err, R>,
  render: (value: RefSubjectType<A>) => Fx.Fx<RenderEvent, E2, R2 | Scope>,
) => {
  const success = Fx.switchMap(data, (value) =>
    Option.match(AsyncData.getSuccess(value), {
      onNone: () => Fx.empty,
      onSome: (current) => Fx.unwrap(Effect.map(RefSubject.make(current), render)),
    })
  );

  return html`${success}`;
};

const asyncDataMessages = <A, E>(
  data: AsyncData.AsyncData<A, E>,
): readonly AsyncDataMessage[] =>
  AsyncData.match(data, {
    NoData: () => loading,
    Loading: () => loading,
    Failure: () => error,
    Success: () => [],
    Optimistic: () => [],
  });

const loading: readonly AsyncDataMessage[] = [
  { kind: "loading", text: "Loading..." },
];

const error: readonly AsyncDataMessage[] = [
  { kind: "error", text: "Unable to load this page." },
];

const Message = (messageRef: RefSubjectType<AsyncDataMessage>) => {
  const message = RefSubject.proxy(messageRef);
  const className = RefSubject.map(message.kind, (kind) => `async-data async-data-${kind}`);
  return html`<p class=${className}>
    ${message.text}
  </p>`;
};
