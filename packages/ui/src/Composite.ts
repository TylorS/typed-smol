import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
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

export interface MoveOptions<
  Value = unknown,
  CompositeState extends State = State,
  E = never,
  R = never,
  E2 = never,
  R2 = never,
  Element extends object = globalThis.Element,
> {
  readonly state: RefSubject.RefSubject<CompositeState, E, R>;
  readonly collection: RefSubject.RefSubject<Collection.State<Value, Element>, E2, R2>;
  readonly includeDisabled?: boolean;
}

export interface ActiveIdState {
  readonly activeId: string | null;
  readonly loop: boolean;
}

export interface KeyboardEventLike {
  readonly key: string;
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  preventDefault?: () => void;
}

export interface TypeaheadBuffer {
  readonly value: string;
  readonly updatedAt: number;
}

export const StateSchema = Schema.Struct({
  activeId: Schema.NullOr(Schema.String),
  orientation: Schema.Literals(["horizontal", "vertical", "both"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, {
    activeId: initial.activeId ?? null,
    orientation: initial.orientation ?? "horizontal",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
    virtualFocus: initial.virtualFocus ?? false,
  });
}

export function move<Value, CompositeState extends State, E, R, E2, R2, Element extends object>(
  options: MoveOptions<Value, CompositeState, E, R, E2, R2, Element>,
  direction: Move,
): Effect.Effect<CompositeState, E | E2, R | R2> {
  return Effect.gen(function* () {
    const current = yield* options.state;
    const activeId = moveActiveId(
      yield* options.collection,
      current,
      direction,
      options.includeDisabled,
    );
    return yield* RefSubject.update(options.state, (state) => ({ ...state, activeId }));
  });
}

export function tabIndex<CompositeState extends State, E, R>(
  state: RefSubject.RefSubject<CompositeState, E, R>,
  id: string,
): RefSubject.Computed<0 | -1, E, R> {
  return RefSubject.map(state, (current) =>
    current.virtualFocus ? -1 : current.activeId === id ? 0 : -1,
  );
}

export function activeDescendant<CompositeState extends State, E, R>(
  state: RefSubject.RefSubject<CompositeState, E, R>,
): RefSubject.Computed<string | undefined, E, R> {
  return RefSubject.map(state, (current) =>
    current.virtualFocus && current.activeId ? current.activeId : undefined,
  );
}

export function rootTabIndex<CompositeState extends State, E, R>(
  state: RefSubject.RefSubject<CompositeState, E, R>,
): RefSubject.Computed<0 | -1, E, R> {
  return RefSubject.map(state, (current) =>
    current.virtualFocus || current.activeId === null ? 0 : -1,
  );
}

export function keyMove(
  event: Pick<KeyboardEventLike, "key">,
  options: { readonly orientation?: Orientation; readonly rtl?: boolean },
): Move | undefined {
  if (event.key === "Home") return "first";
  if (event.key === "End") return "last";

  const orientation = options.orientation ?? "horizontal";
  const rtl = options.rtl ?? false;
  if (orientation !== "vertical" && event.key === "ArrowRight") return rtl ? "previous" : "next";
  if (orientation !== "vertical" && event.key === "ArrowLeft") return rtl ? "next" : "previous";
  if (orientation !== "horizontal" && event.key === "ArrowDown") return "next";
  if (orientation !== "horizontal" && event.key === "ArrowUp") return "previous";
  return undefined;
}

export function moveByKey<
  Value,
  CompositeState extends State,
  E,
  R,
  E2,
  R2,
  Element extends object,
>(
  event: KeyboardEventLike,
  options: MoveOptions<Value, CompositeState, E, R, E2, R2, Element>,
): Effect.Effect<boolean, E | E2, R | R2> {
  return Effect.gen(function* () {
    const direction = keyMove(event, yield* options.state);
    if (direction === undefined) return false;

    event.preventDefault?.();
    yield* move(options, direction);
    return true;
  });
}

/** Moves the active item, then transfers DOM focus when the composite is not virtual-focus. */
export function moveAndFocus<
  Value,
  CompositeState extends State,
  E,
  R,
  E2,
  R2,
  Element extends object,
>(
  options: MoveOptions<Value, CompositeState, E, R, E2, R2, Element>,
  direction: Move,
): Effect.Effect<CompositeState, E | E2, R | R2> {
  return Effect.tap(
    move(options, direction),
    Effect.andThen(focusActive(options), scrollActive(options)),
  );
}

/** Focuses the active registered item. Virtual-focus composites retain focus on their container. */
export function focusActive<
  Value,
  CompositeState extends State,
  E,
  R,
  E2,
  R2,
  Element extends object,
>(
  options: MoveOptions<Value, CompositeState, E, R, E2, R2, Element>,
): Effect.Effect<void, E | E2, R | R2> {
  return Effect.gen(function* () {
    const state = yield* options.state;
    if (state.virtualFocus || state.activeId === null) return;
    const item = (yield* options.collection).find((item) => item.id === state.activeId);
    yield* focusElement(item?.element);
  });
}

/** Focuses a mounted element when it exposes the platform focus method. */
export function focusElement(element: object | undefined): Effect.Effect<void> {
  return Effect.sync(() => {
    const focus = element === undefined ? undefined : Reflect.get(element, "focus");
    if (typeof focus === "function") focus.call(element);
  });
}

/** Scrolls the active registered item into view without changing focus. */
export function scrollActive<
  Value,
  CompositeState extends State,
  E,
  R,
  E2,
  R2,
  Element extends object,
>(
  options: MoveOptions<Value, CompositeState, E, R, E2, R2, Element>,
): Effect.Effect<void, E | E2, R | R2> {
  return Effect.gen(function* () {
    const activeId = (yield* options.state).activeId;
    if (activeId === null) return;
    const element = (yield* options.collection).find((item) => item.id === activeId)?.element;
    const scrollIntoView =
      element === undefined ? undefined : Reflect.get(element, "scrollIntoView");
    if (typeof scrollIntoView === "function") {
      scrollIntoView.call(element, { block: "nearest", inline: "nearest" });
    }
  });
}

export function typeahead<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
  search: string,
  text: (item: Item) => string = (item) => item.textValue ?? item.id,
  includeDisabled = false,
): string | null {
  return typeaheadFrom(items, search, null, text, includeDisabled);
}

/** Finds the next matching enabled item after the current active item, wrapping once. */
export function typeaheadFrom<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
  search: string,
  activeId: string | null,
  text: (item: Item) => string = (item) => item.textValue ?? item.id,
  includeDisabled = false,
): string | null {
  const query = search.trim().toLocaleLowerCase();
  if (query.length === 0) return null;

  const enabled = orderedItems(items, includeDisabled);
  const index = activeId === null ? -1 : enabled.findIndex((item) => item.id === activeId);
  const ordered =
    index === -1 ? enabled : [...enabled.slice(index + 1), ...enabled.slice(0, index + 1)];
  const item = ordered.find((item) => text(item).toLocaleLowerCase().startsWith(query));

  return item?.id ?? null;
}

export function typeaheadKey(event: KeyboardEventLike): string | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null;
  return event.key.length === 1 ? event.key : null;
}

export function updateTypeaheadBuffer(
  buffer: TypeaheadBuffer,
  key: string,
  now: number,
  timeout = 500,
): TypeaheadBuffer {
  return {
    value: now - buffer.updatedAt > timeout ? key : buffer.value + key,
    updatedAt: now,
  };
}

export function orderedEnabledItems<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
): readonly Item[] {
  return Collection.enabledItems(Collection.byDomOrder(items));
}

export function moveActiveId<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
  state: ActiveIdState,
  direction: Move,
  includeDisabled = false,
): string | null {
  return moveActiveItem(items, state, direction, includeDisabled)?.id ?? null;
}

export function moveActiveItem<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
  state: ActiveIdState,
  direction: Move,
  includeDisabled = false,
): Item | undefined {
  const enabled = orderedItems(items, includeDisabled);
  if (enabled.length === 0) return undefined;
  if (direction === "first") return enabled[0];
  if (direction === "last") return enabled[enabled.length - 1];

  const index = activeIndex(enabled, state.activeId, direction, state.loop);
  return enabled[index];
}

function orderedItems<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
  includeDisabled: boolean,
): readonly Item[] {
  return includeDisabled ? Collection.byDomOrder(items) : orderedEnabledItems(items);
}

function activeIndex<Item extends Collection.Item<unknown, object>>(
  items: readonly Item[],
  activeId: string | null,
  direction: "next" | "previous",
  loop: boolean,
): number {
  if (activeId === null) return direction === "previous" && loop ? items.length - 1 : 0;

  const current = items.findIndex((item) => item.id === activeId);
  if (current === -1) return direction === "previous" && loop ? items.length - 1 : 0;
  const index = current;
  const delta = direction === "next" ? 1 : -1;
  const next = index + delta;

  if (loop) return (next + items.length) % items.length;
  return Math.min(Math.max(next, 0), items.length - 1);
}
