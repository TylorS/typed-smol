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

export interface MoveOptions<Value = unknown> {
  readonly state: RefSubject.RefSubject<State>;
  readonly collection: RefSubject.RefSubject<Collection.State<Value>>;
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

export function move<Value>(options: MoveOptions<Value>, direction: Move): Effect.Effect<State> {
  return Effect.gen(function* () {
    const items = Collection.enabledItems(Collection.byDomOrder(yield* options.collection));
    const current = yield* options.state;
    const activeId = nextActiveId(items, current, direction);
    return yield* RefSubject.update(options.state, (state) => ({ ...state, activeId }));
  });
}

export function moveByKey<Value>(
  event: KeyboardEventLike,
  options: MoveOptions<Value>,
): Effect.Effect<boolean> {
  return Effect.gen(function* () {
    const current = yield* options.state;
    const direction = keyMove(event, current);
    if (!direction) return false;

    event.preventDefault?.();
    yield* move(options, direction);
    return true;
  });
}

export function tabIndex(state: RefSubject.RefSubject<State>, id: string): Effect.Effect<0 | -1> {
  return Effect.map(state, (current) =>
    current.virtualFocus ? -1 : current.activeId === id ? 0 : -1,
  );
}

export function activeDescendant(
  state: RefSubject.RefSubject<State>,
): Effect.Effect<string | undefined> {
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

export function typeahead<Item extends Collection.Item>(
  items: readonly Item[],
  search: string,
  text: (item: Item) => string = (item) => item.id,
): string | null {
  const query = search.trim().toLocaleLowerCase();
  if (query.length === 0) return null;

  const item = Collection.enabledItems(Collection.byDomOrder(items)).find((item) =>
    text(item).toLocaleLowerCase().startsWith(query),
  );

  return item?.id ?? null;
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

function nextActiveId<Value>(
  items: Collection.State<Value>,
  state: State,
  direction: Move,
): string | null {
  if (items.length === 0) return null;
  if (direction === "first") return items[0]?.id ?? null;
  if (direction === "last") return items[items.length - 1]?.id ?? null;

  const index = Math.max(
    0,
    items.findIndex((item) => item.id === state.activeId),
  );
  const delta = direction === "next" ? 1 : -1;
  const next = index + delta;

  if (state.loop) return items[(next + items.length) % items.length]?.id ?? null;
  return items[Math.min(Math.max(next, 0), items.length - 1)]?.id ?? null;
}
