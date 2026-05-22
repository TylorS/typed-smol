import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type * as Scope from "effect/Scope";
import { fromWindow } from "@typed/navigation/fromWindow";
import {
  initialMemory,
  type InitialMemoryOptions,
  memory,
  type MemoryOptions,
} from "@typed/navigation/memory";
import { Navigation } from "@typed/navigation/Navigation";
import { CurrentRoute } from "./CurrentRoute.js";
import { Ids } from "@typed/id";

export type Router = CurrentRoute | Navigation;
export type NavigateOptions = Omit<NavigationNavigateOptions, "history">;

export const push = (
  url: string | URL,
  options?: NavigateOptions,
): Effect.Effect<void, never, Router | Scope.Scope> =>
  Navigation.navigate(url, { ...options, history: "push" }).pipe(
    Effect.forkScoped({ startImmediately: true }),
    Effect.asVoid,
  );

export const replace = (
  url: string | URL,
  options?: NavigateOptions,
): Effect.Effect<void, never, Router | Scope.Scope> =>
  Navigation.navigate(url, { ...options, history: "replace" }).pipe(
    Effect.forkScoped({ startImmediately: true }),
    Effect.asVoid,
  );

export const BrowserRouter = (window?: Window): Layer.Layer<Router> =>
  CurrentRoute.Default.pipe(
    Layer.provideMerge(fromWindow(window)),
    Layer.provideMerge(Ids.Default),
  );

export const ServerRouter = (options: MemoryOptions | InitialMemoryOptions): Layer.Layer<Router> =>
  CurrentRoute.Default.pipe(
    Layer.provideMerge("url" in options ? initialMemory(options) : memory(options)),
    Layer.provideMerge(Ids.Default),
  );

export const TestRouter = (
  options: (MemoryOptions | InitialMemoryOptions) & {},
): Layer.Layer<Router> =>
  CurrentRoute.Default.pipe(
    Layer.provideMerge("url" in options ? initialMemory(options) : memory(options)),
    Layer.provideMerge(Ids.Test()),
  );
