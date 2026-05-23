import * as Effect from "effect/Effect";
import type { Scope } from "effect/Scope";
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
import type * as Dom from "./Dom.js";
import type { AnyContent } from "./Reactive.js";

type AnchorClickEvent = Dom.EventOf<HTMLAnchorElement["onclick"]> & {
  readonly currentTarget: HTMLAnchorElement;
};

export interface LinkOptions extends Dom.ElementOptions<HTMLAnchorElement> {
  readonly "aria-current"?: AnyContent<string | null | undefined>;
  readonly class?: AnyContent<string | null | undefined>;
  readonly href: AnyContent<string>;
  readonly content: AnyContent<string | number | boolean | null | undefined | void | RenderEvent>;
  readonly replace?: boolean; // false
}

function makeLinkClickHandler(
  replace$: RefSubject.RefSubject<boolean>,
): EventHandler.EventHandler<AnchorClickEvent, never, Router.Router | Scope> {
  return EventHandler.make((ev: AnchorClickEvent) =>
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
      yield* replace ? Router.replace(href) : Router.push(href);
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
          Effect.fn(function* (ev: AnchorClickEvent) {
            yield* userHandler.handler(ev);
            if (ev.defaultPrevented) return;
            yield* navigationHandler.handler(ev);
          }),
          { ...userHandler.options, preventDefault: true },
        )
      : navigationHandler;

    const props = { ...rest, onclick: clickHandler };

    return html`<a ...${props}>${children}</a>`;
  });
}
