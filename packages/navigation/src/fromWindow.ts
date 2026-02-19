/**
 * @since 1.0.0
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { RefSubject } from "@typed/fx";
import { Ids } from "@typed/id";
import { getUrl, makeNavigationCore, type NavigationState } from "./_core.js";
import {
  type BeforeNavigationEvent,
  type Destination,
  type ProposedDestination,
  NavigationError,
} from "./model.js";
import { Navigation } from "./Navigation.js";

const TYPED_KEY = "__typed" as const;

type HistoryStatePayload = {
  readonly entries: ReadonlyArray<SerializableEntry>;
  readonly index: number;
};

type SerializableEntry = {
  readonly id: string;
  readonly key: string;
  readonly url: string;
  readonly state: unknown;
  readonly sameDocument: boolean;
};

function toSerializableEntry(d: Destination): SerializableEntry {
  return {
    id: d.id,
    key: d.key,
    url: d.url.href,
    state: d.state,
    sameDocument: d.sameDocument,
  };
}

function fromSerializableEntry(entry: SerializableEntry, origin: string): Destination {
  return {
    ...entry,
    url: getUrl(origin, entry.url),
  };
}

function makeDestination(proposed: ProposedDestination): Effect.Effect<Destination, never, Ids> {
  return Effect.gen(function* () {
    const id = yield* Ids.uuid7;
    const key = proposed.key ?? (yield* Ids.uuid7);
    return {
      id,
      key,
      url: proposed.url,
      state: proposed.state,
      sameDocument: proposed.sameDocument,
    };
  });
}

export const fromWindow = (window: Window = globalThis.window) =>
  Layer.effect(Navigation)(
    Effect.gen(function* () {
      const ids = yield* Ids;
      const origin = window.location.origin;
      const base = getBaseHref(window);
      const state = yield* RefSubject.make(
        getHistoryStateEffect(window, origin).pipe(Effect.provideService(Ids, ids)),
      );

      // Keep ref in sync when user uses browser back/forward without going through our API
      yield* Effect.acquireRelease(
        Effect.sync(() => {
          const onPopState = () => {
            const payload = getTypedState(window.history.state);
            if (payload) {
              void Effect.runPromise(
                state.updates((ref) =>
                  ref.set({
                    entries: payload.entries.map((e) => fromSerializableEntry(e, origin)),
                    index: payload.index,
                    transition: Option.none(),
                  }),
                ),
              ).catch(() => {});
            }
          };
          window.addEventListener("popstate", onPopState);
          return () => window.removeEventListener("popstate", onPopState);
        }),
        (cleanup) => Effect.sync(cleanup),
      );

      return yield* makeNavigationCore(
        origin,
        base,
        state,
        (
          before: BeforeNavigationEvent,
          runHandlers: (destination: Destination) => Effect.Effect<void>,
        ) => {
          switch (before.type) {
            case "push":
            case "replace":
              return navigateCommit(window, state, before, runHandlers).pipe(
                Effect.provideService(Ids, ids),
              );
            case "reload":
              return reloadCommit(window, state, before, runHandlers);
            case "traverse":
              return traverseCommit(window, state, before, runHandlers);
          }
        },
      );
    }),
  );

function getBaseHref(win: Window): string {
  const base = win.document.querySelector("base");
  return base ? base.href : "/";
}

function getTypedState(raw: unknown): { entries: SerializableEntry[]; index: number } | null {
  if (raw && typeof raw === "object" && TYPED_KEY in raw) {
    const t = (raw as Record<typeof TYPED_KEY, HistoryStatePayload>)[TYPED_KEY];
    if (t && Array.isArray(t.entries) && typeof t.index === "number") {
      return { entries: t.entries as SerializableEntry[], index: t.index };
    }
  }
  return null;
}

function getHistoryStateEffect(
  win: Window,
  origin: string,
): Effect.Effect<NavigationState, never, Ids> {
  const typed = getTypedState(win.history.state);
  if (typed !== null) {
    return Effect.sync(() => ({
      entries: typed.entries.map((e) => fromSerializableEntry(e, origin)),
      index: typed.index,
      transition: Option.none(),
    }));
  }
  return Effect.gen(function* () {
    const id = yield* Ids.uuid7;
    const key = yield* Ids.uuid7;
    const url = getUrl(origin, win.location.href);
    const entry: Destination = {
      id,
      key,
      url,
      state:
        typeof win.history.state === "object" &&
        win.history.state !== null &&
        !(TYPED_KEY in win.history.state)
          ? (win.history.state as Record<string, unknown>)
          : undefined,
      sameDocument: true,
    };
    return {
      entries: [entry],
      index: 0,
      transition: Option.none(),
    };
  });
}

function navigateCommit(
  win: Window,
  ref: RefSubject.RefSubject<NavigationState>,
  before: BeforeNavigationEvent,
  runHandlers: (destination: Destination) => Effect.Effect<void>,
): Effect.Effect<Destination, NavigationError, Ids> {
  return Effect.gen(function* () {
    const current = yield* ref;
    const destination = yield* makeDestination(before.to);
    const newEntries =
      before.type === "push"
        ? [...current.entries, destination]
        : current.entries
            .slice(0, current.index)
            .concat([destination], current.entries.slice(current.index + 1));
    const newIndex = before.type === "push" ? current.index + 1 : current.index;
    const statePayload: HistoryStatePayload = {
      entries: newEntries.map(toSerializableEntry),
      index: newIndex,
    };
    const historyState = {
      [TYPED_KEY]: statePayload,
      ...(destination.state !== undefined && destination.state !== null
        ? (destination.state as Record<string, unknown>)
        : {}),
    };
    const url = before.to.url.href;

    if (before.type === "push") {
      win.history.pushState(historyState, "", url);
    } else {
      win.history.replaceState(historyState, "", url);
    }

    yield* runHandlers(destination);
    return destination;
  }).pipe(Effect.catch((error: unknown) => Effect.fail(new NavigationError({ error }))));
}

function reloadCommit(
  win: Window,
  ref: RefSubject.RefSubject<NavigationState>,
  before: BeforeNavigationEvent,
  runHandlers: (destination: Destination) => Effect.Effect<void>,
): Effect.Effect<Destination, NavigationError> {
  return Effect.gen(function* () {
    const current = yield* ref.updates((r) => r.get);
    const entry = current.entries[current.index];
    const updatedDestination: Destination = {
      ...entry,
      state: before.to.state,
    };
    const statePayload: HistoryStatePayload = {
      entries: current.entries.map(toSerializableEntry),
      index: current.index,
    };
    const historyState = {
      [TYPED_KEY]: statePayload,
      ...(updatedDestination.state !== undefined && updatedDestination.state !== null
        ? (updatedDestination.state as Record<string, unknown>)
        : {}),
    };
    win.history.replaceState(historyState, "", win.location.href);
    yield* runHandlers(updatedDestination);
    return updatedDestination;
  }).pipe(Effect.catch((error: unknown) => Effect.fail(new NavigationError({ error }))));
}

function traverseCommit(
  win: Window,
  ref: RefSubject.RefSubject<NavigationState>,
  before: BeforeNavigationEvent,
  runHandlers: (destination: Destination) => Effect.Effect<void>,
): Effect.Effect<Destination, NavigationError> {
  return Effect.gen(function* () {
    const current = yield* ref.updates((r) => r.get);
    const nextIndex = current.index + before.delta;
    if (nextIndex < 0 || nextIndex >= current.entries.length) {
      return yield* new NavigationError({ error: new Error("Traverse out of range") });
    }
    const destination = current.entries[nextIndex];

    win.history.go(before.delta);

    yield* runHandlers(destination);

    return destination;
  }).pipe(Effect.catch((error: unknown) => Effect.fail(new NavigationError({ error }))));
}
