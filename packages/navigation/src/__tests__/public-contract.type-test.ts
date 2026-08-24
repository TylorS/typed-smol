import { Ids } from "@typed/id";
import {
  type BeforeNavigationHandler,
  Navigation,
  type NavigationError,
  type NavigationHandler,
  fromWindow,
  initialMemory,
  memory,
} from "@typed/navigation";
import { Effect, Layer, Option } from "effect";
import type * as Scope from "effect/Scope";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

interface BeforeOuter {
  readonly BeforeOuter: unique symbol;
}
interface BeforeInner {
  readonly BeforeInner: unique symbol;
}
interface AfterOuter {
  readonly AfterOuter: unique symbol;
}
interface AfterInner {
  readonly AfterInner: unique symbol;
}

declare const beforeHandler: BeforeNavigationHandler<BeforeOuter, BeforeInner>;
declare const afterHandler: NavigationHandler<AfterOuter, AfterInner>;
declare const destination: import("@typed/navigation").Destination;

const beforeRegistration = Navigation.onBeforeNavigation(beforeHandler);
const afterRegistration = Navigation.onNavigation(afterHandler);

type _BeforeRegistration = Assert<
  Equal<
    typeof beforeRegistration,
    Effect.Effect<void, never, Navigation | BeforeOuter | BeforeInner | Scope.Scope>
  >
>;
type _AfterRegistration = Assert<
  Equal<
    typeof afterRegistration,
    Effect.Effect<void, never, Navigation | AfterOuter | AfterInner | Scope.Scope>
  >
>;

type _BrowserLayer = Assert<
  Equal<ReturnType<typeof fromWindow>, Layer.Layer<Navigation, NavigationError, Ids>>
>;
type _InitialMemoryLayer = Assert<
  Equal<ReturnType<typeof initialMemory>, Layer.Layer<Navigation, NavigationError, Ids>>
>;
type _MemoryLayer = Assert<Equal<ReturnType<typeof memory>, Layer.Layer<Navigation, never, Ids>>>;

void memory({ entries: [destination] });

const NavigationLive = initialMemory({ url: "https://example.com/" }).pipe(
  Layer.provide(Ids.Default),
);

const program = Effect.scoped(
  Effect.gen(function* () {
    const navigation = yield* Navigation;

    yield* navigation.onBeforeNavigation(() => Effect.succeed(Option.none()));
    yield* navigation.onNavigation(() => Effect.succeed(Option.none()));
    yield* navigation.navigate("/account", { history: "push" });
  }),
).pipe(Effect.provide(NavigationLive));

const runnable: Effect.Effect<void, NavigationError> = program;
void runnable;
