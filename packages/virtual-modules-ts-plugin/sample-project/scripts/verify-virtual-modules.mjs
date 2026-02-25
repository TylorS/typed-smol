/**
 * Verifies that virtual modules "router:routes", "api:./api", and "virtual:foo" resolve and build.
 * Run from sample-project: node scripts/verify-virtual-modules.mjs
 * Requires: pnpm install, pnpm build:plugins, and @typed/virtual-modules + @typed/app built.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectTypeTargetSpecsFromPlugins,
  createTypeInfoApiSession,
  createTypeTargetBootstrapContent,
  NodeModulePluginLoader,
  PluginManager,
} from "@typed/virtual-modules";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

function getTsconfig(rootDir) {
  const configPath = join(rootDir, "tsconfig.json");
  const content = readFileSync(configPath, "utf8");
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
    { specifier: "./plugin.mjs", baseDir: projectRoot },
    { specifier: "./plugins/router-plugin.mjs", baseDir: projectRoot },
    { specifier: "./plugins/httpapi-plugin.mjs", baseDir: projectRoot },
  ]);
  const plugins = [];
  for (const r of results) {
    if (r.status === "loaded") plugins.push(r.plugin);
    else console.error(`Plugin load failed: ${r.specifier}`, r.message);
  }
  return plugins;
}

const plugins = loadPlugins();
if (plugins.length === 0) {
  console.error("No plugins loaded. Run pnpm build:plugins first.");
  process.exit(1);
}

const typeTargetSpecs = collectTypeTargetSpecsFromPlugins(plugins);
const { fileNames, options } = getTsconfig(projectRoot);
const host = ts.createCompilerHost(options);

// Add bootstrap file so resolveTypeTargetsFromSpecs can find Layer, Route, etc.
const bootstrapPath = join(projectRoot, ".typed", "type-target-bootstrap.ts");
if (typeTargetSpecs.length > 0) {
  mkdirSync(dirname(bootstrapPath), { recursive: true });
  writeFileSync(bootstrapPath, createTypeTargetBootstrapContent(typeTargetSpecs), "utf8");
}
const programFileNames =
  typeTargetSpecs.length > 0 && existsSync(bootstrapPath)
    ? [...fileNames, bootstrapPath]
    : fileNames;
const program = ts.createProgram(programFileNames, options, host);
const sessionFactory = () =>
  createTypeInfoApiSession({
    ts,
    program,
    typeTargetSpecs: typeTargetSpecs.length ? typeTargetSpecs : undefined,
    failWhenNoTargetsResolved: false,
  });

const resolver = new PluginManager(plugins);

const routerImporter = join(projectRoot, "router-demo.ts");
const routerResult = resolver.resolveModule({
  id: "router:routes",
  importer: routerImporter,
  createTypeInfoApiSession: sessionFactory,
});

const fooImporter = join(projectRoot, "entry.ts");
const fooResult = resolver.resolveModule({
  id: "virtual:foo",
  importer: fooImporter,
  createTypeInfoApiSession: sessionFactory,
});

const serverImporter = join(projectRoot, "server.ts");
const apiResult = resolver.resolveModule({
  id: "api:./api",
  importer: serverImporter,
  createTypeInfoApiSession: sessionFactory,
});

let failed = false;
if (routerResult.status !== "resolved") {
  console.error(
    "router:routes failed:",
    routerResult.status === "error" ? routerResult.diagnostic?.message : "unresolved",
  );
  failed = true;
} else {
  console.log("OK router:routes resolved, source length:", routerResult.sourceText?.length ?? 0);
}

if (fooResult.status !== "resolved") {
  console.error(
    "virtual:foo failed:",
    fooResult.status === "error" ? fooResult.diagnostic?.message : "unresolved",
  );
  failed = true;
} else {
  console.log("OK virtual:foo resolved");
}

if (apiResult.status !== "resolved") {
  console.error(
    "api:./api failed:",
    apiResult.status === "error" ? apiResult.diagnostic?.message : "unresolved",
  );
  failed = true;
} else {
  console.log("OK api:./api resolved, source length:", apiResult.sourceText?.length ?? 0);
}

process.exit(failed ? 1 : 0);
