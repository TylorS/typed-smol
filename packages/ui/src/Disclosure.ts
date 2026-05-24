import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as DataAttr from "./DataAttr.js";
import * as Dom from "./Dom.js";
import type { AnyContent, Component, AnyValue } from "./Reactive.js";

type OptionalString = AnyValue<string | undefined>;

export interface State {
  readonly open: boolean;
}

export const data = DataAttr.schema({
  open: Schema.Boolean,
});

export const component = "typed/ui/Disclosure";

export function makeState(
  initial: State,
): Effect.Effect<RefSubject.RefSubject<State>, never, Scope.Scope> {
  return RefSubject.make(initial);
}

export function setOpen<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
  open: boolean,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, open }));
}

export function toggle<E, R>(
  state: RefSubject.RefSubject<State, E, R>,
): Effect.Effect<State, E, R> {
  return RefSubject.update(state, (current) => ({ ...current, open: !current.open }));
}

export interface ButtonOptions<E = never, R = never> extends Dom.HostOptions<HTMLButtonElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly controls?: OptionalString;
  readonly content: AnyContent;
}

export function Button<const E, const R, const Opts extends ButtonOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<ButtonOptions<E, R>, "state">,
): Component<Opts> {
  const open = dataOpen(options.state);
  const onClick = EventHandler.action(actionId("toggle"), "click", () => toggle(options.state), {
    component,
  });
  const props = Dom.mergeProps(options.props, {
    type: "button",
    "aria-expanded": open,
    "aria-controls": options.controls,
    "data-ui": component,
    ".data": { open },
    onclick: onClick,
  });

  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<button
    type="button"
    aria-expanded=${open}
    aria-controls=${options.controls}
    data-ui=${component}
    .data=${{ open }}
    onclick=${onClick}
  >
    ${options.content}
  </button>`;
}

export const Disclosure = Button;

export interface ContentOptions<E = never, R = never> extends Dom.HostOptions<HTMLDivElement> {
  readonly state: RefSubject.RefSubject<State, E, R>;
  readonly id?: OptionalString;
  readonly content: AnyContent;
}

export function Content<const E, const R, const Opts extends ContentOptions<NoInfer<E>, NoInfer<R>>>(
  options: Opts & Pick<ContentOptions<E, R>, "state">,
): Component<Opts> {
  const open = dataOpen(options.state);
  const hidden = RefSubject.map(options.state, (current) => !current.open);
  const props = Dom.mergeProps(options.props, {
    id: options.id,
    "?hidden": hidden,
    "data-ui": component,
    ".data": { open },
  });
  if (options.host) return options.host(props, options.content) as Component<Opts>;

  return html`<div
    id=${options.id}
    ?hidden=${hidden}
    data-ui=${component}
    .data=${{ open }}
  >${options.content}</div>`;
}

function dataOpen<E, R>(state: RefSubject.RefSubject<State, E, R>) {
  return RefSubject.map(state, (value) => DataAttr.boolean(value.open));
}

function actionId(name: string): string {
  return `${component}:action:${name}`;
}
