/**
 * Builds Vite InlineConfig from CLI flags.
 * Merges with user's vite.config; does not inject plugins (user config must include typedVitePlugin).
 */
import type { InlineConfig } from "vite";
import { Option } from "effect";

export interface SharedFlags {
  readonly config?: Option.Option<string>;
  readonly mode?: Option.Option<string>;
  readonly base?: Option.Option<string>;
  readonly logLevel?: Option.Option<"info" | "warn" | "error" | "silent">;
}

export interface ServeFlags extends SharedFlags {
  readonly host?: Option.Option<string>;
  readonly port?: Option.Option<number>;
  readonly open?: boolean;
  readonly cors?: boolean;
  readonly strictPort?: boolean;
  readonly force?: boolean;
}

export interface BuildFlags extends SharedFlags {
  readonly outDir?: Option.Option<string>;
  readonly target?: Option.Option<string>;
  readonly sourcemap?: boolean;
  readonly minify?: boolean;
  readonly watch?: boolean;
}

export interface PreviewFlags extends SharedFlags {
  readonly host?: Option.Option<string>;
  readonly port?: Option.Option<number>;
  readonly strictPort?: boolean;
  readonly open?: boolean;
}

const opt = <A>(x: Option.Option<A> | undefined): A | undefined =>
  x !== undefined ? Option.getOrUndefined(x) : undefined;

/**
 * Base InlineConfig from shared flags.
 */
export const baseInlineConfig = (
  flags: SharedFlags,
  root?: string,
): InlineConfig => ({
  root,
  configFile: opt(flags.config),
  mode: opt(flags.mode),
  base: opt(flags.base),
  logLevel: opt(flags.logLevel),
});

/**
 * InlineConfig for serve (dev server).
 */
export const serveInlineConfig = (
  flags: ServeFlags,
  root?: string,
): InlineConfig => ({
  ...baseInlineConfig(flags, root),
  server: {
    host: opt(flags.host),
    port: opt(flags.port),
    open: flags.open,
    cors: flags.cors,
    strictPort: flags.strictPort,
  },
  optimizeDeps: flags.force ? { force: true } : undefined,
});

/**
 * InlineConfig for build.
 */
export const buildInlineConfig = (
  flags: BuildFlags,
  root?: string,
): InlineConfig => ({
  ...baseInlineConfig(flags, root),
  build: {
    outDir: opt(flags.outDir),
    target: opt(flags.target),
    sourcemap: flags.sourcemap,
    minify: flags.minify,
    watch: flags.watch ? {} : undefined,
  },
});

/**
 * InlineConfig for preview.
 */
export const previewInlineConfig = (
  flags: PreviewFlags,
  root?: string,
): InlineConfig => ({
  ...baseInlineConfig(flags, root),
  preview: {
    host: opt(flags.host),
    port: opt(flags.port),
    strictPort: flags.strictPort,
    open: flags.open,
  },
});
