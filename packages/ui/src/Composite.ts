import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import * as Collection from "./Collection.js";

export type Orientation = "horizontal" | "vertical" | "both";
export type Move = "next" | "previous" | "first" | "last";

export interface State {
  readonly activeId: string | null;
  readonly orientation: Orientation;
  readonly loop: boolean;
  readonly rtl: boolean;
  readonly virtualFocus: boolean;
}

export interface InitialState {
  readonly activeId?: string | null;
  readonly orientation?: Orientation;
  readonly loop?: boolean;
  readonly rtl?: boolean;
  readonly virtualFocus?: boolean;
}

export interface MoveOptions<Value = unknown, E = never, R = never, E2 = never, R2 = never> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly collection: RefSubject.RefSubject<Collection.State<Value>, E2, R2>;
}

export interface ActiveIdState {
  readonly activeId: string | null;
  readonly loop: boolean;
}

export interface KeyboardEventLike {
  readonly key: string;
  preventDefault?: () => void;
}

export interface TypeaheadBuffer {
  readonly value: string;
  readonly updatedAt: number;
}

export function makeState(
  initial: InitialState = {},
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return RefSubject.make({
    activeId: initial.activeId ?? null,
    orientation: initial.orientation ?? "horizontal",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
    virtualFocus: initial.virtualFocus ?? false,
  });
}

export function move<Value, E, R, E2, R2>(
  options: MoveOptions<Value, E, R, E2, R2>,
  direction: Move,
): Effect.Effect<State, E | E2, R | R2> {
  return Effect.gen(function* () {
    const current = yield* options.state;
    const activeId = moveActiveId(yield* options.collection, current, direction);
    return yield* RefSubject.update(options.state, (state) => ({ ...state, activeId }));
  });
}

export function moveByKey<Value, E, R, E2, R2>(
  event: KeyboardEventLike,
  options: MoveOptions<Value, E, R, E2, R2>,
): Effect.Effect<boolean, E | E2, R | R2> {
  return Effect.gen(function* () {
    const current = yield* options.state;
    const direction = keyMove(event, current);
    if (!direction) return false;

    event.preventDefault?.();
    yield* move(options, direction);
    return true;
  });
}

export function tabIndex<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  id: string,
): Effect.Effect<0 | -1, E, R> {
  return Effect.map(state, (current) =>
    current.virtualFocus ? -1 : current.activeId === id ? 0 : -1,
  );
}

export function activeDescendant<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<string | undefined, E, R> {
  return Effect.map(state, (current) =>
    current.virtualFocus && current.activeId ? current.activeId : undefined,
  );
}

export function keyMove(
  event: { readonly key: string },
  options: { readonly orientation?: Orientation; readonly rtl?: boolean },
): Move | undefined {
  if (event.key === "Home") return "first";
  if (event.key === "End") return "last";

  const orientation = options.orientation ?? "horizontal";
  if (orientation !== "vertical" && event.key === "ArrowRight") {
    return options.rtl ? "previous" : "next";
  }
  if (orientation !== "vertical" && event.key === "ArrowLeft") {
    return options.rtl ? "next" : "previous";
  }
  if (orientation !== "horizontal" && event.key === "ArrowDown") return "next";
  if (orientation !== "horizontal" && event.key === "ArrowUp") return "previous";
  return undefined;
}

export function orderedEnabledItems<Item extends Collection.Item>(
  items: readonly Item[],
): readonly Item[] {
  return Collection.enabledItems(Collection.byDomOrder(items));
}

export function moveActiveId<Item extends Collection.Item>(
  items: readonly Item[],
  state: ActiveIdState,
  direction: Move,
): string | null {
  return moveActiveItem(items, state, direction)?.id ?? null;
}

export function moveActiveItem<Item extends Collection.Item>(
  items: readonly Item[],
  state: ActiveIdState,
  direction: Move,
): Item | undefined {
  const enabled = orderedEnabledItems(items);
  if (enabled.length === 0) return undefined;
  if (direction === "first") return enabled[0];
  if (direction === "last") return enabled[enabled.length - 1];

  const index = activeIndex(enabled, state.activeId, direction, state.loop);
  return enabled[index];
}

export function typeahead<Item extends Collection.Item>(
  items: readonly Item[],
  search: string,
  text: (item: Item) => string = (item) => item.id,
): string | null {
  const query = search.trim().toLocaleLowerCase();
  if (query.length === 0) return null;

  const item = orderedEnabledItems(items).find((item) =>
    text(item).toLocaleLowerCase().startsWith(query),
  );

  return item?.id ?? null;
}

export function typeaheadFromEvent<Item extends Collection.Item>(
  event: {
    readonly key: string;
    readonly altKey?: boolean;
    readonly ctrlKey?: boolean;
    readonly metaKey?: boolean;
    preventDefault?: () => void;
  },
  items: readonly Item[],
  text: (item: Item) => string = (item) => item.textValue ?? item.id,
): string | null {
  const key = typeaheadKey(event);
  if (!key) return null;

  const id = typeahead(items, key, text);
  if (id) event.preventDefault?.();
  return id;
}

export function typeaheadKey(event: {
  readonly key: string;
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
}): string | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null;
  return event.key.length === 1 ? event.key : null;
}

export function updateTypeaheadBuffer(
  buffer: TypeaheadBuffer,
  key: string,
  now: number,
  timeout = 500,
): TypeaheadBuffer {
  const value = now - buffer.updatedAt > timeout ? key : buffer.value + key;
  return { value, updatedAt: now };
}

function activeIndex<Item extends Collection.Item>(
  items: readonly Item[],
  activeId: string | null,
  direction: "next" | "previous",
  loop: boolean,
): number {
  if (activeId === null) return direction === "previous" && loop ? items.length - 1 : 0;

  const current = items.findIndex((item) => item.id === activeId);
  const index = current === -1 ? 0 : current;
  const delta = direction === "next" ? 1 : -1;
  const next = index + delta;

  if (loop) return (next + items.length) % items.length;
  return Math.min(Math.max(next, 0), items.length - 1);
}
