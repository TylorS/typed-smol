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
import type { HostResult } from "./Dom/Types.js";

export interface State {
  readonly activeId: string | null;
}

export interface InitialState {
  readonly activeId?: string | null;
}

export const StateSchema = Schema.Struct({ activeId: Schema.NullOr(Schema.String) });

export function makeState(initial: InitialState = {}) {
  return RefSubject.hydrate(StateSchema, { activeId: initial.activeId ?? null });
}

export interface CellPosition {
  readonly rowId: string;
  readonly columnIndex: number;
}

export const makeCollection = Collection.makeState<CellPosition>;

export function activate<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  activeId: string | null,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, activeId }));
}

export interface RootOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<CellPosition>>;
  readonly label: Renderable.Any<string | null | undefined>;
  readonly content: Renderable.Any;
  readonly multiselectable?: Renderable.Any<boolean | null | undefined>;
}

function rootInternalProps<const Options extends RootOptions>(options: Options) {
  const onfocus =
    options.collection === undefined
      ? undefined
      : Effect.gen(function* () {
          if ((yield* options.state).activeId !== null) return;
          const first = Collection.byDomOrder(yield* options.collection!)[0];
          if (first !== undefined) yield* activate(options.state, first.id);
        });
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn((event: KeyboardEvent) => onKeyDown(options.state, options.collection!, event)),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "grid",
      tabindex: 0,
      "aria-label": property("label", undefined),
      "aria-activedescendant": RefSubject.map(
        options.state,
        (state) => state.activeId ?? undefined,
      ),
      "aria-multiselectable": property("multiselectable", false),
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

export interface RowOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: Renderable.Any;
  readonly rowIndex?: Renderable.Any<number | null | undefined>;
}

function rowInternalProps<const Options extends RowOptions>({
  property,
}: Dom.InternalPropsHelpers<Options>) {
  return { role: "row", "aria-rowindex": property("rowIndex", undefined) } as const;
}
type RowInternalProps<Options extends RowOptions> = ReturnType<typeof rowInternalProps<Options>>;

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
    rowInternalProps,
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
  readonly rowIndex?: number;
  readonly selected?: Renderable.Any<boolean | null | undefined>;
  readonly content: Renderable.Any;
}

function cellInternalProps<const Options extends CellOptions>(
  options: Options,
  role: "gridcell" | "columnheader" | "rowheader",
) {
  const active = RefSubject.map(options.state, (state) => state.activeId === options.id);
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: { rowId: options.rowId, columnIndex: options.columnIndex },
          textValue: options.id,
        });
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id: options.id,
      role,
      "aria-colindex": options.columnIndex,
      "aria-rowindex": property("rowIndex", undefined),
      "aria-selected": property("selected", undefined),
      "?data-active": active,
      ref: register,
    }) as const;
}
type CellInternalProps<Options extends CellOptions> = ReturnType<
  ReturnType<typeof cellInternalProps<Options>>
>;

function cell<const Options extends CellOptions, const Host extends HostResult>(
  options: Options,
  host:
    | Dom.HostOverride<
        Dom.RenderHostProps<Options, CellInternalProps<Options>>,
        Options["content"],
        Host
      >
    | undefined,
  role: "gridcell" | "columnheader" | "rowheader",
) {
  return Dom.renderHost<HTMLDivElement>()<
    Options,
    CellInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, cellInternalProps(options, role), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

export function Cell<const Options extends CellOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, CellInternalProps<Options>>,
    Options["content"],
    Host
  >,
) {
  return cell(options, host, "gridcell");
}

export function ColumnHeader<
  const Options extends CellOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, CellInternalProps<Options>>,
    Options["content"],
    Host
  >,
) {
  return cell(options, host, "columnheader");
}

export function RowHeader<const Options extends CellOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, CellInternalProps<Options>>,
    Options["content"],
    Host
  >,
) {
  return cell(options, host, "rowheader");
}

function onKeyDown(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<CellPosition>>,
  event: KeyboardEvent,
): Effect.Effect<State, Schema.SchemaError> {
  return Effect.gen(function* () {
    const items = Collection.byDomOrder(yield* collection);
    const next = moveActiveId(items, (yield* state).activeId, event);
    if (next === undefined) return yield* state;
    event.preventDefault();
    return yield* activate(state, next);
  });
}

export function moveActiveId(
  items: readonly Collection.Item<CellPosition>[],
  activeId: string | null,
  event: Pick<KeyboardEvent, "key" | "ctrlKey">,
): string | undefined {
  if (items.length === 0) return undefined;
  if (event.ctrlKey && event.key === "Home") return items[0]?.id;
  if (event.ctrlKey && event.key === "End") return items.at(-1)?.id;
  const active = activeId === null ? undefined : items.find((item) => item.id === activeId);
  if (active === undefined || active.value === undefined)
    return event.key === "Home" ? items[0]?.id : undefined;
  const row = items.filter((item) => item.value?.rowId === active.value!.rowId);
  if (event.key === "ArrowLeft") return row.at(Math.max(0, row.indexOf(active) - 1))?.id;
  if (event.key === "ArrowRight")
    return row.at(Math.min(row.length - 1, row.indexOf(active) + 1))?.id;
  if (event.key === "Home") return row[0]?.id;
  if (event.key === "End") return row.at(-1)?.id;
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return undefined;

  const column = items.filter((item) => item.value?.columnIndex === active.value!.columnIndex);
  return column.at(column.indexOf(active) + (event.key === "ArrowUp" ? -1 : 1))?.id ?? active.id;
}
