import * as Effect from "effect/Effect";
import { RefSubject } from "@typed/fx";

export interface State {
  readonly id: string;
  readonly open: boolean;
}

interface ToggleEventLike extends Event {
  readonly newState?: string;
}

type PopoverElement = HTMLElement;

const elements = new WeakMap<object, PopoverElement>();

export function register<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
): (element: HTMLElement) => Effect.Effect<void, E, R> {
  return (element) =>
    Effect.gen(function* () {
      elements.set(state, element);
      const current = yield* state;
      if (current.open) command(element, "show");
    });
}

export function setOpen<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
  open: boolean,
  source?: HTMLElement,
): Effect.Effect<S, E, R> {
  return open ? show(state, source) : hide(state);
}

export function syncToggle<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
  event: ToggleEventLike,
): Effect.Effect<S, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    open: event.newState === "open",
  }));
}

export function show<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
  source?: HTMLElement,
): Effect.Effect<S, E, R> {
  return Effect.gen(function* () {
    const current = yield* state;
    command(find(state, current.id), "show", source);
    return yield* RefSubject.update(state, (value) => ({ ...value, open: true }));
  });
}

export function hide<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
): Effect.Effect<S, E, R> {
  return Effect.gen(function* () {
    const current = yield* state;
    command(find(state, current.id), "hide");
    return yield* RefSubject.update(state, (value) => ({ ...value, open: false }));
  });
}

export function hideFromEvent<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
  event: Event,
): Effect.Effect<S, E, R> {
  return Effect.gen(function* () {
    const current = yield* state;
    command(find(state, current.id, event), "hide");
    return yield* RefSubject.update(state, (value) => ({ ...value, open: false }));
  });
}

function find<S extends State, E, R>(
  state: RefSubject.RefSubject<S, E, R>,
  id: string,
  event?: Event,
): PopoverElement | undefined {
  return elements.get(state) ?? findInEventDocument(id, event);
}

function findInEventDocument(id: string, event?: Event): PopoverElement | undefined {
  const target = event?.currentTarget ?? event?.target;
  const document =
    typeof target === "object" && target !== null && "ownerDocument" in target
      ? (target as { readonly ownerDocument?: Document }).ownerDocument
      : undefined;
  return (document?.getElementById(id) as PopoverElement | null | undefined) ?? undefined;
}

function command(
  element: PopoverElement | undefined,
  action: "show" | "hide",
  source?: HTMLElement,
): void {
  if (!element) return;
  if (action === "show") {
    if (typeof element.showPopover === "function") element.showPopover({ source });
    return;
  }

  if (typeof element.hidePopover === "function") element.hidePopover();
}
