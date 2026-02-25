/**
 * Type-checks the sample project with virtual modules resolved via CompilerHostAdapter.
 * Run from sample-project: node scripts/typecheck-with-plugin.mjs
 * Use this instead of `tsc --noEmit` when virtual modules (router:routes, virtual:foo) must resolve.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  attachCompilerHostAdapter,
  collectTypeTargetSpecsFromPlugins,
  createTypeInfoApiSession,
  createTypeTargetBootstrapContent,
  loadVmcConfig,
  NodeModulePluginLoader,
  PluginManager,
} from "@typed/virtual-modules";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

function getTsconfig(rootDir) {
  const configPath = join(rootDir, "tsconfig.json");
  const configFile = ts.readConfigFile(configPath, (p) => readFileSync(p, "utf8"));
  if (configFile.error) {
    throw new Error(`Failed to read tsconfig: ${configFile.error.messageText}`);
  }
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    {
      readFile: (p) => readFileSync(p, "utf8"),
      readDirectory: ts.sys.readDirectory,
      fileExists: (p) => existsSync(p),
    },
    rootDir,
    undefined,
    configPath,
  );
  return { fileNames: parsed.fileNames, options: parsed.options };
}

function loadResolver(rootDir) {
  const loaded = loadVmcConfig({ projectRoot: rootDir, ts });
  if (loaded.status === "not-found") {
    throw new Error("vmc config not found. Expected vmc.config.ts in the project root.");
  }
  if (loaded.status === "error") {
    throw new Error(loaded.message);
  }
  if (loaded.config.resolver) {
    return loaded.config.resolver;
  }

  const pluginEntries = loaded.config.plugins ?? [];
  const baseDir = dirname(loaded.path);
  const loader = new NodeModulePluginLoader();
  const plugins = [];
  for (const entry of pluginEntries) {
    if (typeof entry === "string") {
      const result = loader.load({ specifier: entry, baseDir });
      if (result.status === "loaded") {
        plugins.push(result.plugin);
      } else {
        throw new Error(`Plugin load failed (${entry}): ${result.message}`);
      }
    } else {
      plugins.push(entry);
    }
  }
  if (plugins.length === 0) {
    throw new Error("No plugins found in vmc config.");
  }

  return new PluginManager(plugins);
}

const { fileNames, options } = getTsconfig(projectRoot);
const resolver = (() => {
  try {
    return loadResolver(projectRoot);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
})();

const typeTargetSpecs = collectTypeTargetSpecsFromPlugins(resolver.plugins);
const bootstrapPath = join(projectRoot, ".typed", "type-target-bootstrap.ts");
let programFileNames = fileNames;
if (typeTargetSpecs.length > 0) {
  const { mkdirSync, writeFileSync } = await import("node:fs");
  const { dirname } = await import("node:path");
  mkdirSync(dirname(bootstrapPath), { recursive: true });
  writeFileSync(bootstrapPath, createTypeTargetBootstrapContent(typeTargetSpecs), "utf8");
  programFileNames = [...fileNames, bootstrapPath];
}

const innerHost = ts.createCompilerHost(options);
const innerProgram = ts.createProgram(programFileNames, options, innerHost);
const createTypeInfoApiSessionFactory = () =>
  createTypeInfoApiSession({
    ts,
    program: innerProgram,
    typeTargetSpecs: typeTargetSpecs.length ? typeTargetSpecs : undefined,
    failWhenNoTargetsResolved: false,
  });

const outerHost = ts.createCompilerHost(options);
attachCompilerHostAdapter({
  ts,
  compilerHost: outerHost,
  projectRoot,
  resolver,
  createTypeInfoApiSession: createTypeInfoApiSessionFactory,
});

const program = ts.createProgram(fileNames, options, outerHost);
const diagnostics = ts.getPreEmitDiagnostics(program);

const errors = diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
if (errors.length > 0) {
  const formatHost = {
    getCanonicalFileName: (f) => f,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => "\n",
  };
  console.error(ts.formatDiagnosticsWithColorAndContext(errors, formatHost));
  process.exit(1);
}

console.log("Typecheck OK (virtual modules resolved).");
process.exit(0);
