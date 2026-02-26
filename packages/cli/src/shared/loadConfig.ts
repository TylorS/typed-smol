/**
 * CLI-side wrapper around loadTypedConfig from @typed/app.
 * Provides the shared "load once, use everywhere" pattern for all CLI commands.
 */
import { loadTypedConfig } from "@typed/app";
import type { TypedConfig } from "@typed/app";
import { Option } from "effect";

export type { TypedConfig };

export interface LoadedConfig {
  readonly config: TypedConfig;
  readonly path: string;
}

/**
 * Loads typed.config.ts from the project root. Returns undefined if not found.
 * Logs a warning on error and falls back to empty config.
 */
export function loadProjectConfig(projectRoot: string): LoadedConfig | undefined {
  const result = loadTypedConfig({ projectRoot });
  if (result.status === "loaded") {
    return { config: result.config, path: result.path };
  }
  if (result.status === "error") {
    console.warn(`[typed] Warning: ${result.message}`);
  }
  return undefined;
}

/**
 * Resolves a value from: CLI flag (Option) > config value > default.
 */
export function resolve<T>(
  flag: Option.Option<T> | undefined,
  configValue: T | undefined,
  defaultValue: T,
): T {
  if (flag !== undefined) {
    const fromFlag = Option.getOrUndefined(flag);
    if (fromFlag !== undefined) return fromFlag;
  }
  return configValue ?? defaultValue;
}

/**
 * Resolves a boolean from: CLI flag > config value > default.
 * Boolean flags don't use Option — they default to a value.
 * Returns the flag value if it differs from the built-in default (indicating the user set it),
 * otherwise falls back to config, then built-in default.
 */
export function resolveBoolean(
  flag: boolean,
  configValue: boolean | undefined,
  builtinDefault: boolean,
): boolean {
  if (flag !== builtinDefault) return flag;
  return configValue ?? builtinDefault;
}
