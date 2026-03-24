/**
 * Shared CLI flags mirroring Vite's options.
 * Used across serve, build, preview, and run commands.
 */
import { Flag } from "effect/unstable/cli";

export const configFlag = Flag.optional(
  Flag.path("config", { pathType: "file", mustExist: false }).pipe(
    Flag.withAlias("c"),
    Flag.withDescription("Path to vite.config.ts"),
  ),
);

export const modeFlag = Flag.optional(
  Flag.string("mode").pipe(Flag.withAlias("m"), Flag.withDescription("Set env mode")),
);

export const baseFlag = Flag.optional(
  Flag.string("base").pipe(Flag.withDescription("Public base path (default: /)")),
);

export const logLevelFlag = Flag.optional(
  Flag.choice("logLevel", ["info", "warn", "error", "silent"] as const).pipe(
    Flag.withAlias("l"),
    Flag.withDescription("Set log level"),
  ),
);

export const entryFlag = Flag.optional(
  Flag.path("entry", { pathType: "file", mustExist: false }).pipe(
    Flag.withDescription("Server entry file (default: server.ts)"),
  ),
);
