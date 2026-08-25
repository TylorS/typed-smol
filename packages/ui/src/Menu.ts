import * as Effect from "effect/Effect";
import * as Scope from "effect/Scope";
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
import * as NativePopover from "./NativePopover.js";

export interface State extends Omit<Composite.State, "orientation"> {
  readonly orientation: "vertical";
  readonly id: string;
  readonly open: boolean;
}

const invokers = new WeakMap<
  RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  globalThis.Element
>();

interface SubmenuOwner {
  readonly onArrowLeft: () => Effect.Effect<void, Schema.SchemaError>;
}

const submenuOwners = new WeakMap<
  RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  SubmenuOwner
>();

export interface InitialState {
  readonly id: string;
  readonly open?: boolean;
  readonly activeId?: string | null;
  readonly loop?: boolean;
}

export const StateSchema = Schema.Struct({
  id: Schema.String,
  open: Schema.Boolean,
  activeId: Schema.NullOr(Schema.String),
  orientation: Schema.Literals(["vertical"]),
  loop: Schema.Boolean,
  rtl: Schema.Boolean,
  virtualFocus: Schema.Boolean,
});

export function makeState(initial: InitialState) {
  return RefSubject.hydrate(StateSchema, {
    id: initial.id,
    open: initial.open ?? false,
    activeId: initial.activeId ?? null,
    orientation: "vertical",
    loop: initial.loop ?? true,
    rtl: false,
    virtualFocus: false,
  });
}

export const makeCollection = Collection.makeState<string>;

export function setOpen<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (value) => ({ ...value, open }));
}

export interface TriggerOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly content: Renderable.Any;
}

function triggerProps<const Options extends TriggerOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  const open = RefSubject.map(options.state, (state) => state.open);
  return () =>
    ({
      type: "button",
      popovertarget: id,
      popovertargetaction: "toggle",
      "aria-haspopup": "menu",
      "aria-expanded": open,
      onkeydown: EventHandler.make((event: KeyboardEvent) =>
        event.key === "ArrowDown"
          ? Effect.sync(() => {
              event.preventDefault();
              Dom.currentTarget<HTMLButtonElement>(event).click();
            })
          : Effect.void,
      ),
      ref: Dom.composeRefs(options.state, invokerRef(options.state)),
    }) as const;
}

function invokerRef(
  state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
): (element: globalThis.Element) => Effect.Effect<void, never, Scope.Scope> {
  return (element) =>
    Effect.gen(function* () {
      invokers.set(state, element);
      const scope = yield* Effect.scope;
      yield* Scope.addFinalizer(
        scope,
        Effect.sync(() => {
          if (invokers.get(state) === element) invokers.delete(state);
        }),
      );
    });
}
type TriggerProps<Options extends TriggerOptions> = ReturnType<
  ReturnType<typeof triggerProps<Options>>
>;

export function Trigger<
  const Options extends TriggerOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, TriggerProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    TriggerProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    triggerProps(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export const Button = Trigger;

export interface ContentOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly parent?: ParentMenu;
  readonly content: Renderable.Any;
  readonly label?: Renderable.Any<string | null | undefined>;
}

export interface ParentMenu {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection: RefSubject.RefSubject<Collection.State<string>>;
  readonly triggerId: string;
}

function contentProps<const Options extends ContentOptions>(options: Options) {
  const id = RefSubject.map(options.state, (state) => state.id);
  let typeahead: Composite.TypeaheadBuffer = { value: "", updatedAt: 0 };
  let restoreParentFocus = false;
  let restoreOwnerFocus = false;
  let restoreInvokerFocus = false;
  let invoker: globalThis.Element | undefined;
  const onkeydown =
    options.collection === undefined
      ? undefined
      : EventHandler.make((event: KeyboardEvent) =>
          Effect.gen(function* () {
            const direction = Composite.keyMove(event, { orientation: "vertical" });
            if (direction !== undefined) {
              event.preventDefault();
              yield* Composite.moveAndFocus(
                { state: options.state, collection: options.collection!, includeDisabled: true },
                direction,
              );
              return;
            }
            if (event.key === "ArrowRight") {
              const activeId = (yield* options.state).activeId;
              const item =
                activeId === null
                  ? undefined
                  : (yield* options.collection!).find((item) => item.id === activeId);
              const element = item?.submenu === true ? item.element : undefined;
              const click = element === undefined ? undefined : Reflect.get(element, "click");
              if (typeof click === "function") {
                event.preventDefault();
                yield* Effect.sync(() => click.call(element));
              }
              return;
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              const element = Dom.currentTarget<HTMLDivElement>(event);
              const hidePopover = Reflect.get(element, "hidePopover");
              if (typeof hidePopover === "function") {
                if (options.parent === undefined && submenuOwners.has(options.state))
                  restoreOwnerFocus = true;
                else if (options.parent === undefined) restoreInvokerFocus = true;
                else restoreParentFocus = true;
                yield* Effect.sync(() => hidePopover.call(element));
              } else {
                yield* setOpen(options.state, false);
                if (options.parent === undefined && submenuOwners.has(options.state)) {
                  yield* submenuOwners.get(options.state)?.onArrowLeft() ?? Effect.void;
                } else if (options.parent === undefined)
                  yield* Composite.focusElement(invoker ?? invokers.get(options.state));
                else {
                  yield* RefSubject.update(options.parent.state, (state) => ({
                    ...state,
                    activeId: options.parent!.triggerId,
                  }));
                  yield* Composite.focusActive({
                    state: options.parent.state,
                    collection: options.parent.collection,
                  });
                }
              }
              return;
            }
            if (event.key === "Escape") {
              restoreInvokerFocus = true;
              yield* setOpen(options.state, false);
              return;
            }
            if (event.key === "Tab") {
              yield* setOpen(options.state, false);
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              const activeId = (yield* options.state).activeId;
              const element =
                activeId === null
                  ? undefined
                  : (yield* options.collection!).find((item) => item.id === activeId)?.element;
              const click = element === undefined ? undefined : Reflect.get(element, "click");
              if (typeof click === "function") {
                event.preventDefault();
                yield* Effect.sync(() => click.call(element));
              }
              return;
            }
            const key = Composite.typeaheadKey(event);
            if (key === null) return;
            typeahead = Composite.updateTypeaheadBuffer(typeahead, key, Date.now());
            const activeId = Composite.typeaheadFrom(
              yield* options.collection!,
              typeahead.value,
              (yield* options.state).activeId,
              undefined,
              true,
            );
            if (activeId === null) return;
            event.preventDefault();
            yield* RefSubject.update(options.state, (state) => ({ ...state, activeId }));
            yield* Composite.focusActive({ state: options.state, collection: options.collection! });
          }),
        );
  const restoreFocus = () =>
    Effect.gen(function* () {
      if (restoreParentFocus && options.parent !== undefined) {
        restoreParentFocus = false;
        yield* RefSubject.update(options.parent.state, (state) => ({
          ...state,
          activeId: options.parent!.triggerId,
        }));
        yield* Composite.focusActive({
          state: options.parent.state,
          collection: options.parent.collection,
        });
      }
      if (restoreOwnerFocus) {
        restoreOwnerFocus = false;
        yield* submenuOwners.get(options.state)?.onArrowLeft() ?? Effect.void;
      }
      if (restoreInvokerFocus) {
        restoreInvokerFocus = false;
        yield* Composite.focusElement(invoker ?? invokers.get(options.state));
      }
    });
  const toggle = EventHandler.make((event: Event) =>
    Effect.gen(function* () {
      const open = Dom.toggleState(event) === "open";
      const source = Reflect.get(event, "source");
      if (isElement(source)) invoker = source;
      const current = yield* options.state;
      if (current.open === open) {
        if (!open) yield* restoreFocus();
        return current;
      }
      if (open && options.collection !== undefined) {
        const activeId = Composite.moveActiveId(yield* options.collection, current, "first", true);
        const next = yield* RefSubject.update(options.state, (state) => ({
          ...state,
          open,
          activeId,
        }));
        yield* Composite.focusActive({ state: options.state, collection: options.collection });
        yield* Composite.scrollActive({ state: options.state, collection: options.collection });
        return next;
      }
      const next = yield* setOpen(options.state, open);
      if (!open) yield* restoreFocus();
      return next;
    }),
  );
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      id,
      role: "menu",
      popover: "manual",
      "aria-label": property("label", undefined),
      onkeydown,
      ontoggle: toggle,
      ref: Dom.composeRefs(options.state, NativePopover.ref(options.state)),
    }) as const;
}

function isElement(value: unknown): value is globalThis.Element {
  return typeof value === "object" && value !== null && "nodeType" in value;
}
type ContentProps<Options extends ContentOptions> = ReturnType<
  ReturnType<typeof contentProps<Options>>
>;

export function Content<
  const Options extends ContentOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ContentProps<Options>>,
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
    ContentProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(options, host, contentProps(options), options.content, (props, content) => {
    return html`<div ...${props}>${content}</div>`;
  });
}

export const Menu = Content;

export interface ItemOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly id: string;
  readonly content: Renderable.Any;
  readonly textValue?: string;
  readonly disabled?: boolean;
  readonly role?: "menuitem" | "menuitemcheckbox" | "menuitemradio";
  readonly checked?: Renderable.Any<boolean | null | undefined>;
}

function itemProps<const Options extends ItemOptions>(options: Options) {
  const closesOnActivate = options.role === undefined || options.role === "menuitem";
  const activate = EventHandler.make(() =>
    options.disabled === true
      ? Effect.void
      : RefSubject.update(options.state, (state) => ({
          ...state,
          activeId: options.id,
          open: closesOnActivate ? false : state.open,
        })),
  );
  const focus = EventHandler.make(() =>
    RefSubject.update(options.state, (state) => ({ ...state, activeId: options.id })),
  );
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
      role: options.role ?? "menuitem",
      "aria-disabled": options.disabled ?? false,
      "aria-checked":
        options.role === "menuitem" || options.role === undefined
          ? undefined
          : (options.checked ?? false),
      tabindex: Composite.tabIndex(options.state, options.id),
      onclick: activate,
      onfocus: focus,
      onmouseenter: focus,
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

export interface SubmenuTriggerOptions<ParentState extends Composite.State>
  extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.HydratedRefSubject<ParentState, Schema.SchemaError>;
  readonly submenu: RefSubject.HydratedRefSubject<State, Schema.SchemaError>;
  readonly collection?: RefSubject.RefSubject<Collection.State<string>>;
  readonly id: string;
  readonly content: Renderable.Any;
  readonly textValue?: string;
  readonly disabled?: boolean;
}

function submenuTriggerProps<
  ParentState extends Composite.State,
  const Options extends SubmenuTriggerOptions<ParentState>,
>(options: Options) {
  const submenuId = RefSubject.map(options.submenu, (state) => state.id);
  const expanded = RefSubject.map(options.submenu, (state) => state.open);
  const focusEffect = () =>
    RefSubject.update(options.state, (state) => ({ ...state, activeId: options.id }));
  const activateEffect = () => (options.disabled === true ? Effect.void : focusEffect());
  const activate = EventHandler.make(activateEffect);
  const register =
    options.collection === undefined
      ? undefined
      : Collection.ref(options.collection, {
          id: options.id,
          value: options.id,
          textValue: options.textValue ?? options.id,
          disabled: options.disabled,
          submenu: true,
        });
  return () =>
    ({
      id: options.id,
      type: "button",
      role: "menuitem",
      popovertarget: submenuId,
      popovertargetaction: "toggle",
      "aria-haspopup": "menu",
      "aria-expanded": expanded,
      "aria-disabled": options.disabled ?? false,
      tabindex: Composite.tabIndex(options.state, options.id),
      onclick: activate,
      onfocus: EventHandler.make(focusEffect),
      onmouseenter: EventHandler.make(() =>
        options.disabled === true
          ? Effect.void
          : Effect.andThen(activateEffect(), () => setOpen(options.submenu, true)),
      ),
      ref: Dom.composeRefs(
        register,
        Dom.composeRefs(
          options.ref,
          submenuOwnerRef(options.submenu, options.state, options.collection, options.id),
        ),
      ),
    }) as const;
}

function submenuOwnerRef<ParentState extends Composite.State>(
  submenu: RefSubject.HydratedRefSubject<State, Schema.SchemaError>,
  state: RefSubject.HydratedRefSubject<ParentState, Schema.SchemaError>,
  collection: RefSubject.RefSubject<Collection.State<string>> | undefined,
  triggerId: string,
): (element: globalThis.Element) => Effect.Effect<void, never, Scope.Scope> {
  return () =>
    Effect.gen(function* () {
      const owner: SubmenuOwner = {
        onArrowLeft: () =>
          Effect.gen(function* () {
            if (collection === undefined) return;
            if ((yield* state).orientation === "horizontal") {
              yield* Composite.moveAndFocus(
                { state, collection, includeDisabled: true },
                "previous",
              );
            } else {
              yield* RefSubject.update(state, (value) => ({ ...value, activeId: triggerId }));
              yield* Composite.focusActive({ state, collection });
            }
          }),
      };
      submenuOwners.set(submenu, owner);
      const scope = yield* Effect.scope;
      yield* Scope.addFinalizer(
        scope,
        Effect.sync(() => {
          if (submenuOwners.get(submenu) === owner) submenuOwners.delete(submenu);
        }),
      );
    });
}
type SubmenuTriggerProps<
  ParentState extends Composite.State,
  Options extends SubmenuTriggerOptions<ParentState>,
> = ReturnType<ReturnType<typeof submenuTriggerProps<ParentState, Options>>>;

export function SubmenuTrigger<
  ParentState extends Composite.State,
  const Options extends SubmenuTriggerOptions<NoInfer<ParentState>>,
  const Host extends HostResult = never,
>(
  options: Options & {
    readonly state: RefSubject.HydratedRefSubject<ParentState, Schema.SchemaError>;
  },
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, SubmenuTriggerProps<ParentState, Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLButtonElement>()<
    Options,
    SubmenuTriggerProps<ParentState, Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    submenuTriggerProps<ParentState, Options>(options),
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}

export interface CheckboxItemOptions extends Omit<ItemOptions, "role" | "checked"> {
  readonly checked: Renderable.Any<boolean | null | undefined>;
}
type CheckboxItemWithRole<Options extends CheckboxItemOptions> = Options & {
  readonly role: "menuitemcheckbox";
};

export function CheckboxItem<
  const Options extends CheckboxItemOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<CheckboxItemWithRole<Options>, ItemProps<CheckboxItemWithRole<Options>>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Item<CheckboxItemWithRole<Options>, Host>({ ...options, role: "menuitemcheckbox" }, host);
}

export interface RadioItemOptions extends Omit<ItemOptions, "role" | "checked"> {
  readonly checked: Renderable.Any<boolean | null | undefined>;
}
type RadioItemWithRole<Options extends RadioItemOptions> = Options & {
  readonly role: "menuitemradio";
};

export function RadioItem<
  const Options extends RadioItemOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<RadioItemWithRole<Options>, ItemProps<RadioItemWithRole<Options>>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Item<RadioItemWithRole<Options>, Host>({ ...options, role: "menuitemradio" }, host);
}

export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly content: Renderable.Any;
  readonly label?: Renderable.Any<string | null | undefined>;
}

function groupProps<const Options extends GroupOptions>(_options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "group",
      "aria-label": property("label", undefined),
    }) as const;
}
type GroupProps<Options extends GroupOptions> = ReturnType<ReturnType<typeof groupProps<Options>>>;

export function Group<const Options extends GroupOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, GroupProps<Options>>,
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
    GroupProps<Options>,
    Options["content"],
    HostResult,
    Host
  >(
    options,
    host,
    groupProps(options),
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}

export const Dismiss = Item;

export interface SeparatorOptions extends Dom.HostOptions<HTMLHRElement> {
  readonly orientation?: "horizontal" | "vertical";
}

function separatorProps<const Options extends SeparatorOptions>(_options: Options) {
  return ({ property }: Dom.InternalPropsHelpers<Options>) =>
    ({
      role: "separator",
      "aria-orientation": property("orientation", "horizontal"),
    }) as const;
}
type SeparatorProps<Options extends SeparatorOptions> = ReturnType<
  ReturnType<typeof separatorProps<Options>>
>;

export function Separator<
  const Options extends SeparatorOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SeparatorProps<Options>>, "", Host>,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLHRElement>()<Options, SeparatorProps<Options>, "", HostResult, Host>(
    options,
    host,
    separatorProps(options),
    "",
    (props) => html`<hr ...${props} />`,
  );
}
