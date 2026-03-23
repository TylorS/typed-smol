import * as Effect from "effect/Effect";
import { BrowserRouter } from "../Router.js";

/**
 * Build an absolute URL for the Vitest browser page origin (same pattern as in-memory tests using http://localhost/...).
 */
export const absoluteUrl = (path: string, win: Window & typeof globalThis = globalThis.window): string => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, win.location.origin).href;
};

/**
 * Run an effect with {@link BrowserRouter} scoped over the real (or test) `window`.
 */
export const runWithBrowserRouter = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  win: Window & typeof globalThis = globalThis.window,
): Promise<A> =>
  effect.pipe(Effect.provide(BrowserRouter(win)), Effect.scoped, Effect.runPromise);
