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
import * as Dom from "./Dom.js";
import * as Grid from "./Grid.js";
import type { HostResult } from "./Dom/Types.js";
import * as Tree from "./Tree.js";

export type State = Tree.State;
export type InitialState = Tree.InitialState;
export const StateSchema = Tree.StateSchema;
export const makeState = Tree.makeState;
export const isExpanded = Tree.isExpanded;
export const expand = Tree.expand;
export const collapse = Tree.collapse;
export const activate = Tree.activate;

export interface CellPosition extends Grid.CellPosition {
  readonly parentId?: string;
  readonly hasChildren: boolean;
}

export const makeCollection = Collection.makeState<CellPosition>;

export interface RootOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<CellPosition>>;
  readonly label: Renderable.Any<string | null | undefined>;
  readonly content: Renderable.Any;
}

function rootInternalProps<const Options extends RootOptions>(options: Options) {
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make((event: KeyboardEvent) =>
          onKeyDown(options.state, options.collection!, event),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "treegrid",
      tabindex: 0,
      "aria-label": property("label", undefined),
      "aria-activedescendant": RefSubject.map(
        options.state,
        (state) => state.activeId ?? undefined,
      ),
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
    const { props: attributes, ref } = Dom.splitRef(props);
    return html`<div ...${attributes} ref=${ref}>${content}</div>`;
  });
}

export interface RowOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly rowId: string;
  readonly parentId?: string;
  readonly level?: number;
  readonly hasChildren?: boolean;
  readonly content: Renderable.Any;
}

function rowInternalProps<const Options extends RowOptions>(options: Options) {
  const hasChildren = options.hasChildren ?? false;
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id: options.rowId,
      role: "row",
      "aria-level": property("level", 1),
      "aria-expanded": hasChildren
        ? RefSubject.map(options.state, (state) => isExpanded(state, options.rowId))
        : undefined,
    }) as const;
}
type RowInternalProps<Options extends RowOptions> = ReturnType<
  ReturnType<typeof rowInternalProps<Options>>
>;

export function Row<const Options extends RowOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RowInternalProps<Options>>,
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
    RowInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    rowInternalProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

export interface CellOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<CellPosition>>;
  readonly id: string;
  readonly rowId: string;
  readonly columnIndex: number;
  readonly parentId?: string;
  readonly hasChildren?: boolean;
  readonly content: Renderable.Any;
}

function cellInternalProps<const Options extends CellOptions>(options: Options) {
  const active = RefSubject.map(options.state, (state) => state.activeId === options.id);
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: {
            rowId: options.rowId,
            columnIndex: options.columnIndex,
            parentId: options.parentId,
            hasChildren: options.hasChildren ?? false,
          },
          textValue: options.id,
        });
  return () =>
    ({
      id: options.id,
      role: "gridcell",
      "aria-colindex": options.columnIndex,
      "?data-active": active,
      ref: register,
    }) as const;
}
type CellInternalProps<Options extends CellOptions> = ReturnType<
  ReturnType<typeof cellInternalProps<Options>>
>;

export function Cell<const Options extends CellOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, CellInternalProps<Options>>,
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
    CellInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, cellInternalProps(options), options.content, (props, content) => {
    const { props: attributes, ref } = Dom.splitRef(props);
    return html`<div ...${attributes} ref=${ref}>${content}</div>`;
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
      role: "rowgroup",
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
  collection: RefSubject.RefSubject<Collection.State<CellPosition>>,
  event: KeyboardEvent,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const current = yield* state;
    const all = yield* collection;
    const visible = visibleItems(all, current);
    const active =
      current.activeId === null ? undefined : all.find((item) => item.id === current.activeId);
    const activeValue = active?.value;
    if (
      activeValue?.columnIndex === 1 &&
      (event.key === "ArrowRight" || event.key === "ArrowLeft")
    ) {
      if (event.key === "ArrowRight" && activeValue.hasChildren) {
        event.preventDefault();
        if (!isExpanded(current, activeValue.rowId)) return yield* expand(state, activeValue.rowId);
        const child = visible.find(
          (item) => item.value?.parentId === activeValue.rowId && item.value?.columnIndex === 1,
        );
        return child === undefined ? current : yield* activate(state, child.id);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (activeValue.hasChildren && isExpanded(current, activeValue.rowId))
          return yield* collapse(state, activeValue.rowId);
        const parent =
          activeValue.parentId === undefined
            ? undefined
            : visible.find(
                (item) =>
                  item.value?.rowId === activeValue.parentId && item.value?.columnIndex === 1,
              );
        return parent === undefined ? current : yield* activate(state, parent.id);
      }
    }
    const next = Grid.moveActiveId(visible, current.activeId, event);
    if (next === undefined) return current;
    event.preventDefault();
    return yield* activate(state, next);
  });
}

function visibleItems(
  items: Collection.State<CellPosition>,
  state: State,
): readonly Collection.Item<CellPosition>[] {
  const ordered = Collection.byDomOrder(items);
  return ordered.filter((item) => {
    let parentId = item.value?.parentId;
    while (parentId !== undefined) {
      if (!isExpanded(state, parentId)) return false;
      parentId = ordered.find((candidate) => candidate.value?.rowId === parentId)?.value?.parentId;
    }
    return true;
  });
}
