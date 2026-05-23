import type { VirtualModuleBuildError, VirtualModulePlugin } from "@typed/virtual-modules";
import { emitStorybookSource } from "./internal/emitStorybookSource.js";
import { parseTypedVirtualModuleId } from "./internal/frameworkVirtualModuleId.js";

const DEFAULT_PLUGIN_NAME = "typed-storybook-virtual-module";

export interface StorybookVirtualModulePluginOptions {
  readonly name?: string;
}

export function createStorybookVirtualModulePlugin(
  options: StorybookVirtualModulePluginOptions = {},
): VirtualModulePlugin {
  const name = options.name ?? DEFAULT_PLUGIN_NAME;

  return {
    name,
    shouldResolve(id) {
      const parsed = parseTypedVirtualModuleId(id);
      return parsed.ok && parsed.kind === "storybook";
    },
    build(id) {
      const parsed = parseTypedVirtualModuleId(id);
      if (!parsed.ok) return buildError(parsed.code, parsed.reason, name);
      if (parsed.kind !== "storybook") {
        return buildError("TVM-ID-001", "expected typed:storybook", name);
      }
      return emitStorybookSource(parsed);
    },
  };
}

function buildError(code: string, message: string, pluginName: string): VirtualModuleBuildError {
  return { errors: [{ code, message, pluginName }] };
}
