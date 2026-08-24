import * as Effect from "effect/Effect";
import { EventHandler } from "@typed/template";
import type { EventHandlerInput, EventHandlerProperty } from "./Types.js";

export function chainEvent<Ev extends Event, E1 = never, R1 = never, E2 = never, R2 = never>(
  user: EventHandlerInput<Ev, E1, R1>,
  internal: EventHandlerInput<Ev, E2, R2>,
): EventHandler.EventHandler<Ev, E1 | E2, R1 | R2> | undefined {
  const userHandler = toEventHandler(user);
  const internalHandler = toEventHandler(internal);
  if (!userHandler) return internalHandler;
  if (!internalHandler) return userHandler;

  return EventHandler.make(
    (event: Ev) =>
      Effect.andThen(userHandler.handler(event), () =>
        event.defaultPrevented ? Effect.void : internalHandler.handler(event),
      ),
    userHandler.options,
  );
}

export function isEventKey(key: string): key is EventHandlerProperty {
  return key[0] === "@" || (key[0] === "o" && key[1] === "n");
}

function toEventHandler<Ev extends Event, E, R>(
  handler: EventHandlerInput<Ev, E, R>,
): EventHandler.EventHandler<Ev, E, R> | undefined {
  return handler == null ? undefined : EventHandler.fromEffectOrEventHandler(handler);
}
