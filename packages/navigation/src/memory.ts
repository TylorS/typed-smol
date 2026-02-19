import { Ids } from "@typed/id";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { RefSubject } from "@typed/fx";
import { getUrl, makeNavigationCore, type NavigationState } from "./_core.js";
import type {
  BeforeNavigationEvent,
  Destination,
  NavigationError,
  ProposedDestination,
} from "./model.js";
import { Navigation } from "./Navigation.js";

export interface MemoryOptions {
  readonly entries: ReadonlyArray<Destination>;
  readonly origin?: string | undefined;
  readonly base?: string | undefined;
  readonly currentIndex?: number | undefined;
  readonly maxEntries?: number | undefined;

  // If you want to use a custom commit function, you can provide it here.
  readonly commit?: (
    before: BeforeNavigationEvent,
    runHandlers: (destination: Destination) => Effect.Effect<void>,
  ) => Effect.Effect<Destination, NavigationError>;
}

export interface InitialMemoryOptions {
  readonly url: string | URL;
  readonly origin?: string | undefined;
  readonly base?: string | undefined;
  readonly maxEntries?: number | undefined;
  readonly state?: unknown;
}

const DEFAULT_MAX_ENTRIES = 50;

const limitEntries =
  (maxEntries: number) =>
  (state: NavigationState): NavigationState => {
    if (state.entries.length <= maxEntries) return state;
    const entries = state.entries.slice(-maxEntries);
    const index = state.index - (state.entries.length - entries.length);
    return { entries, index, transition: state.transition };
  };

export const memory = (options: MemoryOptions) =>
  Layer.effect(Navigation)(
    Effect.gen(function* () {
      const ids = yield* Effect.service(Ids);
      const origin = options.origin ?? "http://localhost";
      const base = options.base ?? "/";
      const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
      const baseState = yield* RefSubject.make<NavigationState>({
        entries: options.entries,
        index: options.currentIndex ?? options.entries.length - 1,
        transition: Option.none(),
      });
      const state = RefSubject.transform(
        baseState,
        limitEntries(maxEntries),
        limitEntries(maxEntries),
      );

      return yield* makeNavigationCore(
        origin,
        base,
        state,
        options.commit ??
          ((before, runHandlers) =>
            Effect.provideService(defaultCommit(before, runHandlers), Ids, ids)),
      );
    }),
  );

export const initialMemory = (options: InitialMemoryOptions) =>
  Layer.unwrap(
    Effect.gen(function* () {
      const key = yield* Ids.uuid7;
      const id = yield* Ids.uuid7;
      const origin = options.origin ?? "http://localhost";
      const url = getUrl(origin, options.url);
      const entry = proposedToDestination(
        {
          url,
          state: options.state,
          sameDocument: url.origin === origin,
        },
        key,
        id,
      );

      return memory({
        origin,
        entries: [entry],
        currentIndex: 0,
        ...options,
      });
    }),
  );

const defaultCommit = (
  before: BeforeNavigationEvent,
  runHandlers: (destination: Destination) => Effect.Effect<void>,
) =>
  Effect.gen(function* () {
    const key = yield* Ids.uuid7;
    const id = yield* Ids.uuid7;
    const destination = proposedToDestination(before.to, key, id);
    yield* runHandlers(destination);
    return destination;
  });

const proposedToDestination = (
  before: ProposedDestination,
  key: string,
  id: string,
): Destination => ({
  key: before.key ?? key,
  url: before.url,
  state: before.state,
  sameDocument: before.sameDocument,
  id,
});
