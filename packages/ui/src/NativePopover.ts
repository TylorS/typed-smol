import * as Effect from "effect/Effect";
import { RefSubject } from "@typed/fx";

export interface State {
  readonly id: string;
  readonly open: boolean;
}

interface ToggleEventLike extends Event {
  readonly newState?: "open" | "closed";
}

type PopoverElement = HTMLElement;

const elements = new WeakMap<object, PopoverElement>();

export function register<S extends State>(
  state: RefSubject.RefSubject<S>,
): (element: HTMLElement) => Effect.Effect<void> {
  return (element) =>
    Effect.gen(function* () {
      elements.set(state, element);
      const current = yield* state;
      if (current.open) command(element, "show");
    });
}

export function setOpen<S extends State>(
  state: RefSubject.RefSubject<S>,
  open: boolean,
  source?: HTMLElement,
): Effect.Effect<S> {
  return open ? show(state, source) : hide(state);
}

export function syncToggle<S extends State>(
  state: RefSubject.RefSubject<S>,
  event: ToggleEventLike,
): Effect.Effect<S> {
  return RefSubject.update(state, (current) => ({
    ...current,
    open: event.newState === "open",
  }));
}

export function show<S extends State>(
  state: RefSubject.RefSubject<S>,
  source?: HTMLElement,
): Effect.Effect<S> {
  return Effect.gen(function* () {
    const current = yield* state;
    command(find(state, current.id), "show", source);
    return yield* RefSubject.update(state, (value) => ({ ...value, open: true }));
  });
}

export function hide<S extends State>(state: RefSubject.RefSubject<S>): Effect.Effect<S> {
  return Effect.gen(function* () {
    const current = yield* state;
    command(find(state, current.id), "hide");
    return yield* RefSubject.update(state, (value) => ({ ...value, open: false }));
  });
}

export function hideFromEvent<S extends State>(
  state: RefSubject.RefSubject<S>,
  event: Event,
): Effect.Effect<S> {
  return Effect.gen(function* () {
    const current = yield* state;
    command(find(state, current.id, event), "hide");
    return yield* RefSubject.update(state, (value) => ({ ...value, open: false }));
  });
}

function find<S extends State>(
  state: RefSubject.RefSubject<S>,
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
