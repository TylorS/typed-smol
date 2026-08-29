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
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";
import * as NativePopover from "./NativePopover.js";

export interface State {
  readonly id: string;
  readonly open: boolean;
}

export interface InitialState {
  readonly id: string;
  readonly open?: boolean;
}

export const StateSchema = Schema.Struct({ id: Schema.String, open: Schema.Boolean });

export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, { id: initial.id, open: initial.open ?? false });
}

export function setOpen<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

const scheduleVersions = new WeakMap<object, number>();

const scheduleOpen = Effect.fn(function* <E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
  delay: number,
) {
  const version = (scheduleVersions.get(state) ?? 0) + 1;
  scheduleVersions.set(state, version);
  if (delay > 0) yield* Effect.sleep(delay);
  if (scheduleVersions.get(state) === version) yield* setOpen(state, open);
});

export interface AnchorOptions extends Dom.HostOptions<HTMLSpanElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
  readonly showDelay?: number;
  readonly hideDelay?: number;
}

function anchorInternalProps<const Options extends AnchorOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);

  return () =>
    ({
      "aria-controls": id,
      onfocus: scheduleOpen(options.state, true, options.showDelay ?? 0),
      onblur: EventHandler.make(
        Effect.fn(function* (event: FocusEvent) {
          const contentId = (yield* options.state).id;
          const content = Dom.currentTarget<Element>(event).ownerDocument.getElementById(contentId);
          if (event.relatedTarget instanceof Node && content?.contains(event.relatedTarget)) return;
          yield* scheduleOpen(options.state, false, options.hideDelay ?? 0);
        }),
      ),
      onkeydown: EventHandler.make(
        Effect.fn(function* (event: KeyboardEvent) {
          if (event.key === "Escape") yield* scheduleOpen(options.state, false, 0);
        }),
      ),
      onmouseenter: scheduleOpen(options.state, true, options.showDelay ?? 0),
      onmouseleave: scheduleOpen(options.state, false, options.hideDelay ?? 0),
    }) as const;
}

type AnchorInternalProps<Options extends AnchorOptions> = ReturnType<
  ReturnType<typeof anchorInternalProps<Options>>
>;

export function Anchor<const Options extends AnchorOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, AnchorInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLSpanElement>()<
    Options,
    AnchorInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    anchorInternalProps(options),
    options.content,
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}

interface ContentOptionsBase extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
}

type AccessibleName =
  | {
      readonly label: Renderable.Any<string | null | undefined>;
      readonly labelledBy?: never;
    }
  | {
      readonly label?: never;
      readonly labelledBy: Renderable.Any<string | null | undefined>;
    };

export type ContentOptions = ContentOptionsBase & AccessibleName;

function contentInternalProps<const Options extends ContentOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id,
      role: "dialog",
      "aria-label": property("label", undefined),
      "aria-labelledby": property("labelledBy", undefined),
      popover: "manual",
      onfocusin: scheduleOpen(options.state, true, 0),
      onfocusout: EventHandler.make(
        Effect.fn(function* (event: FocusEvent) {
          const content = Dom.currentTarget<HTMLElement>(event);
          if (event.relatedTarget instanceof Node && content.contains(event.relatedTarget)) return;
          yield* scheduleOpen(options.state, false, 0);
        }),
      ),
      onmouseenter: scheduleOpen(options.state, true, 0),
      onmouseleave: EventHandler.make(
        Effect.fn(function* (event: MouseEvent) {
          const contentId = (yield* options.state).id;
          if (
            event.relatedTarget instanceof Element &&
            event.relatedTarget.getAttribute("aria-controls") === contentId
          )
            return;
          yield* scheduleOpen(options.state, false, 0);
        }),
      ),
      onkeydown: EventHandler.make(
        Effect.fn(function* (event: KeyboardEvent) {
          if (event.key === "Escape") yield* scheduleOpen(options.state, false, 0);
        }),
      ),
      ontoggle: EventHandler.make(
        Effect.fn((event: Event) => setOpen(options.state, Dom.toggleState(event) === "open")),
      ),
      ref: Dom.composeRefs(options.state, NativePopover.ref(options.state)),
    }) as const;
}

type ContentInternalProps<Options extends ContentOptions> = ReturnType<
  ReturnType<typeof contentInternalProps<Options>>
>;

export function Content<
  const Options extends ContentOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ContentInternalProps<Options>>,
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
    ContentInternalProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, contentInternalProps(options), options.content, (i, content) => {
    return html`<div ...${i}>${content}</div>`;
  });
}

export const Hovercard = Content;
