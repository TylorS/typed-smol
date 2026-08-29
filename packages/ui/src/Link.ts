import * as Effect from "effect/Effect";
import type { Scope } from "effect/Scope";
import * as Stream from "effect/Stream";
import * as Fx from "@typed/fx/Fx";
import { type NavigationError, Navigation } from "@typed/navigation";
import {
  EventHandler,
  type Renderable,
  type RenderEvent,
  type RenderTemplate,
  html,
} from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

export type LinkOptions = Dom.HostOptions<HTMLAnchorElement> &
  Dom.ElementOptions<HTMLAnchorElement> & {
    readonly href: Renderable<string, any, any>;
    readonly content: Renderable<
      string | number | boolean | null | undefined | void | RenderEvent,
      any,
      any
    >;
    readonly replace?: boolean;
  };

type LinkError<Options extends object> = Renderable.ErrorFromObject<Options> | NavigationError;

type LinkServices<Options extends object> =
  | Renderable.ServicesFromObject<Options>
  | Navigation
  | Scope
  | RenderTemplate;

function makeLinkClickHandler(
  replace: boolean,
): EventHandler.EventHandler<MouseEvent, NavigationError, Navigation> {
  // Classification and native cancellation must run during event dispatch;
  // only the resulting router navigation is lazy.
  return EventHandler.make(
    (event: MouseEvent) => {
      const anchor = Dom.currentTarget<HTMLAnchorElement>(event);
      const href = anchor.href;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey
      )
        return;
      const target = anchor.target;
      if (target && target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (!isSafeLinkHref(href)) {
        event.preventDefault();
        return;
      }
      const destination = new URL(href);
      if (destination.protocol !== "http:" && destination.protocol !== "https:") return;
      if (destination.origin !== anchor.ownerDocument.defaultView?.location.origin) return;
      event.preventDefault();

      return Effect.flatMap(Navigation, (navigation) =>
        navigation.navigate(href, { history: replace ? "replace" : "push" }),
      );
    },
    { passive: false },
  );
}

function legacyProps(options: LinkOptions): Record<string, unknown> {
  const modern = options.props as Record<string, unknown> | undefined;
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (
      key === "content" ||
      key === "href" ||
      key === "props" ||
      key === "ref" ||
      key === "replace" ||
      key[0] === "@" ||
      (key[0] === "o" && key[1] === "n") ||
      (modern !== undefined && Object.hasOwn(modern, key))
    )
      continue;
    props[key] = value;
  }
  return props;
}

type LinkClickHandler = ReturnType<typeof makeLinkClickHandler>;
type LinkInternalProps<Options extends LinkOptions> = {
  readonly href: Options["href"];
  readonly onclick: LinkClickHandler;
};

function internalProps<const Options extends LinkOptions>(options: Options) {
  return (): LinkInternalProps<Options> =>
    ({
      ...legacyProps(options),
      href: sanitizeLinkHref(options.href),
      onclick: makeLinkClickHandler(options.replace ?? false),
    }) as LinkInternalProps<Options>;
}

/**
 * Renders a native anchor and intercepts eligible same-origin clicks for SPA
 * navigation. Modified clicks, downloads, external URLs, and non-self targets
 * retain the browser's native behavior.
 */
export function Link<const Options extends object>(
  options: Options,
  ..._: Options extends LinkOptions ? [] : ["Link options must satisfy LinkOptions"]
): Fx.Fx<RenderEvent, LinkError<Options>, LinkServices<Options>>;
export function Link<const Options extends object, const Host extends HostResult>(
  options: Options,
  host: Dom.HostOverride<Dom.HostProps<HTMLAnchorElement>, Renderable.Any, Host>,
  ..._: Options extends LinkOptions ? [] : ["Link options must satisfy LinkOptions"]
): Fx.Fx<
  RenderEvent,
  LinkError<Options> | Fx.Error<Host>,
  LinkServices<Options> | Fx.Services<Host>
>;
// Keep the implementation erased: constraining it to LinkOptions widens the
// Renderable `any` slots and loses the exact error/service inference above.
export function Link(options: any, host?: any, ..._: Array<any>): Fx.Fx<RenderEvent, any, any> {
  const render = Dom.renderHost<HTMLAnchorElement>() as (
    ...args: Array<any>
  ) => Fx.Fx<RenderEvent, any, any>;
  return render(
    options,
    host,
    internalProps(options),
    options.content,
    (props: any, content: any) => html`<a ...${props}>${content}</a>`,
  );
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
