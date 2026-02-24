/**
 * Resolves a config field: raw value or yield* Config.
 * Requires ConfigProvider when value is Config.
 */
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";

export function resolveConfig<T>(
  value: T | Config.Config<T> | undefined,
  def: T,
): Effect.Effect<T, Config.ConfigError> {
  if (value === undefined) return Effect.succeed(def);
  if (Config.isConfig(value)) return value.asEffect();
  return Effect.succeed(value);
}
