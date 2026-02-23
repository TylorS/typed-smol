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
var import_node_path5 = require("node:path");

// ../../app/dist/internal/buildRouteDescriptors.js
var import_node_path2 = require("node:path");

// ../../app/dist/internal/path.js
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");
var toPosixPath = (path) => path.replaceAll("\\", "/");
var stripScriptExtension = (path) => {
  const ext = (0, import_node_path.extname)(path);
  return ext ? path.slice(0, -ext.length) : path;
};
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

// ../../app/dist/internal/routeTypeNode.js
function getReferenceTypeName(text) {
  const withoutTypeArgs = text.includes("<") ? text.split("<")[0].trim() : text.trim();
  const lastSegment = withoutTypeArgs.split(".").pop();
  return lastSegment ?? withoutTypeArgs;
}
function typeNodeIsRouteCompatible(node, assignableTo) {
  if (assignableTo?.Route === true)
    return true;
  const text = node.text;
  if (!text || typeof text !== "string")
    return false;
  const trimmed = text.trim();
  if (trimmed === "Route")
    return true;
  const withoutTypeArgs = trimmed.includes("<") ? trimmed.split("<")[0].trim() : trimmed;
  const firstSegment = withoutTypeArgs.split(".")[0];
  return firstSegment === "Route";
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
  return "plain";
}
function typeNodeToRuntimeKind(node, assignableTo) {
  if (assignableTo?.Fx === true)
    return "fx";
  if (assignableTo?.Effect === true)
    return "effect";
  if (assignableTo?.Stream === true)
    return "stream";
  const root = node.kind === "function" ? node.returnType : node;
  return runtimeKindFromNode(root);
}
function classifyDepsExport(node, assignableTo) {
  if (assignableTo?.Layer === true)
    return "layer";
  if (assignableTo?.ServiceMap === true)
    return "servicemap";
  const text = node.text;
  if (text && typeof text === "string") {
    const firstSegment = text.split(/[.<]/)[0]?.trim();
    if (firstSegment === "Layer")
      return "layer";
    if (firstSegment === "ServiceMap")
      return "servicemap";
  }
  if (node.kind === "reference") {
    const name = getReferenceTypeName(node.text);
    if (name === "Array" || name === "ReadonlyArray")
      return "array";
  }
  if (node.kind === "array")
    return "array";
  return "unknown";
}
function typeNodeIsRefSubject(node) {
  if (node.kind === "reference") {
    const name = getReferenceTypeName(node.text);
    return name === "RefSubject";
  }
  if (node.kind === "intersection")
    return node.elements.some(typeNodeIsRefSubject);
  return false;
}
function typeNodeExpectsRefSubjectParam(node) {
  if (node.kind !== "function")
    return false;
  const fn = node;
  const first = fn.parameters[0];
  if (!first)
    return false;
  return typeNodeIsRefSubject(first.type);
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
function typeNodeIsCauseRef(node) {
  if (node.kind === "reference") {
    const name = getReferenceTypeName(node.text);
    return name === "Cause";
  }
  if (node.kind === "intersection")
    return node.elements.some(typeNodeIsCauseRef);
  return false;
}
function classifyCatchForm(node, assignableTo) {
  if (node.kind !== "function") {
    const returnKind2 = typeNodeToRuntimeKind(node, assignableTo);
    return { form: "value", returnKind: returnKind2 };
  }
  const fn = node;
  const returnKind = typeNodeToRuntimeKind(node, assignableTo);
  const firstParam = fn.parameters[0];
  if (!firstParam)
    return { form: "fn-error", returnKind };
  if (typeNodeIsRefSubject(firstParam.type))
    return { form: "native", returnKind };
  if (typeNodeIsCauseRef(firstParam.type))
    return { form: "fn-cause", returnKind };
  return { form: "fn-error", returnKind };
}

// ../../app/dist/internal/buildRouteDescriptors.js
var ENTRYPOINT_EXPORTS = ["handler", "template", "default"];
var COMPANION_SUFFIXES = [".guard.ts", ".dependencies.ts", ".layout.ts", ".catch.ts"];
var DIRECTORY_COMPANIONS = /* @__PURE__ */ new Set(["_guard.ts", "_dependencies.ts", "_layout.ts", "_catch.ts"]);
var GUARD_EXPORT_NAMES = ["default", "guard"];
var CATCH_EXPORT_NAMES = ["catch", "catchFn"];
function isEntryPointExport(name) {
  return ENTRYPOINT_EXPORTS.includes(name);
}
function isGuardExportName(name) {
  return GUARD_EXPORT_NAMES.includes(name);
}
function isCatchExportName(name) {
  return CATCH_EXPORT_NAMES.includes(name);
}
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
function isCompanionModulePath(absolutePath) {
  const fileName = (0, import_node_path2.basename)(toPosixPath(absolutePath));
  if (DIRECTORY_COMPANIONS.has(fileName))
    return true;
  return COMPANION_SUFFIXES.some((suffix) => fileName.endsWith(suffix));
}
function listEntrypointExports(snapshot) {
  return snapshot.exports.filter((value) => ENTRYPOINT_EXPORTS.some((entrypointName) => entrypointName === value.name));
}
function isRouteExportCompatible(routeExport) {
  return typeNodeIsRouteCompatible(routeExport.type, routeExport.assignableTo);
}
function classifyEntrypointKind(entrypoint) {
  return typeNodeToRuntimeKind(entrypoint.type, entrypoint.assignableTo);
}
function getEntryPointName(entrypoint) {
  if (!isEntryPointExport(entrypoint.name)) {
    throw new Error(`RVM: invalid entrypoint export name ${JSON.stringify(entrypoint.name)}`);
  }
  return entrypoint.name;
}
function resolveComposedConcernsForLeaf(leafFilePath, existingPaths) {
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
}
function siblingCompanionPath(leafFilePath, kind) {
  const dir = (0, import_node_path2.dirname)(leafFilePath);
  const base = (0, import_node_path2.basename)(stripScriptExtension(leafFilePath));
  const file = kind === "dependencies" ? `${base}.dependencies.ts` : `${base}.${kind}.ts`;
  return dir ? toPosixPath((0, import_node_path2.join)(dir, file)) : file;
}
function buildRouteDescriptors(snapshots, baseDir) {
  const descriptors = [];
  const violations = [];
  const existingPaths = new Set(snapshots.map((s) => toPosixPath((0, import_node_path2.relative)(baseDir, s.filePath))));
  for (const snapshot of snapshots) {
    if (isCompanionModulePath(snapshot.filePath))
      continue;
    const entrypoints = listEntrypointExports(snapshot);
    const routeExport = snapshot.exports.find((value) => value.name === "route");
    if (!routeExport) {
      if (entrypoints.length > 0) {
        violations.push({
          code: "RVM-ROUTE-001",
          message: `missing "route" export in ${toPosixPath((0, import_node_path2.relative)(baseDir, snapshot.filePath))}`
        });
      }
      continue;
    }
    if (!isRouteExportCompatible(routeExport)) {
      violations.push({
        code: "RVM-ROUTE-002",
        message: `route export is not structurally compatible with Route in ${toPosixPath((0, import_node_path2.relative)(baseDir, snapshot.filePath))}`
      });
      continue;
    }
    if (entrypoints.length === 0) {
      violations.push({
        code: "RVM-ENTRY-001",
        message: `expected one of handler|template|default in ${toPosixPath((0, import_node_path2.relative)(baseDir, snapshot.filePath))}`
      });
      continue;
    }
    if (entrypoints.length > 1) {
      violations.push({
        code: "RVM-ENTRY-002",
        message: `multiple entrypoint exports found in ${toPosixPath((0, import_node_path2.relative)(baseDir, snapshot.filePath))}`
      });
      continue;
    }
    const entrypoint = entrypoints[0];
    const relPath = toPosixPath((0, import_node_path2.relative)(baseDir, snapshot.filePath));
    const runtimeKind = classifyEntrypointKind(entrypoint);
    const entrypointIsFunction = entrypoint.type.kind === "function";
    const entrypointExpectsRefSubject = entrypointIsFunction && typeNodeExpectsRefSubjectParam(entrypoint.type);
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
      entrypointExpectsRefSubject,
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
    for (const p of d.composedConcerns.guard)
      guardPaths.add(p);
  }
  for (const relPath of guardPaths) {
    const snapshot = snapshots.find((s) => toPosixPath((0, import_node_path2.relative)(baseDir, s.filePath)) === relPath);
    if (!snapshot)
      continue;
    const guardExport = snapshot.exports.find((e) => e.name === GUARD_EXPORT_NAMES[0]) ?? snapshot.exports.find((e) => e.name === GUARD_EXPORT_NAMES[1]);
    if (!guardExport) {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard file must export "guard" or default: ${relPath}`
      });
      continue;
    }
    if (guardExport.type.kind !== "function") {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard export must be a function (Effect<Option<*>, *, *>): ${relPath}`
      });
      continue;
    }
    if (!typeNodeIsEffectOptionReturn(guardExport.type)) {
      guardViolations.push({
        code: "RVM-GUARD-001",
        message: `guard return type must be Effect<Option<*>, *, *>: ${relPath}`
      });
      continue;
    }
    if (!isGuardExportName(guardExport.name)) {
      throw new Error(`RVM: guard export name ${JSON.stringify(guardExport.name)} not in GUARD_EXPORT_NAMES`);
    }
    guardExportByPath[relPath] = guardExport.name;
  }
  const catchExportByPath = {};
  const catchFormByPath = {};
  const depsFormByPath = {};
  const catchPaths = /* @__PURE__ */ new Set();
  const catchViolations = [];
  for (const d of dedupedDescriptors) {
    for (const p of d.composedConcerns.catch)
      catchPaths.add(p);
  }
  for (const relPath of catchPaths) {
    const snapshot = snapshots.find((s) => toPosixPath((0, import_node_path2.relative)(baseDir, s.filePath)) === relPath);
    if (!snapshot)
      continue;
    const catchExport = snapshot.exports.find((e) => e.name === CATCH_EXPORT_NAMES[0]) ?? snapshot.exports.find((e) => e.name === CATCH_EXPORT_NAMES[1]);
    if (!catchExport) {
      catchViolations.push({
        code: "RVM-CATCH-001",
        message: `catch file must export "catch" or "catchFn": ${relPath}`
      });
      continue;
    }
    if (!isCatchExportName(catchExport.name)) {
      throw new Error(`RVM: catch export name ${JSON.stringify(catchExport.name)} not in CATCH_EXPORT_NAMES`);
    }
    catchExportByPath[relPath] = catchExport.name;
    catchFormByPath[relPath] = classifyCatchForm(catchExport.type, catchExport.assignableTo);
  }
  for (const d of dedupedDescriptors) {
    if (!d.inFileConcerns.catch)
      continue;
    const snapshot = snapshots.find((s) => toPosixPath((0, import_node_path2.relative)(baseDir, s.filePath)) === d.filePath);
    if (!snapshot)
      continue;
    const catchExport = snapshot.exports.find((e) => e.name === CATCH_EXPORT_NAMES[0]) ?? snapshot.exports.find((e) => e.name === CATCH_EXPORT_NAMES[1]);
    if (catchExport) {
      if (!isCatchExportName(catchExport.name)) {
        throw new Error(`RVM: catch export name ${JSON.stringify(catchExport.name)} not in CATCH_EXPORT_NAMES`);
      }
      catchExportByPath[d.filePath] = catchExport.name;
      catchFormByPath[d.filePath] = classifyCatchForm(catchExport.type, catchExport.assignableTo);
    }
  }
  const depsPaths = /* @__PURE__ */ new Set();
  for (const d of dedupedDescriptors) {
    for (const p of d.composedConcerns.dependencies) {
      if ((0, import_node_path2.basename)(p).startsWith("_"))
        depsPaths.add(p);
    }
  }
  const depsViolations = [];
  for (const relPath of depsPaths) {
    const snapshot = snapshots.find((s) => toPosixPath((0, import_node_path2.relative)(baseDir, s.filePath)) === relPath);
    if (!snapshot)
      continue;
    const defaultExport = snapshot.exports.find((e) => e.name === "default");
    if (!defaultExport) {
      depsViolations.push({
        code: "RVM-DEPS-001",
        message: `${relPath} is used as directory dependencies but has no default export. Export a default of type Layer, ServiceMap, or Array.`
      });
      continue;
    }
    const kind = classifyDepsExport(defaultExport.type, defaultExport.assignableTo);
    if (kind === "unknown") {
      depsViolations.push({
        code: "RVM-DEPS-001",
        message: `${relPath} default export type could not be determined. Must be Layer, ServiceMap, or Array.`
      });
      continue;
    }
    depsFormByPath[relPath] = kind;
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
  const allViolations = [
    ...violations,
    ...ambiguousViolations,
    ...guardViolations,
    ...catchViolations,
    ...depsViolations,
    ...infileCompanionViolations
  ].sort((left, right) => left.message.localeCompare(right.message));
  return {
    descriptors: dedupedDescriptors,
    violations: allViolations,
    guardExportByPath,
    catchExportByPath,
    catchFormByPath,
    depsFormByPath
  };
}

// ../../app/dist/internal/emitRouterSource.js
var import_node_path3 = require("node:path");

// ../../app/dist/internal/routerDescriptorTree.js
function buildRouterDescriptorTree(input) {
  const { descriptors, dirToCompanions, catchExportByPath, catchFormByPath, normalizeDir: normalizeDir2, isDirectoryCompanion: isDirectoryCompanion2, siblingCompanionPath: siblingCompanionPath2 } = input;
  const toMatchDescriptor = (d) => {
    const sibling = (k) => siblingCompanionPath2(d.filePath, k);
    const hasSibling = (k) => d.composedConcerns[k].includes(sibling(k));
    const dirGuardPath = d.composedConcerns.guard.find(isDirectoryCompanion2);
    const guardPath = d.inFileConcerns.guard ? d.filePath : hasSibling("guard") ? sibling("guard") : dirGuardPath;
    const catchPath = d.inFileConcerns.catch ? d.filePath : hasSibling("catch") ? sibling("catch") : void 0;
    return {
      routePath: d.filePath,
      entrypointExport: d.entrypointExport,
      runtimeKind: d.runtimeKind,
      entrypointIsFunction: d.entrypointIsFunction,
      entrypointExpectsRefSubject: d.entrypointExpectsRefSubject,
      inFileConcerns: d.inFileConcerns,
      composedConcerns: d.composedConcerns,
      guardPath,
      catchPath,
      catchExport: catchPath ? (() => {
        const exp = catchExportByPath[catchPath];
        if (!exp)
          throw new Error(`RVM: catch export missing for ${catchPath}`);
        return exp;
      })() : void 0,
      catchForm: catchPath ? (() => {
        const form = catchFormByPath[catchPath];
        if (!form)
          throw new Error(`RVM: catch form missing for ${catchPath}`);
        return form;
      })() : void 0,
      layoutPath: d.inFileConcerns.layout ? d.filePath : hasSibling("layout") ? sibling("layout") : void 0,
      depsPath: d.inFileConcerns.dependencies ? d.filePath : hasSibling("dependencies") ? sibling("dependencies") : void 0
    };
  };
  const allDirs = new Set(descriptors.map((d) => normalizeDir2(dirname2(d.filePath))));
  for (const [dir] of dirToCompanions)
    allDirs.add(dir);
  if (allDirs.size > 0)
    allDirs.add("");
  const sortedDirs = [...allDirs].sort((a, b) => b.split("/").filter(Boolean).length - a.split("/").filter(Boolean).length);
  const dirNodeByPath = /* @__PURE__ */ new Map();
  for (const dir of sortedDirs) {
    const directRoutes = descriptors.filter((d) => normalizeDir2(dirname2(d.filePath)) === dir);
    const isImmediateChild = (s) => s !== dir && (dir === "" ? s.indexOf("/") === -1 : s.startsWith(dir + "/") && s.slice((dir + "/").length).indexOf("/") === -1);
    const childDirs = sortedDirs.filter(isImmediateChild);
    const routeChildren = directRoutes.map((d) => ({
      type: "route",
      match: toMatchDescriptor(d)
    }));
    const dirChildren = childDirs.map((s) => dirNodeByPath.get(s));
    const children = [...routeChildren, ...dirChildren];
    const companions = dirToCompanions.get(dir);
    const hasCompanions = companions && (companions.layout || companions.catch || dir !== "" && companions.dependencies);
    const node = children.length === 0 ? {
      type: "directory",
      dirPath: dir,
      children: [],
      companions: hasCompanions ? {
        layout: companions.layout,
        catch: companions.catch,
        dependencies: dir !== "" ? companions.dependencies : void 0
      } : void 0
    } : children.length === 1 && !hasCompanions ? children[0] : {
      type: "directory",
      dirPath: dir,
      children,
      companions: hasCompanions ? {
        layout: companions.layout,
        catch: companions.catch,
        dependencies: dir !== "" ? companions.dependencies : void 0
      } : void 0
    };
    dirNodeByPath.set(dir, node);
  }
  let root = dirNodeByPath.get("");
  if (!root || root.type === "directory" && root.children.length === 0) {
    const flatChildren = descriptors.map((d) => ({
      type: "route",
      match: toMatchDescriptor(d)
    }));
    root = flatChildren.length === 0 ? { type: "directory", dirPath: "", children: [] } : flatChildren.length === 1 ? flatChildren[0] : { type: "directory", dirPath: "", children: flatChildren };
  }
  const rootCompanions = dirToCompanions.get("");
  return {
    root,
    rootCompanions: rootCompanions?.dependencies ? { dependencies: rootCompanions.dependencies } : void 0
  };
}
function dirname2(p) {
  const i = p.lastIndexOf("/");
  return i < 0 ? "" : p.slice(0, i);
}
function renderRouterDescriptorTree(tree, ctx) {
  const emit = (node) => {
    if (node.type === "route") {
      return emitRoute(node.match, ctx);
    }
    const { children, companions } = node;
    let inner;
    if (children.length === 0) {
      throw new Error("RVM: directory node with no children should not be rendered");
    }
    if (children.length === 1) {
      inner = emit(children[0]);
    } else {
      inner = `Router.merge(
  ${children.map((c) => emit(c)).join(",\n  ")}
)`;
    }
    if (companions?.layout) {
      const v = ctx.varNameByPath.get(companions.layout);
      inner = `${inner}.layout(${v}.layout)`;
    }
    if (companions?.catch) {
      const v = ctx.varNameByPath.get(companions.catch);
      const exp = ctx.catchExportByPath[companions.catch];
      if (!exp)
        throw new Error(`RVM: catch export missing for ${companions.catch}`);
      const form = ctx.catchFormByPath[companions.catch];
      if (!form)
        throw new Error(`RVM: catch form missing for ${companions.catch}`);
      const catchExpr = ctx.catchExprFor(form, v, exp);
      inner = `${inner}.catchCause(${catchExpr})`;
    }
    if (companions?.dependencies) {
      const v = ctx.varNameByPath.get(companions.dependencies);
      const depsKind = ctx.depsFormByPath[companions.dependencies];
      if (depsKind === void 0)
        throw new Error(`RVM: dependency form unknown for ${companions.dependencies}; validation should have failed (RVM-DEPS-001)`);
      const depsExpr = ctx.depsExprFor(depsKind, v);
      inner = `${inner}.provide(${depsExpr})`;
    }
    return inner;
  };
  let result = emit(tree.root);
  if (tree.rootCompanions?.dependencies) {
    const v = ctx.varNameByPath.get(tree.rootCompanions.dependencies);
    const depsKind = ctx.depsFormByPath[tree.rootCompanions.dependencies];
    if (depsKind === void 0)
      throw new Error(`RVM: dependency form unknown for ${tree.rootCompanions.dependencies}; validation should have failed (RVM-DEPS-001)`);
    const depsExpr = ctx.depsExprFor(depsKind, v);
    result = `${result}.provide(${depsExpr})`;
  }
  return result;
}
function emitRoute(match, ctx) {
  const routeVar = ctx.varNameByPath.get(match.routePath);
  const routeRef = `${routeVar}.route`;
  const handlerExpr = ctx.handlerExprFor(match, routeVar);
  const hasExtraOpts = match.layoutPath || match.depsPath || match.catchPath;
  const guardPath = match.guardPath;
  const guardExport = guardPath ? ctx.guardExportByPath[guardPath] : void 0;
  const guardExpr = guardPath && guardExport ? `${ctx.varNameByPath.get(guardPath)}.${guardExport}` : void 0;
  const opts = [`handler: ${handlerExpr}`];
  if (match.depsPath) {
    opts.push(`dependencies: ${ctx.varNameByPath.get(match.depsPath)}.dependencies`);
  }
  if (match.layoutPath) {
    opts.push(`layout: ${ctx.varNameByPath.get(match.layoutPath)}.layout`);
  }
  if (match.catchPath && match.catchExport) {
    const catchVar = ctx.varNameByPath.get(match.catchPath);
    const form = match.catchForm;
    if (!form)
      throw new Error(`RVM: catch form missing for ${match.catchPath}`);
    opts.push(`catch: ${ctx.catchExprFor(form, catchVar, match.catchExport)}`);
  }
  if (guardExpr && !hasExtraOpts) {
    return `Router.match(${routeRef}, ${guardExpr}, ${handlerExpr})`;
  }
  if (guardExpr && hasExtraOpts) {
    opts.unshift(`guard: ${guardExpr}`);
    return `Router.match(${routeRef}, ${guardExpr}, { ${opts.join(", ")} })`;
  }
  if (!hasExtraOpts) {
    return `Router.match(${routeRef}, ${handlerExpr})`;
  }
  return `Router.match(${routeRef}, { ${opts.join(", ")} })`;
}

// ../../app/dist/internal/emitRouterHelpers.js
function handlerExprFor(runtimeKind, isFn, expectsRefSubject, varName, exportName) {
  const ref = `${varName}.${exportName}`;
  if (isFn && expectsRefSubject) {
    return `(params) => ${ref}(params)`;
  }
  switch (runtimeKind) {
    case "plain":
      return isFn ? `(params) => Fx.map(params, ${ref})` : `constant(Fx.succeed(${ref}))`;
    case "effect":
      return isFn ? `(params) => Fx.mapEffect(params, ${ref})` : `constant(Fx.fromEffect(${ref}))`;
    case "stream":
      return isFn ? `(params) => Fx.switchMap(params, (p) => Fx.fromStream(${ref}(p)))` : `constant(Fx.fromStream(${ref}))`;
    case "fx":
      return isFn ? ref : `constant(${ref})`;
  }
}
function liftToFx(expr, kind) {
  switch (kind) {
    case "plain":
      return `Fx.succeed(${expr})`;
    case "effect":
      return `Fx.fromEffect(${expr})`;
    case "stream":
      return `Fx.fromStream(${expr})`;
    case "fx":
      return expr;
  }
}
function catchExprFor(catchForm, varName, exportName) {
  const ref = `${varName}.${exportName}`;
  const { form, returnKind } = catchForm;
  if (form === "native") {
    return ref;
  }
  if (form === "value") {
    const lifted = liftToFx(ref, returnKind);
    return `(_causeRef) => ${lifted}`;
  }
  if (form === "fn-cause") {
    const lifted = liftToFx(`${ref}(cause)`, returnKind);
    return `(causeRef) => Fx.flatMap(causeRef, (cause) => ${lifted})`;
  }
  return `(causeRef) => Fx.flatMap(causeRef, (cause) => Result.match(Cause.findFail(cause), { onFailure: (c) => Fx.fromEffect(Effect.failCause(c)), onSuccess: ({ error: e }) => ${liftToFx(`${ref}(e)`, returnKind)} }))`;
}
function depsExprFor(kind, varName) {
  const ref = `${varName}.default`;
  switch (kind) {
    case "layer":
      return ref;
    case "servicemap":
      return `Layer.succeedServices(${ref})`;
    case "array":
      return `Router.normalizeDependencyInput(${ref})`;
  }
}

// ../../app/dist/internal/routeIdentifiers.js
function segmentToIdentifierPart(seg) {
  let name = seg.trim().startsWith("_") ? seg.trim().slice(1) : seg.trim();
  name = name.replace(/[[\]]/g, "").replace(/[^a-zA-Z0-9]/g, "");
  if (!name)
    return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}
function pathToIdentifier(relativeFilePath) {
  const posix = toPosixPath(relativeFilePath);
  const withoutExt = stripScriptExtension(posix);
  const raw = withoutExt.split("/").filter(Boolean).map(segmentToIdentifierPart).filter(Boolean).join("") || "Module";
  const safe = raw.replace(/[^a-zA-Z0-9_$]/g, "");
  if (!safe)
    return "Module";
  if (/^\d/.test(safe))
    return `M${safe}`;
  return safe;
}
function toSafeIdentifier(s) {
  const cleaned = s.replace(/[\s[\]]/g, "").replace(/[^a-zA-Z0-9_$]/g, "");
  if (!cleaned)
    return "Module";
  if (/^\d/.test(cleaned))
    return `M${cleaned}`;
  return cleaned;
}
var RESERVED_NAMES = /* @__PURE__ */ new Set(["Router", "Fx", "Effect", "Stream"]);
function routeModuleIdentifier(relativeFilePath) {
  const base = pathToIdentifier(relativeFilePath);
  return RESERVED_NAMES.has(base) ? `M${base}` : base;
}
function pathHasParamSegment(relativePath) {
  return /\[[^\]]*\]/.test(relativePath);
}
function makeUniqueVarNames(entries) {
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
}

// ../../app/dist/internal/emitRouterSource.js
function toImportSpecifier(importerDir, targetDir, relativeFilePath) {
  const absPath = (0, import_node_path3.join)(targetDir, relativeFilePath);
  const rel = toPosixPath((0, import_node_path3.relative)(importerDir, absPath));
  const specifier = rel.startsWith(".") ? rel : `./${rel}`;
  return stripScriptExtension(specifier) + ".js";
}
function normalizeDir(dir) {
  return dir === "." ? "" : dir;
}
function isDirectoryCompanion(p) {
  return (0, import_node_path3.basename)(p).startsWith("_");
}
function directoryCompanionPaths(descriptors) {
  const map = /* @__PURE__ */ new Map();
  for (const d of descriptors) {
    for (const kind of ["layout", "dependencies", "catch"]) {
      for (const p of d.composedConcerns[kind]) {
        if (!isDirectoryCompanion(p))
          continue;
        const dir = normalizeDir((0, import_node_path3.dirname)(p));
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
}
function collectOrderedCompanionPaths(descriptors, kind) {
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
}
function emitRouterMatchSource(descriptors, targetDirectory, importer, guardExportByPath, catchExportByPath, catchFormByPath, depsFormByPath) {
  const importerDir = (0, import_node_path3.dirname)(toPosixPath(importer));
  const needsFnErrorImports = Object.values(catchFormByPath).some((f) => f.form === "fn-error");
  const needsLayerImport = Object.values(depsFormByPath).includes("servicemap");
  const depPaths = collectOrderedCompanionPaths(descriptors, "dependencies");
  const layoutPaths = collectOrderedCompanionPaths(descriptors, "layout");
  const guardPaths = collectOrderedCompanionPaths(descriptors, "guard");
  const catchPaths = collectOrderedCompanionPaths(descriptors, "catch");
  const nameEntries = [
    ...descriptors.map((d) => ({
      path: d.filePath,
      proposedName: routeModuleIdentifier(d.filePath)
    })),
    ...depPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
    ...layoutPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
    ...guardPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) })),
    ...catchPaths.map((p) => ({ path: p, proposedName: pathToIdentifier(p) }))
  ];
  const varNameByPath = makeUniqueVarNames(nameEntries);
  const importLines = [
    `import * as Router from "@typed/router";`,
    `import * as Fx from "@typed/fx/Fx";`,
    `import { constant } from "effect/Function";`,
    ...needsFnErrorImports ? [
      `import * as Effect from "effect";`,
      `import * as Cause from "effect/Cause";`,
      `import * as Result from "effect/Result";`
    ] : [],
    ...needsLayerImport ? [`import * as Layer from "effect/Layer";`] : []
  ];
  for (const d of descriptors) {
    const spec = toImportSpecifier(importerDir, targetDirectory, d.filePath);
    const varName = varNameByPath.get(d.filePath);
    importLines.push(`import * as ${varName} from ${JSON.stringify(spec)};`);
  }
  for (const p of depPaths) {
    importLines.push(`import * as ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`);
  }
  for (const p of layoutPaths) {
    importLines.push(`import * as ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`);
  }
  for (const p of guardPaths) {
    importLines.push(`import * as ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`);
  }
  for (const p of catchPaths) {
    importLines.push(`import * as ${varNameByPath.get(p)} from ${JSON.stringify(toImportSpecifier(importerDir, targetDirectory, p))};`);
  }
  const dirToCompanions = directoryCompanionPaths(descriptors);
  const descriptorTree = buildRouterDescriptorTree({
    descriptors,
    dirToCompanions,
    guardExportByPath,
    catchExportByPath,
    catchFormByPath,
    normalizeDir,
    isDirectoryCompanion,
    siblingCompanionPath
  });
  const handlerExprForMatch = (match, varName) => handlerExprFor(match.runtimeKind, match.entrypointIsFunction, match.entrypointExpectsRefSubject, varName, match.entrypointExport);
  const rootSource = renderRouterDescriptorTree(descriptorTree, {
    varNameByPath,
    guardExportByPath,
    catchExportByPath,
    catchFormByPath,
    depsFormByPath,
    handlerExprFor: handlerExprForMatch,
    catchExprFor,
    depsExprFor
  });
  return `${importLines.join("\n")}

const router = ${rootSource};
export default router;
`;
}

// ../../app/dist/internal/typeCheckRouterVirtualModule.js
var import_node_path4 = require("node:path");
var VIRTUAL_FILE_BASENAME = "__router_virtual_module.ts";
var DIAGNOSTIC_CODE_PREFIX = "RVM-TC";
function toVirtualModuleDiagnostic(pluginName, diagnostic, tsMod) {
  const message = tsMod.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  const code = typeof diagnostic.code === "number" ? `${DIAGNOSTIC_CODE_PREFIX}-${String(diagnostic.code).padStart(3, "0")}` : DIAGNOSTIC_CODE_PREFIX;
  return { code, message, pluginName };
}
function typeCheckRouterVirtualModule(params) {
  const { ts: tsMod, id, importer, emittedSource, pluginName } = params;
  const importerDir = (0, import_node_path4.dirname)(toPosixPath(importer));
  const virtualFilePath = toPosixPath((0, import_node_path4.join)(importerDir, VIRTUAL_FILE_BASENAME));
  const compilerOptions = {
    strict: true,
    target: tsMod.ScriptTarget.ESNext,
    module: tsMod.ModuleKind.ESNext,
    moduleResolution: tsMod.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
    ...params.compilerOptions
  };
  const defaultHost = tsMod.createCompilerHost(compilerOptions);
  const customHost = {
    ...defaultHost,
    getSourceFile: (fileName, languageVersion) => {
      if (toPosixPath(fileName) === virtualFilePath) {
        return tsMod.createSourceFile(fileName, emittedSource, languageVersion, true, tsMod.ScriptKind.TS);
      }
      return defaultHost.getSourceFile(fileName, languageVersion);
    },
    resolveModuleNames: (moduleNames, containingFile, _reusedNames, _redirectedReference, options) => {
      return moduleNames.map((moduleName) => {
        if (moduleName === id && toPosixPath(containingFile) === toPosixPath(importer)) {
          return {
            resolvedFileName: virtualFilePath,
            extension: tsMod.Extension.Ts,
            isExternalLibraryImport: false
          };
        }
        const resolved = tsMod.resolveModuleName(moduleName, containingFile, options, customHost);
        return resolved.resolvedModule;
      });
    }
  };
  const program = tsMod.createProgram([importer], compilerOptions, customHost);
  const allDiagnostics = tsMod.getPreEmitDiagnostics(program);
  const virtualFileDiagnostics = allDiagnostics.filter((d) => d.file && toPosixPath(d.file.fileName) === virtualFilePath);
  if (virtualFileDiagnostics.length === 0) {
    return { kind: "ok" };
  }
  const errors = virtualFileDiagnostics.filter((d) => d.category === tsMod.DiagnosticCategory.Error);
  const warnings = virtualFileDiagnostics.filter((d) => d.category === tsMod.DiagnosticCategory.Warning);
  if (errors.length > 0) {
    return {
      kind: "errors",
      errors: errors.map((d) => toVirtualModuleDiagnostic(pluginName, d, tsMod))
    };
  }
  if (warnings.length > 0) {
    return {
      kind: "warnings",
      warnings: warnings.map((d) => toVirtualModuleDiagnostic(pluginName, d, tsMod))
    };
  }
  return { kind: "ok" };
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
  if (!idResult.ok)
    return { ok: false, reason: idResult.reason };
  const prefixResult = validateNonEmptyString(prefix, "prefix");
  if (!prefixResult.ok)
    return { ok: false, reason: prefixResult.reason };
  if (!id.startsWith(prefix)) {
    return { ok: false, reason: `id must start with "${prefix}"` };
  }
  let relativeDirectory = id.slice(prefix.length);
  if (relativeDirectory.length > 0 && relativeDirectory !== "." && relativeDirectory !== ".." && !relativeDirectory.startsWith("./") && !relativeDirectory.startsWith("../") && !relativeDirectory.startsWith("/")) {
    relativeDirectory = `./${relativeDirectory}`;
  }
  const relativeResult = validatePathSegment(relativeDirectory, "relativeDirectory");
  if (!relativeResult.ok)
    return { ok: false, reason: relativeResult.reason };
  return { ok: true, relativeDirectory: relativeResult.value };
}
function resolveRouterTargetDirectory(id, importer, prefix = DEFAULT_PREFIX) {
  const parsed = parseRouterVirtualModuleId(id, prefix);
  if (!parsed.ok)
    return parsed;
  const importerResult = validatePathSegment(importer, "importer");
  if (!importerResult.ok)
    return { ok: false, reason: importerResult.reason };
  const importerDir = (0, import_node_path5.dirname)(toPosixPath(importerResult.value));
  const resolved = resolvePathUnderBase(importerDir, parsed.relativeDirectory);
  if (!resolved.ok) {
    return { ok: false, reason: "resolved target directory escapes importer base directory" };
  }
  if (!pathIsUnderBase(importerDir, resolved.path)) {
    return { ok: false, reason: "resolved target directory is outside importer base directory" };
  }
  return { ok: true, targetDirectory: toPosixPath(resolved.path) };
}
function isExistingDirectory(absolutePath) {
  try {
    return (0, import_node_fs2.statSync)(absolutePath).isDirectory();
  } catch {
    return false;
  }
}
function directoryHasScriptFiles(dir) {
  try {
    const items = (0, import_node_fs2.readdirSync)(dir, { withFileTypes: true });
    for (const e of items) {
      if (e.isFile() && SCRIPT_EXTENSION_SET.has((0, import_node_path5.extname)(e.name).toLowerCase()) && !e.name.toLowerCase().endsWith(".d.ts"))
        return true;
      if (e.isDirectory() && directoryHasScriptFiles((0, import_node_path5.join)(dir, e.name)))
        return true;
    }
    return false;
  } catch {
    return false;
  }
}
var FAIL_ORDER = [
  "RVM-AMBIGUOUS-001",
  "RVM-GUARD-001",
  "RVM-CATCH-001",
  "RVM-DEPS-001"
];
function failOnViolations(violations, toDiagnostic) {
  for (const code of FAIL_ORDER) {
    const found = violations.filter((v) => v.code === code);
    if (found.length > 0)
      return { errors: found.map(toDiagnostic) };
  }
  return null;
}
var createRouterVirtualModulePlugin = (options = {}) => {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const name = options.name ?? DEFAULT_PLUGIN_NAME;
  return {
    name,
    shouldResolve(id, importer) {
      const resolved = resolveRouterTargetDirectory(id, importer, prefix);
      if (!resolved.ok)
        return false;
      if (!isExistingDirectory(resolved.targetDirectory))
        return false;
      return directoryHasScriptFiles(resolved.targetDirectory);
    },
    build(id, importer, api) {
      const resolved = resolveRouterTargetDirectory(id, importer, prefix);
      if (!resolved.ok) {
        return {
          errors: [{ code: "RVM-ID-001", message: resolved.reason, pluginName: name }]
        };
      }
      if (!isExistingDirectory(resolved.targetDirectory)) {
        return {
          errors: [
            {
              code: "RVM-DISC-001",
              message: `target directory does not exist: ${resolveRelativePath((0, import_node_path5.dirname)(importer), resolved.targetDirectory)}`,
              pluginName: name
            }
          ]
        };
      }
      const snapshots = api.directory(ROUTE_FILE_GLOBS, {
        baseDir: resolved.targetDirectory,
        recursive: true,
        watch: true
      });
      const { descriptors, violations, guardExportByPath, catchExportByPath, catchFormByPath, depsFormByPath } = buildRouteDescriptors(snapshots, resolved.targetDirectory);
      const toDiagnostic = (v) => ({
        code: v.code,
        message: v.message,
        pluginName: name
      });
      const err = failOnViolations(violations, toDiagnostic);
      if (err)
        return err;
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
      const emittedSource = emitRouterMatchSource(descriptors, resolved.targetDirectory, importer, guardExportByPath, catchExportByPath, catchFormByPath, depsFormByPath);
      if (options.typeCheck && options.ts) {
        const tcResult = typeCheckRouterVirtualModule({
          ts: options.ts,
          id,
          importer,
          emittedSource,
          compilerOptions: options.compilerOptions,
          pluginName: name
        });
        if (tcResult.kind === "errors") {
          return { errors: tcResult.errors };
        }
        if (tcResult.kind === "warnings") {
          return { sourceText: emittedSource, warnings: tcResult.warnings };
        }
      }
      return emittedSource;
    }
  };
};

// scripts/router-plugin-entry.mjs
var router_plugin_entry_default = createRouterVirtualModulePlugin();
