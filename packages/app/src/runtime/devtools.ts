import { makeDevtoolsSessionId, type DevtoolsSessionId } from "@typed/devtools-protocol";
import { DevtoolsRuntimeLayer, type DevtoolsRuntimeOptions } from "@typed/devtools-runtime";
import type * as Layer from "effect/Layer";
import type { TypedConfig } from "../config/TypedConfig.js";

export interface ResolvedTypedDevtoolsConfig {
  readonly enabled: boolean;
  readonly sessionId?: DevtoolsSessionId;
}

export function resolveDevtoolsConfig(
  config: Pick<TypedConfig, "devtools">,
): ResolvedTypedDevtoolsConfig {
  const devtools = config.devtools;
  if (devtools === true) return { enabled: true };
  if (devtools === false || devtools === undefined) return { enabled: false };
  const enabled = devtools.enabled === true;
  return {
    enabled,
    ...(enabled && devtools.sessionId && { sessionId: makeDevtoolsSessionId(devtools.sessionId) }),
  };
}

export function devtoolsLayerFromConfig(
  config: Pick<TypedConfig, "devtools">,
): Layer.Layer<import("@typed/devtools-runtime").DevtoolsRuntime> {
  return DevtoolsRuntimeLayer(toRuntimeOptions(resolveDevtoolsConfig(config)));
}

function toRuntimeOptions(config: ResolvedTypedDevtoolsConfig): DevtoolsRuntimeOptions {
  return {
    enabled: config.enabled,
    ...(config.sessionId && { sessionId: config.sessionId }),
  };
}
