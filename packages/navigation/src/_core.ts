import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Option from "effect/Option";
import * as Result from "effect/Result";
import type * as Context from "effect/Context";
import type * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import type {
  BeforeNavigationEvent,
  CancelNavigation,
  Destination,
  NavigationEvent,
  ProposedDestination,
  RedirectError,
  Transition,
} from "./model.js";
import { NavigationError } from "./model.js";
import type {
  BeforeNavigationHandler,
  Navigation,
  NavigationHandler,
  NavigationNavigateOptions,
  NavigationReloadOptions,
} from "./Navigation.js";

export type NavigationState = {
  readonly entries: ReadonlyArray<Destination>;
  readonly index: number;
  readonly transition: Option.Option<Transition>;
};

const MAX_DEPTH = 10;

export const makeNavigationCore = Effect.fn(function* (
  origin: string,
  base: string,
  state: RefSubject.RefSubject<NavigationState>,
  commit: (
    before: BeforeNavigationEvent,
    runHandlers: (destination: Destination) => Effect.Effect<void>,
  ) => Effect.Effect<Destination, NavigationError>,
) {
  const entries = RefSubject.map(state, (s) => s.entries);
  const currentEntry = RefSubject.map(state, (s) => s.entries[s.index]);
  const transition = RefSubject.filterMap(state, (s) => s.transition);
  const canGoBack = RefSubject.map(state, (s) => s.index > 0);
  const canGoForward = RefSubject.map(state, (s) => s.index < s.entries.length - 1);

  const beforeHandlers = yield* RefSubject.make(
    Effect.sync(
      (): Set<readonly [BeforeNavigationHandler<any, any>, Context.Context<any>]> => new Set(),
    ),
  );
  const handlers = yield* RefSubject.make(
    Effect.sync((): Set<readonly [NavigationHandler<any, any>, Context.Context<any>]> => new Set()),
  );

  const runBeforeHandlers = (event: BeforeNavigationEvent) =>
    Effect.gen(function* () {
      const handlers = yield* beforeHandlers;
      const matches: Array<Effect.Effect<unknown, RedirectError | CancelNavigation>> = [];

      for (const [handler, ctx] of handlers) {
        const exit = yield* handler(event).pipe(Effect.provideContext(ctx), Effect.result);
        if (Result.isSuccess(exit)) {
          const match = exit.success;
          if (Option.isSome(match)) {
            matches.push(Effect.provideContext(match.value, ctx));
          }
        } else {
          return Option.some(exit.failure);
        }
      }

      if (matches.length > 0) {
        for (const match of matches) {
          const exit = yield* Effect.result(match);
          if (Result.isFailure(exit)) {
            return Option.some(exit.failure);
          }
        }
      }

      return Option.none<RedirectError | CancelNavigation>();
    });

  const runHandlers = (event: NavigationEvent) =>
    Effect.gen(function* () {
      const eventHandlers = yield* handlers;
      const matches: Array<Effect.Effect<unknown>> = [];

      for (const [handler, ctx] of eventHandlers) {
        const match = yield* Effect.provide(handler(event), ctx);
        if (Option.isSome(match)) {
          matches.push(Effect.provide(match.value, ctx));
        }
      }

      if (matches.length > 0) {
        yield* Effect.all(matches, { discard: true });
      }
    });

  const clearTransition = (
    ref: RefSubject.GetSetDelete<NavigationState>,
    transition: BeforeNavigationEvent,
  ) =>
    Effect.flatMap(ref.get, (current) =>
      Option.isSome(current.transition) && current.transition.value === transition
        ? Effect.asVoid(ref.set({ ...current, transition: Option.none() }))
        : Effect.void,
    );

  const beginNavigationEvent = (makeEvent: (current: NavigationState) => BeforeNavigationEvent) =>
    state.updates((ref) =>
      Effect.gen(function* () {
        const current = yield* ref.get;
        const event = makeEvent(current);
        yield* ref.set({
          entries: current.entries,
          index: current.index,
          transition: Option.some(event),
        });
        return event;
      }),
    );

  const updateState = (
    ref: RefSubject.GetSetDelete<NavigationState>,
    before: BeforeNavigationEvent,
    destination: Destination,
  ) =>
    Effect.gen(function* () {
      const current = yield* ref.get;
      if (Option.isNone(current.transition) || current.transition.value !== before) return false;

      if (before.type === "push") {
        const index = current.index + 1;
        const entries = current.entries.slice(0, index).concat([destination]);
        yield* ref.set({ entries, index, transition: Option.none() });
      } else if (before.type === "replace") {
        const index = current.index;
        const beforeEntries = current.entries.slice(0, index);
        const after = current.entries.slice(index + 1);
        const entries = [...beforeEntries, destination, ...after];

        yield* ref.set({ entries, index, transition: Option.none() });
      } else if (before.type === "traverse") {
        const nextIndex = current.index + before.delta;
        const entries = current.entries.slice(0);
        entries[nextIndex] = destination;

        yield* ref.set({
          entries,
          index: nextIndex,
          transition: Option.none(),
        });
      } else if (before.type === "reload") {
        const entries = current.entries
          .slice(0, current.index)
          .concat([destination], current.entries.slice(current.index + 1));
        yield* ref.set({ entries, index: current.index, transition: Option.none() });
      }

      return true;
    });

  const commitStateAndRunHandlers = (before: BeforeNavigationEvent, destination: Destination) => {
    const event: NavigationEvent = {
      type: before.type,
      info: before.info,
      destination,
    };

    return state
      .updates((ref) => updateState(ref, before, destination))
      .pipe(Effect.flatMap((committed) => (committed ? runHandlers(event) : Effect.void)));
  };

  const runNavigationEvent = Effect.fn(function* (before: BeforeNavigationEvent, depth: number) {
    return yield* Effect.gen(function* () {
      const beforeError = yield* runBeforeHandlers(before);

      if (Option.isSome(beforeError)) {
        return yield* handleError(beforeError.value, before, depth);
      }

      return yield* commit(before, (destination) => commitStateAndRunHandlers(before, destination));
    }).pipe(
      Effect.onExit((exit) =>
        Exit.isFailure(exit) ? state.updates((ref) => clearTransition(ref, before)) : Effect.void,
      ),
    );
  });

  const handleError = (
    error: RedirectError | CancelNavigation,
    before: BeforeNavigationEvent,
    depth: number,
  ): Effect.Effect<Destination, NavigationError> =>
    Effect.gen(function* () {
      if (depth >= MAX_DEPTH) {
        return yield* new NavigationError({
          error: new Error("Redirect loop detected"),
        });
      }

      if (error._tag === "@typed/navigation/CancelNavigation") {
        return yield* state.updates((ref) =>
          Effect.gen(function* () {
            const current = yield* ref.get;
            const destination = current.entries[current.index];
            if (Option.isSome(current.transition) && current.transition.value === before) {
              yield* ref.set({ ...current, transition: Option.none() });
            }
            return destination;
          }),
        );
      } else {
        const [redirectEvent, destination] = yield* state.updates((ref) =>
          Effect.gen(function* () {
            const current = yield* ref.get;
            const destination = current.entries[current.index];
            if (Option.isNone(current.transition) || current.transition.value !== before) {
              return [Option.none<BeforeNavigationEvent>(), destination] as const;
            }

            const redirectEvent = yield* makeRedirectEvent(origin, error, destination);
            yield* ref.set({ ...current, transition: Option.some(redirectEvent) });
            return [Option.some(redirectEvent), destination] as const;
          }),
        );

        return Option.isSome(redirectEvent)
          ? yield* runNavigationEvent(redirectEvent.value, depth + 1)
          : destination;
      }
    });

  const navigate = Effect.fn(function* (
    pathOrUrl: string | URL,
    options?: NavigationNavigateOptions,
  ) {
    const url = yield* getUrlEffect(origin, pathOrUrl);
    const event = yield* beginNavigationEvent((current) => {
      const from = current.entries[current.index];
      const history = options?.history ?? "auto";
      const type =
        history === "auto"
          ? from.url.origin === url.origin && from.url.pathname === url.pathname
            ? "replace"
            : "push"
          : history;
      const to: ProposedDestination = {
        ...(type === "push" ? {} : { key: from.key }),
        url,
        state: options?.state,
        sameDocument: url.origin === origin,
      };
      return {
        type,
        from,
        to,
        delta: type === "replace" ? 0 : 1,
        info: options?.info,
      };
    });

    return yield* runNavigationEvent(event, 0);
  });

  const traverseTo = Effect.fn(function* (
    key: Destination["key"],
    options?: { readonly info?: unknown },
  ) {
    const [event, destination] = yield* state.updates((ref) =>
      Effect.gen(function* () {
        const current = yield* ref.get;
        const { entries, index } = current;
        const destination = entries[index];
        const nextIndex = entries.findIndex((entry) => entry.key === key);

        if (nextIndex === -1) {
          return yield* new NavigationError({
            error: new Error(`Unknown navigation key: ${key}`),
          });
        }
        if (nextIndex === index) {
          return [Option.none<BeforeNavigationEvent>(), destination] as const;
        }

        const event: BeforeNavigationEvent = {
          type: "traverse",
          from: destination,
          to: entries[nextIndex],
          delta: nextIndex - index,
          info: options?.info,
        };
        yield* ref.set({ ...current, transition: Option.some(event) });
        return [Option.some(event), destination] as const;
      }),
    );

    return Option.isSome(event) ? yield* runNavigationEvent(event.value, 0) : destination;
  });

  const back = Effect.fn(function* (options?: { readonly info?: unknown }) {
    const { entries, index } = yield* state;
    if (index === 0) return entries[index];
    const { key } = entries[index - 1];
    return yield* traverseTo(key, options);
  });

  const forward = Effect.fn(function* (options?: { readonly info?: unknown }) {
    const { entries, index } = yield* state;
    if (index === entries.length - 1) return entries[index];
    const { key } = entries[index + 1];
    return yield* traverseTo(key, options);
  });

  const reload = Effect.fn(function* (options?: NavigationReloadOptions) {
    const event = yield* beginNavigationEvent((current) => {
      const from = current.entries[current.index];
      const to =
        options !== undefined && "state" in options ? { ...from, state: options.state } : from;
      return {
        type: "reload",
        from,
        to,
        delta: 0,
        info: options?.info,
      };
    });

    return yield* runNavigationEvent(event, 0);
  });

  const onBeforeNavigation = <R = never, R2 = never>(
    handler: BeforeNavigationHandler<R, R2>,
  ): Effect.Effect<void, never, R | R2 | Scope.Scope> =>
    Effect.contextWith((ctx) => {
      const entry = [handler, ctx] as const;

      return Effect.flatMap(
        RefSubject.update(beforeHandlers, (handlers) => new Set([...handlers, entry])),
        () =>
          Effect.addFinalizer(() =>
            RefSubject.update(beforeHandlers, (handlers) => {
              const updated = new Set(handlers);
              updated.delete(entry);
              return updated;
            }),
          ),
      );
    });

  const onNavigation = <R = never, R2 = never>(
    handler: NavigationHandler<R, R2>,
  ): Effect.Effect<void, never, R | R2 | Scope.Scope> =>
    Effect.contextWith((ctx) => {
      const entry = [handler, ctx] as const;

      return Effect.flatMap(
        RefSubject.update(handlers, (handlers) => new Set([...handlers, entry])),
        () =>
          Effect.addFinalizer(() =>
            RefSubject.update(handlers, (handlers) => {
              const updated = new Set(handlers);
              updated.delete(entry);
              return updated;
            }),
          ),
      );
    });

  const updateCurrentEntry = Effect.fn(function* (options: { readonly state: unknown }) {
    const event = yield* beginNavigationEvent((current) => {
      const from = current.entries[current.index];
      return {
        type: "replace",
        from,
        to: { ...from, state: options.state },
        delta: 0,
        info: null,
      };
    });

    return yield* runNavigationEvent(event, 0);
  });

  return {
    origin,
    base,
    entries,
    currentEntry,
    transition,
    canGoBack,
    canGoForward,
    navigate,
    back,
    forward,
    traverseTo,
    reload,
    onBeforeNavigation,
    onNavigation,
    updateCurrentEntry,
  } satisfies Navigation["Service"];
});

function makeRedirectEvent(
  origin: string,
  redirect: RedirectError,
  from: Destination,
): Effect.Effect<BeforeNavigationEvent, NavigationError> {
  return Effect.map(getUrlEffect(origin, redirect.url), (url) => ({
    type: "replace",
    from,
    to: {
      key: from.key,
      url,
      state: redirect.options?.state,
      sameDocument: url.origin === origin,
    },
    delta: 0,
    info: redirect.options?.info,
  }));
}

export const getUrl = (origin: string, urlOrPath: string | URL): URL =>
  typeof urlOrPath === "string" ? new URL(urlOrPath, origin) : urlOrPath;

const getUrlEffect = (
  origin: string,
  urlOrPath: string | URL,
): Effect.Effect<URL, NavigationError> =>
  Effect.try({
    try: () => getUrl(origin, urlOrPath),
    catch: (error) => new NavigationError({ error }),
  });
