import * as Effect from "effect/Effect";
import type { Scope } from "effect/Scope";
import type { Stream } from "effect/Stream";
import { type Fx, gen } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx/RefSubject";
import { getUrl } from "@typed/navigation/_core";
import { Navigation } from "@typed/navigation/Navigation";
import * as Router from "@typed/router";
import {
  EventHandler,
  type Renderable,
  type RenderEvent,
  type RenderTemplate,
  html,
} from "@typed/template";

type EventHandlerProperty = `on${string}`;

type AnchorEventHandlers = {
  readonly [K in keyof HTMLAnchorElement as K extends EventHandlerProperty ? K : never]?:
    | Effect.Effect<unknown, any, any>
    | EventHandler.EventHandler<Event, any, any>;
};

type AnchorRef = {
  readonly ref?: (
    element: HTMLAnchorElement,
  ) => void | Effect.Effect<unknown, any, any> | Stream<unknown, any, any> | Fx<unknown, any, any>;
};

type IfEquals<X, Y, Output> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? Output : never;

type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>;
}[keyof T];

type AnchorProperties = {
  readonly [K in WritableKeys<HTMLAnchorElement> as K extends EventHandlerProperty | "ref"
    ? never
    : K]?: Renderable<HTMLAnchorElement[K], any, any>;
};

export interface LinkOptions extends AnchorEventHandlers, AnchorRef, AnchorProperties {
  readonly "aria-current"?: Renderable<string | null | undefined, any, any>;
  readonly class?: Renderable<string | null | undefined, any, any>;
  readonly href: Renderable<string, any, any>;
  readonly content: Renderable<
    string | number | boolean | null | undefined | void | RenderEvent,
    any,
    any
  >;
  readonly replace?: boolean; // false
}

function makeLinkClickHandler(
  replace$: RefSubject.RefSubject<boolean>,
): EventHandler.EventHandler<
  MouseEvent & { readonly currentTarget: HTMLAnchorElement },
  never,
  Router.Router | Scope
> {
  return EventHandler.make((ev: MouseEvent & { readonly currentTarget: HTMLAnchorElement }) =>
    Effect.gen(function* () {
      const href = ev.currentTarget.href;
      if (ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
      const t = ev.currentTarget.target;
      if (t && t !== "_self") return;
      const nav = yield* Navigation;
      const target = getUrl(nav.origin, href);
      if (target.origin !== nav.origin) return;
      ev.preventDefault();
      const replace = yield* replace$;
      yield* (replace ? Router.replace(href) : Router.push(href));
    }),
  );
}

/**
 * Renders an `<a href="...">` that intercepts same-origin, same-document clicks
 * and navigates via `Navigation.navigate` instead of full page load. Requires
 * `Navigation` and `RenderTemplate` in the Effect context (e.g. `BrowserRouter`).
 */
export function Link<const Opts extends LinkOptions>(
  options: Opts,
): Fx<
  RenderEvent,
  Renderable.ErrorFromObject<Opts>,
  Renderable.ServicesFromObject<Opts> | Scope | RenderTemplate
> {
  return gen(function* () {
    const { replace = false, onclick, content: children, ...rest } = options;
    const replace$ = yield* RefSubject.make(replace);
    const navigationHandler = makeLinkClickHandler(replace$);
    const userHandler = onclick ? EventHandler.fromEffectOrEventHandler(onclick) : undefined;
    const clickHandler = userHandler
      ? EventHandler.make(
          Effect.fn(function* (ev: MouseEvent & { readonly currentTarget: HTMLAnchorElement }) {
            yield* userHandler.handler(ev);
            if (ev.defaultPrevented) return;
            yield* navigationHandler.handler(ev);
          }),
          { ...userHandler.options, preventDefault: true },
        )
      : navigationHandler;

    const props: Record<string, unknown> = { ...rest, onclick: clickHandler };

    return html`<a ...${props}>${children}</a>`;
  });
}
