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

export interface State extends Composite.State {}
export type InitialState = Composite.InitialState;
export const StateSchema = Composite.StateSchema;

export function makeState(initial: InitialState = {}) {
  return Composite.makeState(initial);
}

export const makeCollection = Collection.makeState<string>;

export interface RootOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly content: Renderable.Any;
  readonly label?: Renderable.Any<string | null | undefined>;
}

function rootProps<const Options extends RootOptions>(options: Options) {
  const onfocus =
    options.collection === undefined
      ? undefined
      : Effect.gen(function* () {
          if ((yield* options.state).activeId !== null) return;
          yield* Composite.moveAndFocus(
            { state: options.state, collection: options.collection! },
            "first",
          );
        });
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make(
          Effect.fn(function* (event: KeyboardEvent) {
            if (event.key === "Enter" || event.key === " ") {
              const activeId = (yield* options.state).activeId;
              const item =
                activeId === null
                  ? undefined
                  : (yield* options.collection!).find((candidate) => candidate.id === activeId);
              const click =
                item?.disabled === true ? undefined : Reflect.get(item?.element ?? {}, "click");
              if (typeof click === "function") {
                event.preventDefault();
                yield* Effect.sync(() => click.call(item!.element));
              }
              return;
            }
            const direction = Composite.keyMove(event, yield* options.state);
            if (direction === undefined) return;
            event.preventDefault();
            yield* Composite.moveAndFocus(
              { state: options.state, collection: options.collection! },
              direction,
            );
          }),
        );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "toolbar",
      "aria-label": property("label", undefined),
      "aria-orientation": RefSubject.map(options.state, (state) => state.orientation),
      tabindex: Composite.rootTabIndex(options.state),
      onfocus,
      onkeydown,
      ref: options.state,
    }) as const;
}
type RootProps<Options extends RootOptions> = ReturnType<ReturnType<typeof rootProps<Options>>>;

export function Root<const Options extends RootOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, RootProps<Options>>,
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
    RootProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, rootProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

export const Toolbar = Root;

export interface ItemOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly id: string;
  readonly content: Renderable.Any;
  readonly textValue?: string;
  readonly disabled?: boolean;
}

function itemProps<const Options extends ItemOptions>(options: Options) {
  const activate =
    options.disabled === true
      ? Effect.void
      : RefSubject.update(options.state, (state) => ({ ...state, activeId: options.id }));
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.id,
          textValue: options.textValue ?? options.id,
          disabled: options.disabled,
        });
  return () =>
    ({
      id: options.id,
      role: "button",
      "aria-disabled": options.disabled ?? false,
      tabindex: Composite.tabIndex(options.state, options.id),
      onfocus: activate,
      ref: Dom.composeRefs(register, options.ref),
    }) as const;
}
type ItemProps<Options extends ItemOptions> = ReturnType<ReturnType<typeof itemProps<Options>>>;

export function Item<const Options extends ItemOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ItemProps<Options>>,
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
    ItemProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    itemProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}
