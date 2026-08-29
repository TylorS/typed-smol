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

  let userActive = true;
  let internalActive = true;
  const passive =
    userHandler.options?.preventDefault === true ||
    internalHandler.options?.preventDefault === true ||
    userHandler.options?.passive === false ||
    internalHandler.options?.passive === false
      ? false
      : (userHandler.options?.passive ?? internalHandler.options?.passive);
  const options = {
    capture: userHandler.options?.capture ?? internalHandler.options?.capture,
    passive,
  };
  return EventHandler.make((event: Ev) => {
    const tracked = trackPreventDefault(event);
    const userEffect =
      userActive && userHandler.options?.signal?.aborted !== true
        ? userHandler.handler(tracked.event)
        : Effect.void;
    if (userActive && userHandler.options?.signal?.aborted !== true) {
      if (userHandler.options?.once === true) userActive = false;
    }
    if (
      tracked.defaultPrevented() ||
      !internalActive ||
      internalHandler.options?.signal?.aborted === true
    ) {
      return userEffect;
    }

    if (internalHandler.options?.once === true) internalActive = false;
    const internalEffect = internalHandler.handler(event);
    return Effect.andThen(userEffect, () =>
      tracked.defaultPrevented() ? Effect.void : internalEffect,
    );
  }, options);
}

function trackPreventDefault<Ev extends Event>(
  event: Ev,
): {
  readonly event: Ev;
  readonly defaultPrevented: () => boolean;
} {
  let defaultPrevented = event.defaultPrevented;
  return {
    event: new Proxy(event, {
      get(target, property) {
        if (property === "defaultPrevented") return defaultPrevented;
        if (property === "preventDefault") {
          return () => {
            defaultPrevented = true;
            event.preventDefault();
          };
        }
        const value = Reflect.get(target, property);
        return typeof value === "function" ? value.bind(target) : value;
      },
    }),
    defaultPrevented: () => defaultPrevented,
  };
}

export function isEventKey(key: string): key is EventHandlerProperty {
  return key[0] === "@" || (key[0] === "o" && key[1] === "n");
}

export function currentTarget<Target extends EventTarget>(event: Event): Target {
  if (event.currentTarget === null) {
    throw new TypeError(
      "An event handler can only read its current target while handling an event",
    );
  }
  return event.currentTarget as Target;
}

export function toggleState(event: Event): "open" | "closed" | undefined {
  const value = Reflect.get(event, "newState");
  return value === "open" || value === "closed" ? value : undefined;
}

function toEventHandler<Ev extends Event, E, R>(
  handler: EventHandlerInput<Ev, E, R>,
): EventHandler.EventHandler<Ev, E, R> | undefined {
  return handler == null ? undefined : EventHandler.fromEffectOrEventHandler(handler);
}
