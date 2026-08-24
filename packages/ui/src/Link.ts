import * as Effect from "effect/Effect";
import type { Scope } from "effect/Scope";
import * as Stream from "effect/Stream";
import * as Fx from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx/RefSubject";
import { type NavigationError, Navigation } from "@typed/navigation";
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
  ) =>
    | void
    | Effect.Effect<unknown, any, any>
    | Stream.Stream<unknown, any, any>
    | Fx.Fx<unknown, any, any>;
};

type IfEquals<X, Y, Output> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? Output : never;

type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>;
}[keyof T];

type AnchorProperties = {
  readonly [
    K in WritableKeys<HTMLAnchorElement> as K extends EventHandlerProperty | "ref" ? never : K
  ]?: Renderable<HTMLAnchorElement[K], any, any>;
};

export interface LinkOptions extends AnchorEventHandlers, AnchorRef, AnchorProperties {
  readonly href: Renderable<string, any, any>;
  readonly content: Renderable<
    string | number | boolean | null | undefined | void | RenderEvent,
    any,
    any
  >;
  readonly replace?: boolean; // false
}

type LinkError<Opts extends LinkOptions> =
  | Renderable.ErrorFromObject<Opts>
  | EventHandler.Error<NonNullable<Opts["onclick"]>>
  | NavigationError;

type LinkServices<Opts extends LinkOptions> =
  | Renderable.ServicesFromObject<Opts>
  | EventHandler.Services<NonNullable<Opts["onclick"]>>
  | Navigation
  | Scope
  | RenderTemplate;

function makeLinkClickHandler(
  replace$: RefSubject.RefSubject<boolean>,
): EventHandler.EventHandler<
  MouseEvent & { readonly currentTarget: HTMLAnchorElement },
  NavigationError,
  Navigation
> {
  return EventHandler.make((ev: MouseEvent & { readonly currentTarget: HTMLAnchorElement }) => {
    const anchor = ev.currentTarget;
    const href = anchor.href;
    if (
      ev.defaultPrevented ||
      ev.button !== 0 ||
      ev.metaKey ||
      ev.altKey ||
      ev.ctrlKey ||
      ev.shiftKey
    )
      return;
    const t = anchor.target;
    if (t && t !== "_self") return;
    if (anchor.hasAttribute("download")) return;
    if (!isSafeLinkHref(href)) {
      ev.preventDefault();
      return;
    }
    const target = new URL(href);
    if (target.protocol !== "http:" && target.protocol !== "https:") return;
    if (target.origin !== anchor.ownerDocument.defaultView?.location.origin) return;
    ev.preventDefault();

    return Effect.gen(function* () {
      const nav = yield* Navigation;
      const replace = yield* replace$;
      yield* nav.navigate(href, { history: replace ? "replace" : "push" });
    });
  });
}

/**
 * Renders an `<a href="...">` that intercepts same-origin, same-document clicks
 * and navigates via `Navigation.navigate` instead of full page load. Requires
 * `Navigation` and `RenderTemplate` in the Effect context (e.g. `BrowserRouter`).
 */
export function Link<const Opts extends LinkOptions>(
  options: Opts,
): Fx.Fx<RenderEvent, LinkError<Opts>, LinkServices<Opts>> {
  return Fx.gen(function* () {
    const { replace = false, onclick, content: children, href, ...rest } = options;
    const replace$ = yield* RefSubject.make(replace);
    const navigationHandler = makeLinkClickHandler(replace$);
    const userHandler = onclick ? EventHandler.fromEffectOrEventHandler(onclick) : undefined;
    const clickHandler = userHandler
      ? EventHandler.make((ev: MouseEvent & { readonly currentTarget: HTMLAnchorElement }) => {
          const userEffect = userHandler.handler(ev);
          if (ev.defaultPrevented) return userEffect;
          const navigationEffect = navigationHandler.handler(ev);
          return Effect.andThen(userEffect, navigationEffect);
        }, userHandler.options)
      : navigationHandler;

    const props = {
      ...rest,
      href: sanitizeLinkHref<Opts["href"]>(href),
      onclick: clickHandler,
    };

    return html`<a ...${props as any}>${children as any}</a>`;
  });
}

function sanitizeLinkHref<const Href extends Renderable<string, any, any>>(href: Href): Href {
  if (Fx.isFx(href)) return Fx.map(href, neutralizeExecutableHref) as Href;
  if (Stream.isStream(href)) {
    return Stream.map(href as Stream.Stream<string, any, any>, neutralizeExecutableHref) as Href;
  }
  if (Effect.isEffect(href)) return Effect.map(href, neutralizeExecutableHref) as Href;
  if (Array.isArray(href)) {
    return href.map((value) => sanitizeLinkHref(value)) as unknown as Href;
  }
  return (typeof href === "string" ? neutralizeExecutableHref(href) : href) as Href;
}

function neutralizeExecutableHref(href: string): string {
  return isSafeLinkHref(href) ? href : "about:blank";
}

function isSafeLinkHref(href: string): boolean {
  try {
    switch (new URL(href, "http://localhost").protocol) {
      case "http:":
      case "https:":
      case "mailto:":
      case "tel:":
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}
