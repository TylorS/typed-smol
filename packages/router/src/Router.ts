import * as Layer from "effect/Layer";
import { fromWindow } from "@typed/navigation/fromWindow";
import {
  initialMemory,
  type InitialMemoryOptions,
  memory,
  type MemoryOptions,
} from "@typed/navigation/memory";
import type { Navigation } from "@typed/navigation/Navigation";
import { CurrentRoute } from "./CurrentRoute.js";
import { Ids } from "@typed/id";

export type Router = CurrentRoute | Navigation;

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

export const TestRouter = (options: (MemoryOptions | InitialMemoryOptions) & {}): Layer.Layer<Router> =>
  CurrentRoute.Default.pipe(
    Layer.provideMerge("url" in options ? initialMemory(options) : memory(options)),
    Layer.provideMerge(Ids.Test()),
  );
