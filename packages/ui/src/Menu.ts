import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { gen } from "@typed/fx/Fx";
import { EventHandler, html } from "@typed/template";
import * as Collection from "./Collection.js";
import * as Composite from "./Composite.js";
import * as DataAttr from "./DataAttr.js";
import * as Dom from "./Dom.js";
import * as NativePopover from "./NativePopover.js";
import { makeRef, type Component, type Content, type Value as ReactiveValue } from "./Reactive.js";

type AnyContent = Content;
type RequiredString = ReactiveValue<string, any, any>;
type OptionalBoolean = ReactiveValue<boolean | undefined, any, any>;

export type Mode = "auto" | "hint" | "manual";

export interface State {
  readonly id: string;
  readonly open: boolean;
  readonly activeId: string | null;
  readonly orientation: Composite.Orientation;
  readonly loop: boolean;
  readonly rtl: boolean;
  readonly virtualFocus: boolean;
  readonly mode: Mode;
}

export interface InitialState {
  readonly id: string;
  readonly open?: boolean;
  readonly activeId?: string | null;
  readonly orientation?: Composite.Orientation;
  readonly loop?: boolean;
  readonly rtl?: boolean;
  readonly virtualFocus?: boolean;
  readonly mode?: Mode;
}

export interface Item<Value = unknown> extends Collection.Item<Value> {}

export const data = DataAttr.schema({
  open: Schema.Boolean,
  mode: Schema.Literals(["auto", "hint", "manual"]),
});

export const itemData = DataAttr.schema({
  active: Schema.Boolean,
  disabled: Schema.Boolean,
});

export function makeState(
  initial: InitialState,
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return RefSubject.make({
    id: initial.id,
    open: initial.open ?? false,
    activeId: initial.activeId ?? null,
    orientation: initial.orientation ?? "vertical",
    loop: initial.loop ?? true,
    rtl: initial.rtl ?? false,
    virtualFocus: initial.virtualFocus ?? false,
    mode: initial.mode ?? "auto",
  });
}

export function setOpen(state: RefSubject.RefSubject<State>, open: boolean): Effect.Effect<State> {
  return NativePopover.setOpen(state, open);
}

export function setActive(
  state: RefSubject.RefSubject<State>,
  activeId: string | null,
): Effect.Effect<State> {
  return RefSubject.update(state, (current) => ({ ...current, activeId }));
}

export function move<Value>(
  state: RefSubject.RefSubject<State>,
  items: readonly Item<Value>[],
  direction: Composite.Move,
): Effect.Effect<State> {
  return Effect.gen(function* () {
    const current = yield* state;
    const enabled = Collection.enabledItems(Collection.byDomOrder(items));
    const activeId = nextActiveId(enabled, current, direction);
    return yield* RefSubject.update(state, (value) => ({ ...value, activeId }));
  });
}

export interface TriggerOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
}

export function Trigger<const Opts extends TriggerOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const open = dataOpen(options.state);
  const props = Dom.mergeProps(options.props, {
    type: "button",
    popovertarget: id,
    popovertargetaction: "toggle",
    "aria-haspopup": "menu",
    "aria-expanded": open,
    ".data": { open },
  });

  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<button
    type="button"
    popovertarget=${id}
    popovertargetaction="toggle"
    aria-haspopup="menu"
    aria-expanded=${open}
    .data=${{ open }}
  >
    ${options.content}
  </button>`;
}

export const Button = Trigger;

export interface ContentOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
  readonly items?: readonly Item[];
  readonly label?: RequiredString;
}

export function Content<const Opts extends ContentOptions>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const mode = dataMode(options.state);
  const open = dataOpen(options.state);
  const orientation = RefSubject.map(options.state, (current) => current.orientation);
  const activeDescendant = RefSubject.map(options.state, (current) =>
    current.virtualFocus && current.activeId ? current.activeId : undefined,
  );
  const onToggle = EventHandler.make((event: ToggleEventLike) =>
    NativePopover.syncToggle(options.state, event),
  );
  const items = options.items;
  const onKeyDown =
    items === undefined
      ? undefined
      : EventHandler.make((event: KeyboardEvent) =>
          Effect.gen(function* () {
            const current = yield* options.state;
            const typeaheadId = Composite.typeaheadFromEvent(event, items);
            if (typeaheadId) {
              yield* setActive(options.state, typeaheadId);
              return;
            }

            const direction = Composite.keyMove(event, current);
            if (!direction) return;

            event.preventDefault();
            yield* move(options.state, items, direction);
          }),
        );
  const props = Dom.mergeProps(options.props, {
    id,
    role: "menu",
    popover: mode,
    "aria-label": options.label,
    "aria-orientation": orientation,
    "aria-activedescendant": activeDescendant,
    ".data": { open },
    ontoggle: onToggle,
    onkeydown: onKeyDown,
    ref: NativePopover.register(options.state),
  });

  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<div
    id=${id}
    role="menu"
    popover=${mode}
    aria-label=${options.label}
    aria-orientation=${orientation}
    aria-activedescendant=${activeDescendant}
    .data=${{ open }}
    ontoggle=${onToggle}
    onkeydown=${onKeyDown}
    ref=${NativePopover.register(options.state)}
  >
    ${options.content}
  </div>`;
}

export const List = Content;
export const Menu = Content;

export interface ItemOptions extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State>;
  readonly id: RequiredString;
  readonly content: AnyContent;
  readonly disabled?: OptionalBoolean;
}

export function Item<const Opts extends ItemOptions>(options: Opts): Component<Opts> {
  return gen(function* () {
    const id = yield* makeRef(options.id);
    const disabledValue = yield* makeRef(options.disabled ?? false);
    const disabled = isDisabled(disabledValue);
    const data = dataEncoded(options.state, id, disabled);

    const props = {
      id,
      role: "menuitem",
      "aria-disabled": boolString(disabled),
      tabindex: RefSubject.mapEffect(options.state, (state) =>
        Effect.gen(function* () {
          const itemId = yield* id;
          const itemDisabled = yield* disabled;
          return state.activeId === itemId && !itemDisabled ? 0 : -1;
        }),
      ),
      "data-active": RefSubject.map(data, (value) => value.active ?? "false"),
      "data-disabled": RefSubject.map(data, (value) => value.disabled ?? "false"),
    } as const;

    if (options.host) return options.host(Dom.mergeProps(options.props, props), options.content) as Component<Opts>;
    return html`<div ...${props}>${options.content}</div>`;
  });
}

export interface CheckedItemOptions extends ItemOptions {
  readonly checked: ReactiveValue<boolean, any, any>;
}

export function ItemCheckbox<const Opts extends CheckedItemOptions>(
  options: Opts,
): Component<Opts> {
  const props = Dom.mergeProps(options.props, {
    id: options.id,
    role: "menuitemcheckbox",
    "aria-checked": options.checked,
    "data-checked": options.checked,
  });
  if (options.host) return options.host(props, options.content) as Component<Opts>;
  return html`<div
    id=${options.id}
    role="menuitemcheckbox"
    aria-checked=${options.checked}
    data-checked=${options.checked}
  >
    ${options.content}
  </div>`;
}

export function ItemRadio<const Opts extends CheckedItemOptions>(options: Opts): Component<Opts> {
  const props = Dom.mergeProps(options.props, {
    id: options.id,
    role: "menuitemradio",
    "aria-checked": options.checked,
    "data-checked": options.checked,
  });
  if (options.host) return options.host(props, options.content) as Component<Opts>;
  return html`<div
    id=${options.id}
    role="menuitemradio"
    aria-checked=${options.checked}
    data-checked=${options.checked}
  >
    ${options.content}
  </div>`;
}

export function ItemCheck<
  const Opts extends {
    readonly checked: ReactiveValue<boolean, any, any>;
    readonly content?: AnyContent;
  },
>(options: Opts): Component<Opts> {
  return gen(function* () {
    const checked = yield* makeRef(options.checked);
    const hidden = RefSubject.map(checked, (value) => !value);
    return html`<span aria-hidden="true" ?hidden=${hidden}>${options.content ?? "✓"}</span>`;
  });
}

export function Separator(): Component<{}> {
  return html`<div role="separator"></div>`;
}

export const Arrow = MenuArrow;
export const ButtonArrow = MenuButtonArrow;

export function MenuArrow<const Opts extends { readonly content?: AnyContent }>(
  options = {} as Opts,
): Component<Opts> {
  return html`<span aria-hidden="true">${options.content ?? ""}</span>`;
}

export function MenuButtonArrow<const Opts extends { readonly content?: AnyContent }>(
  options = {} as Opts,
): Component<Opts> {
  return html`<span aria-hidden="true">${options.content ?? "▾"}</span>`;
}

export function Group<
  const Opts extends { readonly content: AnyContent; readonly label?: RequiredString },
>(options: Opts): Component<Opts> {
  return html`<div role="group" aria-label=${options.label}>${options.content}</div>`;
}

export function GroupLabel<const Opts extends { readonly content: AnyContent }>(
  options: Opts,
): Component<Opts> {
  return html`<span>${options.content}</span>`;
}

export function Heading<
  const Opts extends { readonly content: AnyContent; readonly id?: RequiredString },
>(options: Opts): Component<Opts> {
  return html`<div id=${options.id} role="heading" aria-level="1">${options.content}</div>`;
}

export function Description<
  const Opts extends { readonly content: AnyContent; readonly id?: RequiredString },
>(options: Opts): Component<Opts> {
  return html`<p id=${options.id}>${options.content}</p>`;
}

export function Dismiss<
  const Opts extends {
    readonly state: RefSubject.RefSubject<State>;
    readonly content: AnyContent;
  } & Dom.HostOptions<HTMLButtonElement>,
>(options: Opts): Component<Opts> {
  const id = RefSubject.map(options.state, (current) => current.id);
  const onClick = EventHandler.make((event: Event) =>
    NativePopover.hideFromEvent(options.state, event),
  );
  const props = Dom.mergeProps(options.props, {
    type: "button",
    popovertarget: id,
    popovertargetaction: "hide",
    onclick: onClick,
  });
  if (options.host) return options.host(props, options.content) as Component<Opts>;
  return html`<button
    type="button"
    popovertarget=${id}
    popovertargetaction="hide"
    onclick=${onClick}
  >
    ${options.content}
  </button>`;
}

export interface SubmenuTriggerOptions extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State>;
  readonly submenu: RefSubject.RefSubject<State>;
  readonly content: AnyContent;
  readonly openDelay?: number;
  readonly closeDelay?: number;
}

export function SubmenuTrigger<const Opts extends SubmenuTriggerOptions>(
  options: Opts,
): Component<Opts> {
  const id = RefSubject.map(options.submenu, (current) => current.id);
  const open = RefSubject.map(options.submenu, (current) => current.open);
  const onPointerEnter = EventHandler.make(() =>
    Effect.sleep(options.openDelay ?? 0).pipe(Effect.flatMap(() => setOpen(options.submenu, true))),
  );
  const onPointerLeave = EventHandler.make(() =>
    Effect.sleep(options.closeDelay ?? 0).pipe(Effect.flatMap(() => setOpen(options.submenu, false))),
  );
  const onKeyDown = EventHandler.make((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      return setOpen(options.submenu, false);
    }
    if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      return setOpen(options.submenu, true);
    }
  });
  const props = Dom.mergeProps(options.props, {
    type: "button",
    popovertarget: id,
    popovertargetaction: "toggle",
    "aria-haspopup": "menu",
    "aria-expanded": open,
    onpointerenter: onPointerEnter,
    onpointerleave: onPointerLeave,
    onkeydown: onKeyDown,
  });

  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<button
    type="button"
    popovertarget=${id}
    popovertargetaction="toggle"
    aria-haspopup="menu"
    aria-expanded=${open}
    onpointerenter=${onPointerEnter}
    onpointerleave=${onPointerLeave}
    onkeydown=${onKeyDown}
  >
    ${options.content}
  </button>`;
}

export const Submenu = Content;

interface ToggleEventLike extends Event {
  readonly newState?: string;
}

function dataOpen(state: RefSubject.RefSubject<State>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.open ?? "false")),
  );
}

function dataMode(state: RefSubject.RefSubject<State>) {
  return RefSubject.mapEffect(state, (value) =>
    DataAttr.encode(data, value).pipe(Effect.map((encoded) => encoded.mode ?? "auto")),
  );
}

function dataEncoded(
  state: RefSubject.RefSubject<State>,
  id: RefSubject.Computed<string, any, any>,
  disabled: RefSubject.Computed<boolean, any, any>,
) {
  return RefSubject.mapEffect(state, (current) =>
    Effect.gen(function* () {
      const itemId = yield* id;
      const itemDisabled = yield* disabled;
      return yield* DataAttr.encode(itemData, {
        active: current.activeId === itemId,
        disabled: itemDisabled,
      });
    }),
  );
}

function isDisabled(disabled: RefSubject.Computed<boolean | undefined, any, any>) {
  return RefSubject.map(disabled, (value) => value === true);
}

function boolString(value: RefSubject.Computed<boolean, any, any>) {
  return RefSubject.map(value, String);
}

function nextActiveId<Value>(
  items: readonly Item<Value>[],
  state: State,
  direction: Composite.Move,
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
