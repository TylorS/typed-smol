/**
 * Vite 7 programmatic API wrappers in Effect.
 */
import { Effect } from "effect";
import { createServer, build, preview } from "vite";
import type { InlineConfig, ViteDevServer, PreviewServer } from "vite";

export type { InlineConfig, ViteDevServer };

/**
 * Create Vite dev server.
 */
export const createViteServer = (
  config?: InlineConfig,
): Effect.Effect<ViteDevServer, Error> =>
  Effect.tryPromise({
    try: () => createServer(config ?? {}),
    catch: (e) => (e instanceof Error ? e : new Error(String(e))),
  });

/**
 * Run Vite build.
 */
export const runViteBuild = (
  config?: InlineConfig,
): Effect.Effect<Awaited<ReturnType<typeof build>>, Error> =>
  Effect.tryPromise({
    try: () => build(config ?? {}),
    catch: (e) => (e instanceof Error ? e : new Error(String(e))),
  });

/**
 * Create Vite preview server.
 */
export const createVitePreview = (
  config?: InlineConfig,
): Effect.Effect<PreviewServer, Error> =>
  Effect.tryPromise({
    try: () => preview(config ?? {}),
    catch: (e) => (e instanceof Error ? e : new Error(String(e))),
  });
