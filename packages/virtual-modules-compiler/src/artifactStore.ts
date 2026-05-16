import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type * as ts from "typescript";
import type {
  ArtifactStoreFingerprints,
  LoadedVmcPluginModule,
  TypeTargetSpec,
  VirtualArtifactStoreFactory,
  VirtualArtifactFingerprint,
  VirtualModulePlugin,
  VirtualModuleResolver,
} from "@typed/virtual-modules";
import {
  createParsedTsconfigFingerprint,
  createPluginConfigFingerprint,
  createPluginModuleFingerprint,
  createPluginPackageFingerprint,
  createSourceInputFingerprint,
  createTypeScriptFingerprint,
  createVirtualArtifactStore,
  hashVirtualArtifactContent,
} from "@typed/virtual-modules";

interface CreateVmcArtifactStoreFactoryOptions {
  readonly ts: typeof import("typescript");
  readonly projectRoot: string;
  readonly commandLine: ts.ParsedCommandLine;
  readonly rootNames: readonly string[];
  readonly resolver: VirtualModuleResolver;
  readonly vmcConfigPath?: string;
  readonly vmcConfigDependencyPaths?: readonly string[];
  readonly pluginModules?: readonly LoadedVmcPluginModule[];
  readonly typeTargetSpecs?: readonly TypeTargetSpec[];
}

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export function createVmcArtifactStoreFactory(
  options: CreateVmcArtifactStoreFactoryOptions,
): VirtualArtifactStoreFactory {
  const fingerprints = createVmcArtifactFingerprints(options);
  return ({ pluginName, virtualKey, projectRoot }) =>
    createVirtualArtifactStore({
      projectRoot,
      pluginName,
      virtualKey,
      fingerprints,
    });
}

function createVmcArtifactFingerprints(
  options: CreateVmcArtifactStoreFactoryOptions,
): ArtifactStoreFingerprints {
  return {
    sourceInputFingerprints: options.rootNames.map(createSourceInputFingerprint),
    pluginFingerprints: [
      createVmcConfigFingerprint(options.projectRoot, options.vmcConfigPath),
      ...createVmcConfigDependencyFingerprints(options.vmcConfigDependencyPaths ?? []),
      ...createPluginModuleFingerprints(options.projectRoot, options.pluginModules ?? []),
      createPluginConfigFingerprint("vmc-resolver", createResolverSnapshot(options)),
    ],
    compilerFingerprints: [
      createTypeScriptFingerprint(options.ts.version),
      createParsedTsconfigFingerprint(
        createParsedCommandLineSnapshot(options.projectRoot, options.commandLine),
      ),
    ],
  };
}

function createVmcConfigDependencyFingerprints(
  dependencyPaths: readonly string[],
): readonly VirtualArtifactFingerprint[] {
  return dependencyPaths.map((dependencyPath) =>
    createPluginModuleFingerprint(`vmc.config:${dependencyPath}`, dependencyPath),
  );
}

function createVmcConfigFingerprint(projectRoot: string, loadedConfigPath: string | undefined) {
  const configPath = loadedConfigPath ?? join(projectRoot, "vmc.config.ts");
  if (!existsSync(configPath)) {
    return createPluginConfigFingerprint("vmc.config.ts", { status: "not-found" });
  }
  return {
    kind: "config" as const,
    name: "vmc.config.ts",
    hash: hashVirtualArtifactContent(readFileSync(configPath)),
  };
}

function createPluginModuleFingerprints(
  projectRoot: string,
  pluginModules: readonly LoadedVmcPluginModule[],
): readonly VirtualArtifactFingerprint[] {
  return pluginModules.flatMap((pluginModule) => [
    createPluginModuleFingerprint(pluginModule.pluginName, pluginModule.resolvedPath),
    ...pluginModule.dependencyPaths.map((dependencyPath) =>
      createPluginModuleFingerprint(`${pluginModule.pluginName}:${dependencyPath}`, dependencyPath),
    ),
    ...createPluginPackageFingerprints(projectRoot, pluginModule),
  ]);
}

function createPluginPackageFingerprints(
  projectRoot: string,
  pluginModule: LoadedVmcPluginModule,
): readonly VirtualArtifactFingerprint[] {
  const packageJsonPath = findPackageJson(projectRoot, dirname(pluginModule.resolvedPath));
  if (!packageJsonPath) return [];

  const metadata = readPackageMetadata(packageJsonPath);
  if (!metadata?.version) return [];

  return [createPluginPackageFingerprint(metadata.name, metadata.version)];
}

function findPackageJson(projectRoot: string, startDir: string): string | undefined {
  let current = startDir;
  while (current.startsWith(projectRoot)) {
    const candidate = join(current, "package.json");
    if (existsSync(candidate)) return candidate;

    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
  return undefined;
}

function readPackageMetadata(
  packageJsonPath: string,
): { readonly name: string; readonly version?: string } | undefined {
  try {
    const metadata = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      readonly name?: unknown;
      readonly version?: unknown;
    };
    return typeof metadata.name === "string" && metadata.name.length > 0
      ? {
          name: metadata.name,
          ...(typeof metadata.version === "string" ? { version: metadata.version } : {}),
        }
      : undefined;
  } catch {
    return undefined;
  }
}

function createResolverSnapshot(options: CreateVmcArtifactStoreFactoryOptions): JsonValue {
  return {
    plugins: getResolverPlugins(options.resolver).map((plugin) => ({
      name: plugin.name,
      shouldResolve: plugin.shouldResolve.toString(),
      build: plugin.build.toString(),
      typeTargetSpecs: toJsonValue(plugin.typeTargetSpecs ?? []),
    })),
    hasResolveModule: typeof options.resolver.resolveModule === "function",
    hasResolvePluginName: typeof options.resolver.resolvePluginName === "function",
    typeTargetSpecs: toJsonValue(options.typeTargetSpecs ?? []),
  };
}

function getResolverPlugins(resolver: VirtualModuleResolver): readonly VirtualModulePlugin[] {
  const candidate = resolver as { readonly plugins?: unknown };
  return Array.isArray(candidate.plugins)
    ? candidate.plugins.filter((plugin): plugin is VirtualModulePlugin => isPlugin(plugin))
    : [];
}

function isPlugin(value: unknown): value is VirtualModulePlugin {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<VirtualModulePlugin>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.shouldResolve === "function" &&
    typeof candidate.build === "function"
  );
}

function createParsedCommandLineSnapshot(
  projectRoot: string,
  commandLine: ts.ParsedCommandLine,
): JsonValue {
  return {
    fileNames: commandLine.fileNames.map((file) => relative(projectRoot, file)).sort(),
    options: toJsonValue(commandLine.options),
    projectReferences: toJsonValue(commandLine.projectReferences ?? []),
    watchOptions: toJsonValue(commandLine.watchOptions ?? {}),
    raw: toJsonValue(commandLine.raw ?? {}),
  };
}

function toJsonValue(value: unknown): JsonValue {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value !== "object") return String(value);

  const entries = Object.entries(value)
    .filter(([, item]) => typeof item !== "function" && typeof item !== "symbol")
    .sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries.map(([key, item]) => [key, toJsonValue(item)]));
}
