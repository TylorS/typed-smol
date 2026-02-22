"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// scripts/router-plugin-entry.mjs
var router_plugin_entry_exports = {};
__export(router_plugin_entry_exports, {
  default: () => router_plugin_entry_default
});
module.exports = __toCommonJS(router_plugin_entry_exports);

// ../../app/dist/RouterVirtualModulePlugin.js
var import_node_fs2 = require("node:fs");
var import_node_path2 = require("node:path");

// ../../app/dist/internal/routeTypeNode.js
function getReferenceTypeName(text) {
  const withoutTypeArgs = text.includes("<") ? text.split("<")[0].trim() : text.trim();
  const lastSegment = withoutTypeArgs.split(".").pop();
  return lastSegment ?? withoutTypeArgs;
}
function typeNodeIsRouteCompatible(node) {
  if (node.kind !== "reference")
    return false;
  const name = getReferenceTypeName(node.text);
  return name === "Route";
}
function runtimeKindFromTypeText(text) {
  const name = getReferenceTypeName(text);
  if (name === "Fx")
    return "fx";
  if (name === "Stream")
    return "stream";
  if (name === "Effect")
    return "effect";
  return "plain";
}
function runtimeKindFromNode(n) {
  if (n.kind === "reference")
    return runtimeKindFromTypeText(n.text);
  if (n.kind === "union")
    for (const el of n.elements) {
      const k = runtimeKindFromNode(el);
      if (k !== "plain")
        return k;
    }
  if (n.kind === "intersection")
    for (const el of n.elements) {
      const k = runtimeKindFromNode(el);
      if (k !== "plain")
        return k;
    }
  return runtimeKindFromTypeText(n.text);
}
function typeNodeToRuntimeKind(node) {
  const root = node.kind === "function" ? node.returnType : node;
  return runtimeKindFromNode(root);
}
function typeNodeIsEffectOptionRef(node) {
  if (node.kind !== "reference")
    return false;
  const ref = node;
  const name = getReferenceTypeName(ref.text);
  if (name !== "Effect")
    return false;
  const args = ref.typeArguments;
  if (!args || args.length < 1)
    return false;
  const first = args[0];
  if (first.kind !== "reference")
    return false;
  const optionName = getReferenceTypeName(first.text);
  return optionName === "Option";
}
function typeNodeIsEffectOptionReturn(node) {
  const returnType = node.kind === "function" ? node.returnType : node;
  if (typeNodeIsEffectOptionRef(returnType))
    return true;
  if (returnType.kind === "union")
    return returnType.elements.some(typeNodeIsEffectOptionReturn);
  if (returnType.kind === "intersection")
    return returnType.elements.some(typeNodeIsEffectOptionReturn);
  return false;
}

// ../../app/dist/internal/path.js
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");
var toPosixPath = (path) => path.replaceAll("\\", "/");
var resolveRelativePath = (baseDir, relativePath) => toPosixPath((0, import_node_path.resolve)(baseDir, relativePath));
function resolvePathUnderBase(baseDir, relativePath) {
  const baseAbs = (0, import_node_path.resolve)(baseDir);
  const resolved = (0, import_node_path.resolve)(baseDir, relativePath);
  const rel = (0, import_node_path.relative)(baseAbs, resolved);
  if (rel.startsWith("..") || (0, import_node_path.isAbsolute)(rel)) {
    return { ok: false, error: "path-escapes-base" };
  }
  return { ok: true, path: toPosixPath(resolved) };
}
function pathIsUnderBase(baseDir, absolutePath) {
  let baseAbs;
  let resolvedAbs;
  try {
    baseAbs = (0, import_node_fs.realpathSync)((0, import_node_path.resolve)(baseDir));
    resolvedAbs = (0, import_node_fs.realpathSync)((0, import_node_path.resolve)(absolutePath));
  } catch {
    baseAbs = (0, import_node_path.resolve)(baseDir);
    resolvedAbs = (0, import_node_path.resolve)(absolutePath);
  }
  const rel = (0, import_node_path.relative)(baseAbs, resolvedAbs);
  if (rel.startsWith("..") || (0, import_node_path.isAbsolute)(rel)) {
    return false;
  }
  return true;
}

// ../../app/dist/internal/validation.js
var DEFAULT_MAX_LENGTH = 4096;
function validateNonEmptyString(value, name, maxLength = DEFAULT_MAX_LENGTH) {
  if (typeof value !== "string") {
    return { ok: false, reason: `${name} must be a string` };
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return { ok: false, reason: `${name} must be non-empty` };
  }
  if (value.includes("\0")) {
    return { ok: false, reason: `${name} must not contain null bytes` };
  }
  if (value.length > maxLength) {
    return { ok: false, reason: `${name} exceeds max length ${maxLength}` };
  }
  return { ok: true, value: trimmed };
}
function validatePathSegment(value, name, maxLength = DEFAULT_MAX_LENGTH) {
  if (typeof value !== "string") {
    return { ok: false, reason: `${name} must be a string` };
  }
  if (value.length === 0 || value.trim() === "") {
    return { ok: false, reason: `${name} must be non-empty` };
  }
  if (value.includes("\0")) {
    return { ok: false, reason: `${name} must not contain null bytes` };
  }
  if (value.length > maxLength) {
    return { ok: false, reason: `${name} exceeds max length ${maxLength}` };
  }
  return { ok: true, value };
}

// ../../app/dist/RouterVirtualModulePlugin.js
var DEFAULT_PREFIX = "router:";
var DEFAULT_PLUGIN_NAME = "router-virtual-module";
var ENTRYPOINT_EXPORTS = ["handler", "template", "default"];
var COMPANION_SUFFIXES = [".guard.ts", ".dependencies.ts", ".layout.ts", ".catch.ts"];
var DIRECTORY_COMPANIONS = /* @__PURE__ */ new Set(["_guard.ts", "_dependencies.ts", "_layout.ts", "_catch.ts"]);
var stripScriptExtension = (path) => {
  const ext = (0, import_node_path2.extname)(path);
  return ext ? path.slice(0, -ext.length) : path;
};
var SCRIPT_EXTENSION_SET = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs"
]);
var ROUTE_FILE_GLOBS = [
  "**/*.ts",
  "**/*.tsx",
  "**/*.js",
  "**/*.jsx",
  "**/*.mts",
  "**/*.cts",
  "**/*.mjs",
  "**/*.cjs"
];
function parseRouterVirtualModuleId(id, prefix = DEFAULT_PREFIX) {
  const idResult = validateNonEmptyString(id, "id");
  if (!idResult.ok) {
    return { ok: false, reason: idResult.reason };
  }
  const prefixResult = validateNonEmptyString(prefix, "prefix");
  if (!prefixResult.ok) {
    return { ok: false, reason: prefixResult.reason };
  }
  if (!id.startsWith(prefix)) {
    return {
      ok: false,
      reason: `id must start with "${prefix}"`
    };
  }
  let relativeDirectory = id.slice(prefix.length);
  if (relativeDirectory.length > 0 && relativeDirectory !== "." && relativeDirectory !== ".." && !relativeDirectory.startsWith("./") && !relativeDirectory.startsWith("../") && !relativeDirectory.startsWith("/")) {
    relativeDirectory = `./${relativeDirectory}`;
  }
  const relativeResult = validatePathSegment(relativeDirectory, "relativeDirectory");
  if (!relativeResult.ok) {
    return { ok: false, reason: relativeResult.reason };
  }
  return {
    ok: true,
    relativeDirectory: relativeResult.value
  };
}
function resolveRouterTargetDirectory(id, importer, prefix = DEFAULT_PREFIX) {
  const parsed = parseRouterVirtualModuleId(id, prefix);
  if (!parsed.ok) {
    return parsed;
  }
  const importerResult = validatePathSegment(importer, "importer");
  if (!importerResult.ok) {
    return { ok: false, reason: importerResult.reason };
  }
  const importerDir = (0, import_node_path2.dirname)(toPosixPath(importerResult.value));
  const resolved = resolvePathUnderBase(importerDir, parsed.relativeDirectory);
  if (!resolved.ok) {
    return {
      ok: false,
      reason: "resolved target directory escapes importer base directory"
    };
  }
  if (!pathIsUnderBase(importerDir, resolved.path)) {
    return {
      ok: false,
      reason: "resolved target directory is outside importer base directory"
    };
  }
  return {
    ok: true,
    targetDirectory: toPosixPath(resolved.path)
  };
}
var isExistingDirectory = (absolutePath) => {
  try {
    return (0, import_node_fs2.statSync)(absolutePath).isDirectory();
  } catch {
    return false;
  }
};
var directoryHasScriptFiles = (dir) => {
  try {
    const items = (0, import_node_fs2.readdirSync)(dir, { withFileTypes: true });
    for (const e of items) {
      if (e.isFile() && SCRIPT_EXTENSION_SET.has((0, import_node_path2.extname)(e.name).toLowerCase()) && !e.name.toLowerCase().endsWith(".d.ts"))
        return true;
      if (e.isDirectory() && directoryHasScriptFiles((0, import_node_path2.join)(dir, e.name)))
        return true;
    }
    return false;
  } catch {
    return false;
  }
};
var isCompanionModulePath = (absolutePath) => {
  const fileName = (0, import_node_path2.basename)(toPosixPath(absolutePath));
  if (DIRECTORY_COMPANIONS.has(fileName)) {
    return true;
  }
  return COMPANION_SUFFIXES.some((suffix) => fileName.endsWith(suffix));
};
var listEntrypointExports = (snapshot) => snapshot.exports.filter((value) => ENTRYPOINT_EXPORTS.some((entrypointName) => entrypointName === value.name));
var isRouteExportCompatible = (routeExport) => typeNodeIsRouteCompatible(routeExport.type);
var classifyEntrypointKind = (entrypoint) => typeNodeToRuntimeKind(entrypoint.type);
var getEntryPointName = (entrypoint) => entrypoint.name;
var COMPANION_KIND_TO_SUFFIX = {
  guard: ".guard.ts",
  dependencies: ".dependencies.ts",
  layout: ".layout.ts",
  catch: ".catch.ts"
};
var COMPANION_KIND_TO_DIRECTORY_FILE = {
  guard: "_guard.ts",
  dependencies: "_dependencies.ts",
  layout: "_layout.ts",
  catch: "_catch.ts"
};
var resolveComposedConcernsForLeaf = (leafFilePath, existingPaths) => {
  const leafDir = (0, import_node_path2.dirname)(leafFilePath);
  const leafBaseName = (0, import_node_path2.basename)(stripScriptExtension(leafFilePath));
  const ancestorDirs = [""];
  if (leafDir !== "." && leafDir !== "") {
    const segments = leafDir.split("/").filter(Boolean);
    let acc = "";
    for (const seg of segments) {
      acc = acc ? `${acc}/${seg}` : seg;
      ancestorDirs.push(acc);
    }
  }
  const collectForKind = (kind) => {
    const result = [];
    for (const d of [...ancestorDirs].reverse()) {
      const dirPath = d === "." ? COMPANION_KIND_TO_DIRECTORY_FILE[kind] : (0, import_node_path2.join)(d, COMPANION_KIND_TO_DIRECTORY_FILE[kind]);
      const normal = toPosixPath(dirPath);
      if (existingPaths.has(normal))
        result.push(normal);
    }
    const siblingPath = leafDir === "." ? `${leafBaseName}${COMPANION_KIND_TO_SUFFIX[kind]}` : toPosixPath((0, import_node_path2.join)(leafDir, `${leafBaseName}${COMPANION_KIND_TO_SUFFIX[kind]}`));
    if (existingPaths.has(siblingPath))
      result.push(siblingPath);
    return result;
  };
  return {
    guard: collectForKind("guard"),
    dependencies: collectForKind("dependencies"),
    layout: collectForKind("layout"),
    catch: collectForKind("catch")
  };
};
var toImportSpecifier = (importerDir, targetDir, relativeFilePath) => {
  const absPath = (0, import_node_path2.join)(targetDir, relativeFilePath);
  const rel = toPosixPath((0, import_node_path2.relative)(importerDir, absPath));
  const specifier = rel.startsWith(".") ? rel : `./${rel}`;
  return stripScriptExtension(specifier) + ".js";
};
var segmentToIdentifierPart = (seg) => {
  let name = seg.trim().startsWith("_") ? seg.trim().slice(1) : seg.trim();
  name = name.replace(/[[\]]/g, "").replace(/[^a-zA-Z0-9]/g, "");
  if (!name)
    return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
};
var pathToIdentifier = (relativeFilePath) => {
  const posix = toPosixPath(relativeFilePath);
  const withoutExt = stripScriptExtension(posix);
  const raw = withoutExt.split("/").filter(Boolean).map(segmentToIdentifierPart).filter(Boolean).join("") || "Module";
  const safe = raw.replace(/[^a-zA-Z0-9_$]/g, "");
  if (!safe)
    return "Module";
  if (/^\d/.test(safe))
    return `M${safe}`;
  return safe;
};
var toSafeIdentifier = (s) => {
  const cleaned = s.replace(/[\s[\]]/g, "").replace(/[^a-zA-Z0-9_$]/g, "");
  if (!cleaned)
    return "Module";
  if (/^\d/.test(cleaned))
    return `M${cleaned}`;
  return cleaned;
};
var RESERVED_NAMES = /* @__PURE__ */ new Set(["Router", "Fx", "Effect", "Stream"]);
var routeModuleIdentifier = (relativeFilePath) => {
  const base = pathToIdentifier(relativeFilePath);
  return RESERVED_NAMES.has(base) ? `M${base}` : base;
};
var pathHasParamSegment = (relativePath) => /\[[^\]]*\]/.test(relativePath);
var makeUniqueVarNames = (entries) => {
  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  const nameToPaths = /* @__PURE__ */ new Map();
  for (const { path, proposedName } of sorted) {
    const base = toSafeIdentifier(proposedName);
    const list = nameToPaths.get(base) ?? [];
    list.push(path);
    nameToPaths.set(base, list);
  }
  const pathToUnique = /* @__PURE__ */ new Map();
  const used = /* @__PURE__ */ new Set();
  for (const [base, paths] of nameToPaths) {
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      let name;
      if (paths.length === 1) {
        name = base;
      } else if (i === 0) {
        name = base;
      } else {
        const suffix = pathHasParamSegment(path) ? "Param" : "Literal";
        let candidate = base + suffix;
        let n = 0;
        while (used.has(candidate)) {
          n += 1;
          candidate = base + String(n);
        }
        name = candidate;
      }
      used.add(name);
      pathToUnique.set(path, name);
    }
  }
  return pathToUnique;
};
var siblingCompanionPath = (leafFilePath, kind) => {
  const dir = (0, import_node_path2.dirname)(leafFilePath);
  const base = (0, import_node_path2.basename)(stripScriptExtension(leafFilePath));
  const file = kind === "dependencies" ? `${base}.dependencies.ts` : `${base}.${kind}.ts`;
  return dir ? toPosixPath((0, import_node_path2.join)(dir, file)) : file;
};
var buildRouteDescriptors = (snapshots, baseDir) => {
  const descriptors = [];
  const violations = [];
  const existingPaths = new Set(snapshots.map((s) => toPosixPath((0, import_node_path2.relative)(baseDir, s.filePath))));
  for (const snapshot of snapshots) {
    if (isCompanionModulePath(snapshot.filePath)) {
      continue;
    }
    const entrypoints = listEntrypointExports(snapshot);
    const routeExport = snapshot.exports.find((value) => value.name === "route");
    if (!routeExport) {
      if (entrypoints.length > 0) {
        violations.push({
          code: "RVM-ROUTE-001",
          message: `missing "route" export in ${snapshot.filePath}`
        });
      }
      continue;
    }
    if (!isRouteExportCompatible(routeExport)) {
      violations.push({
        code: "RVM-ROUTE-002",
        message: `route export is not structurally compatible with Route in ${snapshot.filePath}`
      });
      continue;
    }
    if (entrypoints.length === 0) {
      violations.push({
        code: "RVM-ENTRY-001",
        message: `expected one of handler|template|default in ${snapshot.filePath}`
      });
      continue;
    }
    if (entrypoints.length > 1) {
      violations.push({
        code: "RVM-ENTRY-002",
        message: `multiple entrypoint exports found in ${snapshot.filePath}`
      });
      continue;
    }
    const entrypoint = entrypoints[0];
    const relPath = toPosixPath((0, import_node_path2.relative)(baseDir, snapshot.filePath));
    const runtimeKind = classifyEntrypointKind(entrypoint);
    const entrypointIsFunction = entrypoint.type.kind === "function";
    const composedConcerns = resolveComposedConcernsForLeaf(relPath, existingPaths);
    const inFileConcerns = {};
    for (const name of ["layout", "dependencies", "catch", "guard"]) {
      if (snapshot.exports.some((e) => e.name === name))
        inFileConcerns[name] = true;
    }
    descriptors.push({
      filePath: relPath,
      entrypointExport: getEntryPointName(entrypoint),
      runtimeKind,
      entrypointIsFunction,
      composedConcerns,
      inFileConcerns,
      routeTypeText: routeExport.type.text
    });
  }
  const sortedDescriptors = [...descriptors].sort((left, right) => left.filePath.localeCompare(right.filePath));
  const seenRouteIdentity = /* @__PURE__ */ new Map();
  const ambiguousViolations = [];
  const dedupedDescriptors = [];
  for (const d of sortedDescriptors) {
    const typeKey = d.routeTypeText.replace(/\s+/g, " ").trim();
    const key = `${d.filePath}:${typeKey}`;
    const firstSeen = seenRouteIdentity.get(key);
    if (firstSeen !== void 0) {
      ambiguousViolations.push({
        code: "RVM-AMBIGUOUS-001",
        message: `ambiguous route: same type as ${firstSeen}, also in ${d.filePath}`
      });
      continue;
    }
    seenRouteIdentity.set(key, d.filePath);
    dedupedDescriptors.push(d);
  }
  const guardViolations = [];
  const guardExportByPath = {};
  const guardPaths = /* @__PURE__ */ new Set();
  for (const d of dedupedDescriptors) {
    for (const p of d.composedConcerns.guard) {
      guardPaths.add(p);
    }
  }
  for (const relPath of guardPaths) {
    const snapshot = snapshots.find((s) => toPosixPath((0, import_node_path2.relative)(baseDir, s.filePath)) === relPath);
    if (!snapshot)
      continue;
    const guardExport = snapshot.exports.find((e) => e.name === "default") ?? snapshot.exports.find((e) => e.name === "guard");
    if (!guardExport) {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard file must export "guard" or default: ${(0, import_node_path2.join)(baseDir, relPath)}`
      });
      continue;
    }
    if (guardExport.type.kind !== "function") {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard export must be a function (Effect<Option<*>, *, *>): ${(0, import_node_path2.join)(baseDir, relPath)}`
      });
      continue;
    }
    if (!typeNodeIsEffectOptionReturn(guardExport.type)) {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard return type must be Effect<Option<*>, *, *>: ${(0, import_node_path2.join)(baseDir, relPath)}`
      });
      continue;
    }
    guardExportByPath[relPath] = guardExport.name;
  }
  const infileCompanionViolations = [];
  for (const d of dedupedDescriptors) {
    for (const kind of ["layout", "dependencies", "catch", "guard"]) {
      if (!d.inFileConcerns[kind])
        continue;
      const siblingPath = siblingCompanionPath(d.filePath, kind);
      if (d.composedConcerns[kind].includes(siblingPath)) {
        infileCompanionViolations.push({
          code: "RVM-INFILE-COMPANION-001",
          message: `${d.filePath} exports "${kind}" in-file and has companion ${siblingPath}; in-file wins but this is ambiguous. Remove one.`
        });
      }
    }
  }
  const allViolations = [...violations, ...ambiguousViolations, ...guardViolations, ...infileCompanionViolations].sort((left, right) => left.message.localeCompare(right.message));
  return {
    descriptors: dedupedDescriptors,
    violations: allViolations,
    guardExportByPath
  };
};
var collectOrderedCompanionPaths = (descriptors, kind) => {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const d of descriptors) {
    const paths = d.composedConcerns[kind];
    for (const p of paths) {
      if (!seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    }
  }
  return out;
};
var handlerExprFor = (runtimeKind, isFn, varName, exportName) => {
  const ref = `${varName}.${exportName}`;
  switch (runtimeKind) {
    case "plain":
      return isFn ? `(params) => Fx.succeed(${ref}(params))` : `() => Fx.succeed(${ref})`;
    case "effect":
      return isFn ? `(params) => Fx.fromEffect(${ref}(params))` : `() => Fx.fromEffect(${ref})`;
    case "stream":
      return isFn ? `(params) => Fx.fromStream(${ref}(params))` : `() => Fx.fromStream(${ref})`;
    case "fx":
      return isFn ? ref : `() => ${ref}`;
  }
};
var isDirectoryCompanion = (p) => (0, import_node_path2.basename)(p).startsWith("_");
var matchOptsForRoute = (d, varName, varNameByPath, guardExportByPath) => {
  const exportName = d.entrypointExport;
  const isFn = d.entrypointIsFunction;
  const handlerExpr = handlerExprFor(d.runtimeKind, isFn, varName, exportName);
  const opts = [`handler: ${handlerExpr}`];
  const add = (kind, fromModule, exportKey) => {
    opts.push(`${kind}: ${fromModule}.${exportKey}`);
  };
  const sibling = (kind) => siblingCompanionPath(d.filePath, kind);
  const hasSibling = (kind) => d.composedConcerns[kind].includes(sibling(kind));
  const dirGuardPath = d.composedConcerns.guard.find(isDirectoryCompanion);
  if (d.inFileConcerns.dependencies)
    add("dependencies", varName, "dependencies");
  else if (hasSibling("dependencies"))
    opts.push(`dependencies: ${varNameByPath.get(sibling("dependencies"))}`);
  if (d.inFileConcerns.layout)
    add("layout", varName, "layout");
  else if (hasSibling("layout"))
    opts.push(`layout: ${varNameByPath.get(sibling("layout"))}`);
  if (d.inFileConcerns.guard)
    add("guard", varName, "guard");
  else if (hasSibling("guard")) {
    const g = varNameByPath.get(sibling("guard"));
    opts.push(`guard: ${g}.${guardExportByPath[sibling("guard")] ?? "guard"}`);
  } else if (dirGuardPath) {
    const g = varNameByPath.get(dirGuardPath);
    opts.push(`guard: ${g}.${guardExportByPath[dirGuardPath] ?? "guard"}`);
  }
  if (d.inFileConcerns.catch)
    add("catch", varName, "catch");
  else if (hasSibling("catch"))
    opts.push(`catch: ${varNameByPath.get(sibling("catch"))}`);
  return opts;
};
var directoryCompanionPaths = (descriptors) => {
  const map = /* @__PURE__ */ new Map();
  for (const d of descriptors) {
    for (const kind of ["layout", "dependencies", "catch"]) {
      for (const p of d.composedConcerns[kind]) {
        if (!isDirectoryCompanion(p))
          continue;
        const dir = (0, import_node_path2.dirname)(p);
        let entry = map.get(dir);
        if (!entry) {
          entry = {};
          map.set(dir, entry);
        }
        if (!entry[kind])
          entry[kind] = p;
      }
    }
  }
  return map;
};
var emitRouterMatchSource = (descriptors, targetDirectory, importer, guardExportByPath) => {
  const importerDir = (0, import_node_path2.dirname)(toPosixPath(importer));
  const depPaths = collectOrderedCompanionPaths(descriptors, "dependencies");
  const layoutPaths = collectOrderedCompanionPaths(descriptors, "layout");
  const guardPaths = collectOrderedCompanionPaths(descriptors, "guard");
  const catchPaths = collectOrderedCompanionPaths(descriptors, "catch");
  const nameEntries = [
    ...descriptors.map((d) => ({ path: d.filePath, proposedName: routeModuleIdentifier(d.filePath) })),
    ...depPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
    ...layoutPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
    ...guardPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
    ...catchPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) }))
  ];
  const varNameByPath = makeUniqueVarNames(nameEntries);
  const importLines = [
    `import * as Router from "@typed/router";`,
    `import * as Fx from "@typed/fx";`
  ];
  for (const d of descriptors) {
    const spec = toImportSpecifier(importerDir, targetDirectory, d.filePath);
    const varName = varNameByPath.get(d.filePath);
    importLines.push(`import * as ${varName} from ${JSON.stringify(spec)};`);
  }
  for (const p of depPaths) {
    importLines.push(`import ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`);
  }
  for (const p of layoutPaths) {
    importLines.push(`import ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`);
  }
  for (const p of guardPaths) {
    importLines.push(`import * as ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`);
  }
  for (const p of catchPaths) {
    importLines.push(`import ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`);
  }
  const dirToCompanions = directoryCompanionPaths(descriptors);
  const allDirs = new Set(descriptors.map((d) => (0, import_node_path2.dirname)(d.filePath)));
  for (const [dir] of dirToCompanions)
    allDirs.add(dir);
  if (allDirs.size > 0)
    allDirs.add("");
  const sortedDirs = [...allDirs].sort((a, b) => b.split("/").filter(Boolean).length - a.split("/").filter(Boolean).length);
  const leafMatchExprByPath = /* @__PURE__ */ new Map();
  for (const d of descriptors) {
    const varName = varNameByPath.get(d.filePath);
    const opts = matchOptsForRoute(d, varName, varNameByPath, guardExportByPath);
    leafMatchExprByPath.set(d.filePath, `Router.match(${varName}.route, { ${opts.join(", ")} })`);
  }
  const dirMatcherExpr = /* @__PURE__ */ new Map();
  for (const dir of sortedDirs) {
    const directRoutes = descriptors.filter((d) => (0, import_node_path2.dirname)(d.filePath) === dir);
    const isImmediateChild = (s) => s !== dir && (dir === "" ? s.indexOf("/") === -1 : s.startsWith(dir + "/") && s.slice((dir + "/").length).indexOf("/") === -1);
    const childDirs = sortedDirs.filter(isImmediateChild);
    const parts = [];
    for (const d of directRoutes)
      parts.push(leafMatchExprByPath.get(d.filePath));
    for (const s of childDirs)
      parts.push(dirMatcherExpr.get(s));
    let expr = parts.length === 0 ? "Router.merge()" : parts.length === 1 ? parts[0] : `Router.merge(
  ${parts.join(",\n  ")}
)`;
    const companions = dirToCompanions.get(dir);
    if (companions) {
      if (companions.layout)
        expr += `
  .layout(${varNameByPath.get(companions.layout)})`;
      if (companions.catch)
        expr += `
  .catchCause(${varNameByPath.get(companions.catch)})`;
      if (companions.dependencies)
        expr += `
  .provide(${varNameByPath.get(companions.dependencies)})`;
    }
    dirMatcherExpr.set(dir, expr);
  }
  const rootExpr = dirMatcherExpr.get("") ?? "Router.merge()";
  return `${importLines.join("\n")}

export default ${rootExpr};
`;
};
var createRouterVirtualModulePlugin = (options = {}) => {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const name = options.name ?? DEFAULT_PLUGIN_NAME;
  return {
    name,
    shouldResolve(id, importer) {
      const resolved = resolveRouterTargetDirectory(id, importer, prefix);
      if (!resolved.ok) {
        return false;
      }
      if (!isExistingDirectory(resolved.targetDirectory)) {
        return false;
      }
      return directoryHasScriptFiles(resolved.targetDirectory);
    },
    build(id, importer, api) {
      const resolved = resolveRouterTargetDirectory(id, importer, prefix);
      if (!resolved.ok) {
        const err = {
          errors: [{ code: "RVM-ID-001", message: resolved.reason, pluginName: name }]
        };
        return err;
      }
      if (!isExistingDirectory(resolved.targetDirectory)) {
        const err = {
          errors: [
            {
              code: "RVM-DISC-001",
              message: `target directory does not exist: ${resolveRelativePath((0, import_node_path2.dirname)(importer), resolved.targetDirectory)}`,
              pluginName: name
            }
          ]
        };
        return err;
      }
      const snapshots = api.directory(ROUTE_FILE_GLOBS, {
        baseDir: resolved.targetDirectory,
        recursive: true,
        watch: true
      });
      const { descriptors, violations, guardExportByPath } = buildRouteDescriptors(snapshots, resolved.targetDirectory);
      const toDiagnostic = (v) => ({
        code: v.code,
        message: v.message,
        pluginName: name
      });
      const ambiguous = violations.filter((v) => v.code === "RVM-AMBIGUOUS-001");
      if (ambiguous.length > 0) {
        return { errors: ambiguous.map(toDiagnostic) };
      }
      const guardViolations = violations.filter((v) => v.code === "RVM-GUARD-001");
      if (guardViolations.length > 0) {
        return { errors: guardViolations.map(toDiagnostic) };
      }
      if (descriptors.length === 0) {
        if (violations.length > 0) {
          return { errors: violations.map(toDiagnostic) };
        }
        return {
          errors: [
            {
              code: "RVM-LEAF-001",
              message: `no valid route leaves discovered in ${resolved.targetDirectory}`,
              pluginName: name
            }
          ]
        };
      }
      return emitRouterMatchSource(descriptors, resolved.targetDirectory, importer, guardExportByPath);
    }
  };
};

// scripts/router-plugin-entry.mjs
var router_plugin_entry_default = createRouterVirtualModulePlugin();
