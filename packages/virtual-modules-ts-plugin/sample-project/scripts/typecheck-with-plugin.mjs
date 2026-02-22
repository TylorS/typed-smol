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
  createTypeInfoApiSession,
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

function loadPlugins() {
  const loader = new NodeModulePluginLoader();
  const results = loader.loadMany([
    { specifier: "./plugin.cjs", baseDir: projectRoot },
    { specifier: "./plugins/router-plugin.cjs", baseDir: projectRoot },
  ]);
  const plugins = [];
  for (const r of results) {
    if (r.status === "loaded") plugins.push(r.plugin);
    else console.error("Plugin load failed:", r.specifier, r.message);
  }
  return plugins;
}

const { fileNames, options } = getTsconfig(projectRoot);
const innerHost = ts.createCompilerHost(options);
const innerProgram = ts.createProgram(fileNames, options, innerHost);
const createTypeInfoApiSessionFactory = () =>
  createTypeInfoApiSession({ ts, program: innerProgram });

const plugins = loadPlugins();
if (plugins.length === 0) {
  console.error("No plugins loaded. Run pnpm build:plugins first.");
  process.exit(1);
}

const resolver = new PluginManager(plugins);
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
