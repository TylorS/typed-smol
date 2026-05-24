import { dirname, relative, resolve } from "node:path";
import type { VirtualModuleBuildError, VirtualModulePlugin } from "@typed/virtual-modules";
import { emitStorybookSource } from "./internal/emitStorybookSource.js";
import { parseTypedVirtualModuleId } from "./internal/frameworkVirtualModuleId.js";
import { toPosixPath } from "./internal/path.js";

const DEFAULT_PLUGIN_NAME = "typed-storybook-virtual-module";

export interface StorybookVirtualModulePluginOptions {
  readonly name?: string;
  readonly runtimeDefaults?: {
    readonly routes?: readonly string[];
    readonly api?: readonly string[];
    readonly proxyPath?: string;
    readonly serverOrigin?: string;
    readonly baseDir?: string;
  };
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
    build(id, importer) {
      const parsed = parseTypedVirtualModuleId(id);
      if (!parsed.ok) return buildError(parsed.code, parsed.reason, name);
      if (parsed.kind !== "storybook") {
        return buildError("TVM-ID-001", "expected typed:storybook", name);
      }
      return emitStorybookSource(withRuntimeDefaults(parsed, importer, options.runtimeDefaults));
    },
  };
}

type StorybookId = Extract<
  ReturnType<typeof parseTypedVirtualModuleId>,
  { readonly ok: true; readonly kind: "storybook" }
>;

function withRuntimeDefaults(
  parsed: StorybookId,
  importer: string | undefined,
  defaults: StorybookVirtualModulePluginOptions["runtimeDefaults"],
): StorybookId {
  if (parsed.module !== "runtime" || !defaults) return parsed;
  return {
    ...parsed,
    routes:
      parsed.routes.length > 0
        ? parsed.routes
        : relativizeDefaultTargets(defaults.routes ?? [], importer, defaults.baseDir),
    apis:
      parsed.apis.length > 0
        ? parsed.apis
        : relativizeDefaultTargets(defaults.api ?? [], importer, defaults.baseDir),
    proxyPath: parsed.proxyPath ?? defaults.proxyPath,
    serverOrigin: parsed.serverOrigin ?? defaults.serverOrigin,
  };
}

function relativizeDefaultTargets(
  targets: readonly string[],
  importer: string | undefined,
  baseDir: string | undefined,
): readonly string[] {
  if (!importer || !baseDir) return targets;
  const importerDir = dirname(toPosixPath(importer));
  return targets.map((target) => {
    if (target.startsWith("../")) return target;
    const absoluteTarget = resolve(baseDir, target);
    const relativeTarget = toPosixPath(relative(importerDir, absoluteTarget));
    return relativeTarget.startsWith(".") ? relativeTarget : `./${relativeTarget}`;
  });
}

function buildError(code: string, message: string, pluginName: string): VirtualModuleBuildError {
  return { errors: [{ code, message, pluginName }] };
}
