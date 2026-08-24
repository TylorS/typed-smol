/**
 * @since 1.0.0
 */

import { RefSubject } from "@typed/fx";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import type * as Scope from "effect/Scope";
import {
  type BeforeNavigationEvent,
  CancelNavigation,
  type Destination,
  RedirectError,
} from "./model.js";
import {
  Navigation,
  type NavigationNavigateOptions,
} from "./Navigation.js";

/**
 * @since 1.0.0
 */
export interface BlockNavigation extends RefSubject.Filtered<Blocking> {
  readonly isBlocking: RefSubject.Computed<boolean>;
}

/**
 * @since 1.0.0
 */
export interface Blocking extends BeforeNavigationEvent {
  readonly cancel: Effect.Effect<Destination>;
  readonly confirm: Effect.Effect<Destination>;
  readonly redirect: (
    urlOrPath: string | URL,
    options?: NavigationNavigateOptions,
  ) => Effect.Effect<Destination>;
}

type InternalBlockState = Unblocked | Blocked;

type Unblocked = {
  readonly _tag: "Unblocked";
};
const Unblocked: Unblocked = { _tag: "Unblocked" };

type Blocked = {
  readonly _tag: "Blocked";
  readonly event: BeforeNavigationEvent;
  readonly deferred: Deferred.Deferred<void, RedirectError | CancelNavigation>;
};

const Blocked = (event: BeforeNavigationEvent) =>
  Effect.map(Deferred.make<void, RedirectError | CancelNavigation>(), (deferred): Blocked => ({
    _tag: "Blocked",
    deferred,
    event,
  }));

/**
 * @since 1.0.0
 */
export interface UseBlockNavigationParams<R = never> {
  readonly shouldBlock?: (
    event: BeforeNavigationEvent,
  ) => Effect.Effect<boolean, RedirectError | CancelNavigation, R>;
}

/**
 * @since 1.0.0
 */
export const useBlockNavigation = <R = never>(
  params: UseBlockNavigationParams<R> = {},
): Effect.Effect<BlockNavigation, never, Navigation | R | Scope.Scope> =>
  Effect.gen(function* () {
    const navigation = yield* Navigation;
    const blockState = yield* RefSubject.make<InternalBlockState>(Unblocked);

    yield* navigation.onBeforeNavigation<R, never>((event) =>
      RefSubject.modifyEffect(blockState, (state) =>
        Effect.gen(function* () {
          // Can't block twice
          if (state._tag === "Blocked") return [Option.none(), state] as const;

          if (params.shouldBlock && !(yield* params.shouldBlock(event))) {
            return [Option.none(), state] as const;
          }

          const updated = yield* Blocked(event);

          return [
            Option.some(
              Deferred.await(updated.deferred).pipe(
                Effect.ensuring(resetBlocked(blockState, updated)),
              ),
            ),
            updated,
          ] as const;
        }),
      ),
    );

    const blockNavigation: BlockNavigation = Object.assign(
      RefSubject.filterMap(blockState, (s) => {
        return s._tag === "Blocked"
          ? Option.some(blockedToBlocking(navigation, blockState, s))
          : Option.none();
      }),
      {
        isBlocking: RefSubject.map(blockState, (s) => s._tag === "Blocked"),
      },
    );

    yield* Effect.addFinalizer(() =>
      RefSubject.update(blockState, (state) => {
        if (state._tag === "Unblocked") return state;
        Deferred.doneUnsafe(state.deferred, Effect.fail(new CancelNavigation()));
        return Unblocked;
      }),
    );

    return blockNavigation;
  });

function blockedToBlocking(
  navigation: Navigation["Service"],
  blockState: RefSubject.RefSubject<InternalBlockState>,
  state: Blocked,
): Blocking {
  return {
    ...state.event,
    cancel: settleBlocked(blockState, state, Effect.fail(new CancelNavigation())).pipe(
      Effect.andThen(navigation.currentEntry),
    ),
    confirm: settleBlocked(blockState, state, Effect.void).pipe(
      Effect.andThen(navigation.currentEntry),
    ),
    redirect: (url, options) =>
      settleBlocked(blockState, state, Effect.fail(new RedirectError({ url, options }))).pipe(
        Effect.andThen(navigation.currentEntry),
      ),
  };
}

const settleBlocked = (
  blockState: RefSubject.RefSubject<InternalBlockState>,
  blocked: Blocked,
  result: Effect.Effect<void, RedirectError | CancelNavigation>,
) =>
  RefSubject.update(blockState, (state) => {
    if (state._tag !== "Blocked" || state.deferred !== blocked.deferred) return state;
    Deferred.doneUnsafe(blocked.deferred, result);
    return Unblocked;
  });

const resetBlocked = (blockState: RefSubject.RefSubject<InternalBlockState>, blocked: Blocked) =>
  RefSubject.update(blockState, (state) =>
    state._tag === "Blocked" && state.deferred === blocked.deferred ? Unblocked : state,
  );
