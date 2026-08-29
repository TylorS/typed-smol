import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import {
  EventHandler,
  html,
  type Renderable,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export interface State {
  readonly activeId: string | null;
  readonly expandedIds: readonly string[];
  readonly loop: boolean;
}

export interface InitialState {
  readonly activeId?: string | null;
  readonly expandedIds?: readonly string[];
  readonly loop?: boolean;
}

export const StateSchema = Schema.Struct({
  activeId: Schema.NullOr(Schema.String),
  expandedIds: Schema.Array(Schema.String),
  loop: Schema.Boolean,
});

export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, {
    activeId: initial.activeId ?? null,
    expandedIds: [...(initial.expandedIds ?? [])],
    loop: initial.loop ?? true,
  });
}

export interface ItemValue {
  readonly parentId?: string;
  readonly hasChildren: boolean;
}

export const makeCollection = Collection.makeState<ItemValue>;

export function isExpanded(state: State, id: string): boolean {
  return state.expandedIds.includes(id);
}

export function expand<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  id: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) =>
    isExpanded(current, id) ? current : { ...current, expandedIds: [...current.expandedIds, id] },
  );
}

export function collapse<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  id: string,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({
    ...current,
    expandedIds: current.expandedIds.filter((expanded) => expanded !== id),
  }));
}

export function activate<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  activeId: string | null,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId }));
}

export interface RootOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<ItemValue>>;
  readonly label: Renderable.Any<string | null | undefined>;
  readonly content: Renderable.Any;
}

function rootInternalProps<const Options extends RootOptions>(options: Options) {
  const onfocus =
    options.collection === undefined
      ? undefined
      : Effect.gen(function* () {
          const current = yield* options.state;
          if (current.activeId !== null) return;
          const first = Composite.moveActiveId(
            visibleItems(yield* options.collection!, current),
            current,
            "first",
          );
          if (first === null) return;
          yield* activate(options.state, first);
          yield* focusItem(options.collection!, first);
        });
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn((event: KeyboardEvent) => onKeyDown(options.state, options.collection!, event)),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "tree",
      "aria-label": property("label", undefined),
      tabindex: RefSubject.map(options.state, (state) => (state.activeId === null ? 0 : -1)),
      onfocus,
      onkeydown,
      ref: options.state,
    }) as const;
}
type RootInternalProps<Options extends RootOptions> = ReturnType<
  ReturnType<typeof rootInternalProps<Options>>
>;

export function Root<const Options extends RootOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RootInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    RootInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, rootInternalProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

export interface ItemOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<ItemValue>>;
  readonly id: string;
  readonly parentId?: string;
  readonly level?: number;
  readonly hasChildren?: boolean;
  readonly disabled?: boolean;
  readonly content: Renderable.Any;
}

function itemInternalProps<const Options extends ItemOptions>(options: Options) {
  const hasChildren = options.hasChildren ?? false;
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: { parentId: options.parentId, hasChildren },
          textValue: options.id,
          disabled: options.disabled,
        });
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id: options.id,
      role: "treeitem",
      "aria-level": property("level", 1),
      "aria-expanded": hasChildren
        ? RefSubject.map(options.state, (state) => isExpanded(state, options.id))
        : undefined,
      "aria-disabled": options.disabled ?? false,
      tabindex: RefSubject.map(options.state, (state) => (state.activeId === options.id ? 0 : -1)),
      onfocus: activate(options.state, options.id),
      onclick: options.disabled === true ? Effect.void : activate(options.state, options.id),
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type ItemInternalProps<Options extends ItemOptions> = ReturnType<
  ReturnType<typeof itemInternalProps<Options>>
>;

export function Item<const Options extends ItemOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ItemInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    ItemInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, itemInternalProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly parentId: string;
  readonly content: Renderable.Any;
}

function groupInternalProps<const Options extends GroupOptions>(options: Options) {
  return () =>
    ({
      role: "group",
      "?hidden": RefSubject.map(options.state, (state) => !isExpanded(state, options.parentId)),
    }) as const;
}
type GroupInternalProps<Options extends GroupOptions> = ReturnType<
  ReturnType<typeof groupInternalProps<Options>>
>;

export function Group<const Options extends GroupOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, GroupInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    GroupInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    groupInternalProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

function onKeyDown(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<ItemValue>>,
  event: KeyboardEvent,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const current = yield* state;
    const items = visibleItems(yield* collection, current);
    if (event.key === "Enter" || event.key === " ") {
      const active =
        current.activeId === null
          ? undefined
          : items.find((item) => item.id === current.activeId && item.disabled !== true);
      const element = active?.element;
      const click = element === undefined ? undefined : Reflect.get(element, "click");
      if (typeof click === "function") {
        event.preventDefault();
        yield* Effect.sync(() => click.call(element));
      }
      return yield* state;
    }
    const direction = Composite.keyMove(event, { orientation: "vertical" });
    if (direction !== undefined) {
      event.preventDefault();
      const next = Composite.moveActiveId(items, current, direction);
      if (next === null) return current;
      yield* activate(state, next);
      yield* focusItem(collection, next);
      return yield* state;
    }

    const active =
      current.activeId === null
        ? undefined
        : (yield* collection).find((item) => item.id === current.activeId);
    if (active === undefined) return current;
    const value = active.value;
    if (event.key === "ArrowRight" && value?.hasChildren) {
      event.preventDefault();
      if (!isExpanded(current, active.id)) return yield* expand(state, active.id);
      const child = items.find((item) => item.value?.parentId === active.id);
      if (child === undefined) return current;
      yield* activate(state, child.id);
      yield* focusItem(collection, child.id);
      return yield* state;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (value?.hasChildren && isExpanded(current, active.id))
        return yield* collapse(state, active.id);
      if (value?.parentId === undefined) return current;
      yield* activate(state, value.parentId);
      yield* focusItem(collection, value.parentId);
      return yield* state;
    }
    return current;
  });
}

function visibleItems(
  items: Collection.State<ItemValue>,
  state: State,
): readonly Collection.Item<ItemValue>[] {
  const ordered = Collection.byDomOrder(items);
  return ordered.filter((item) => {
    let parentId = item.value?.parentId;
    while (parentId !== undefined) {
      if (!isExpanded(state, parentId)) return false;
      parentId = ordered.find((candidate) => candidate.id === parentId)?.value?.parentId;
    }
    return true;
  });
}

function focusItem(
  collection: RefSubject.RefSubject<Collection.State<ItemValue>>,
  id: string,
): Effect.Effect<void> {
  return Effect.flatMap(collection, (items) =>
    Composite.focusElement(items.find((item) => item.id === id)?.element),
  );
}
