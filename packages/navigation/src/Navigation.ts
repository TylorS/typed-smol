import type * as Effect from "effect/Effect";
import type * as Option from "effect/Option";
import type * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import { RefSubject } from "@typed/fx";
import type {
  BeforeNavigationEvent,
  CancelNavigation,
  Destination,
  NavigationError,
  NavigationEvent,
  RedirectError,
  Transition,
} from "./model.js";

/**
 * @since 1.0.0
 */
export interface NavigationNavigateOptions {
  readonly state?: unknown;
  readonly info?: unknown;
  readonly history?: "auto" | "push" | "replace";
}

/**
 * @since 1.0.0
 */
export interface NavigationReloadOptions {
  readonly state?: unknown;
  readonly info?: unknown;
}

/**
 * @since 1.0.0
 */
export interface NavigationInfoOptions {
  readonly info?: unknown;
}

type DestinationState<S> = Omit<Destination, "state"> & {
  readonly state: S;
};

export class Navigation extends Context.Service<
  Navigation,
  {
    readonly origin: string;
    readonly base: string;
    readonly currentEntry: RefSubject.Computed<Destination>;
    readonly entries: RefSubject.Computed<ReadonlyArray<Destination>>;
    readonly transition: RefSubject.Filtered<Transition>;
    readonly canGoBack: RefSubject.Computed<boolean>;
    readonly canGoForward: RefSubject.Computed<boolean>;

    readonly navigate: (
      url: string | URL,
      options?: NavigationNavigateOptions,
    ) => Effect.Effect<Destination, NavigationError>;
    readonly back: (
      options?: NavigationInfoOptions,
    ) => Effect.Effect<Destination, NavigationError>;
    readonly forward: (
      options?: NavigationInfoOptions,
    ) => Effect.Effect<Destination, NavigationError>;
    readonly traverseTo: (
      key: Destination["key"],
      options?: NavigationInfoOptions,
    ) => Effect.Effect<Destination, NavigationError>;
    readonly updateCurrentEntry: (options: {
      readonly state: unknown;
    }) => Effect.Effect<Destination, NavigationError>;
    readonly reload: (options?: NavigationReloadOptions) => Effect.Effect<Destination, NavigationError>;

    readonly onBeforeNavigation: <R = never, R2 = never>(
      handler: BeforeNavigationHandler<R, R2>,
    ) => Effect.Effect<void, never, R | R2 | Scope.Scope>;
    readonly onNavigation: <R = never, R2 = never>(
      handler: NavigationHandler<R, R2>,
    ) => Effect.Effect<void, never, R | R2 | Scope.Scope>;
  }
>()("@typed/navigation/Navigation") {
  static readonly origin = Navigation.useSync((n) => n.origin);
  static readonly base = Navigation.useSync((n) => n.base);

  static readonly currentEntry = RefSubject.computedFromService(
    Navigation.useSync((n) => n.currentEntry),
  );
  static readonly entries = RefSubject.computedFromService(Navigation.useSync((n) => n.entries));
  static readonly transition = RefSubject.filteredFromService(
    Navigation.useSync((n) => n.transition),
  );
  static readonly canGoBack = RefSubject.computedFromService(
    Navigation.useSync((n) => n.canGoBack),
  );
  static readonly canGoForward = RefSubject.computedFromService(
    Navigation.useSync((n) => n.canGoForward),
  );

  static navigate<S>(
    url: string | URL,
    options: NavigationNavigateOptions & { readonly state: S },
  ): Effect.Effect<DestinationState<S>, NavigationError, Navigation>;
  static navigate(
    url: string | URL,
    options?: NavigationNavigateOptions,
  ): Effect.Effect<Destination, NavigationError, Navigation>;
  static navigate(url: string | URL, options?: NavigationNavigateOptions) {
    return Navigation.use((n) => n.navigate(url, options));
  }

  static readonly back = (options?: NavigationInfoOptions) =>
    Navigation.use((n) => n.back(options));
  static readonly forward = (options?: NavigationInfoOptions) =>
    Navigation.use((n) => n.forward(options));
  static readonly traverseTo = (key: Destination["key"], options?: NavigationInfoOptions) =>
    Navigation.use((n) => n.traverseTo(key, options));

  static updateCurrentEntry<S>(options: { readonly state: S }): Effect.Effect<
    DestinationState<S>,
    NavigationError,
    Navigation
  >;
  static updateCurrentEntry(options: { readonly state: unknown }): Effect.Effect<
    Destination,
    NavigationError,
    Navigation
  >;
  static updateCurrentEntry(options: { readonly state: unknown }) {
    return Navigation.use((n) => n.updateCurrentEntry(options));
  }

  static reload<S>(
    options: NavigationReloadOptions & { readonly state: S },
  ): Effect.Effect<DestinationState<S>, NavigationError, Navigation>;
  static reload(
    options?: NavigationReloadOptions,
  ): Effect.Effect<Destination, NavigationError, Navigation>;
  static reload(options?: NavigationReloadOptions) {
    return Navigation.use((n) => n.reload(options));
  }

  static readonly onBeforeNavigation = <R = never, R2 = never>(
    handler: BeforeNavigationHandler<R, R2>,
  ) => Navigation.use((n) => n.onBeforeNavigation(handler));
  static readonly onNavigation = <R = never, R2 = never>(handler: NavigationHandler<R, R2>) =>
    Navigation.use((n) => n.onNavigation(handler));
}

export type BeforeNavigationHandler<R, R2> = (
  event: BeforeNavigationEvent,
) => Effect.Effect<
  Option.Option<Effect.Effect<unknown, RedirectError | CancelNavigation, R2>>,
  RedirectError | CancelNavigation,
  R
>;

export type NavigationHandler<R, R2> = (
  event: NavigationEvent,
) => Effect.Effect<Option.Option<Effect.Effect<unknown, never, R2>>, never, R>;

export const CurrentPath = RefSubject.computedFromService(
  Navigation.useSync((n) =>
    n.currentEntry.pipe(
      RefSubject.map((entry: Destination) => entry.url.pathname + entry.url.search),
    ),
  ),
);
