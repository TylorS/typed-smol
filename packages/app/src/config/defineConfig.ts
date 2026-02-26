import type { TypedConfig } from "./TypedConfig.js";

/**
 * Identity helper that provides full TypeScript inference for `typed.config.ts`.
 *
 * @example
 * ```ts
 * // typed.config.ts
 * import { defineConfig } from "@typed/app";
 *
 * export default defineConfig({
 *   entry: "server.ts",
 *   server: { port: 3000 },
 *   test: { typecheck: true },
 * });
 * ```
 */
export function defineConfig(config: TypedConfig): TypedConfig {
  return config;
}
