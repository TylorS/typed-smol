/**
 * Declarative descriptor tree for router virtual module emission.
 * Describes ALL route structure and metadata; rendering is a separate phase.
 *
 * Optimizations in renderer:
 * - Router.merge only when 2+ siblings
 * - No Router.merge() for single child
 * - Parens only when chaining on multi-arg call expressions
 * - Positional match when no extra opts
 */

import type { CatchForm, DepsExportKind, RuntimeKind } from "./routeTypeNode.js";

/** Resolved companion paths per concern (guard, deps, layout, catch). */
export type ComposedConcernsShape = {
  readonly guard: readonly string[];
  readonly dependencies: readonly string[];
  readonly layout: readonly string[];
  readonly catch: readonly string[];
};

/** Path-based refs (relative to baseDir); var names resolved at render time. */
export type PathRef = string;

/** Per-route match configuration (declarative, path-based). */
export type RouteMatchDescriptor = {
  readonly routePath: PathRef;
  readonly entrypointExport: "handler" | "template" | "default";
  readonly runtimeKind: RuntimeKind;
  readonly entrypointIsFunction: boolean;
  readonly entrypointExpectsRefSubject: boolean;
  readonly inFileConcerns: {
    readonly layout?: boolean;
    readonly dependencies?: boolean;
    readonly catch?: boolean;
    readonly guard?: boolean;
  };
  readonly composedConcerns: ComposedConcernsShape;
  /** Guard from in-file, sibling, or directory (path). */
  readonly guardPath?: PathRef;
  /** Catch from in-file or sibling (path). */
  readonly catchPath?: PathRef;
  readonly catchExport?: "catch" | "catchFn";
  readonly catchForm?: CatchForm;
  /** Layout from in-file or sibling (path). */
  readonly layoutPath?: PathRef;
  /** Dependencies from in-file or sibling (path). */
  readonly depsPath?: PathRef;
};

/** Directory companions (path-based). */
export type DirectoryCompanions = {
  readonly layout?: PathRef;
  readonly catch?: PathRef;
  readonly dependencies?: PathRef;
};

/** Declarative tree node: route leaf or directory with children. */
export type RouterDescriptorNode =
  | {
      readonly type: "route";
      readonly match: RouteMatchDescriptor;
    }
  | {
      readonly type: "directory";
      readonly dirPath: string;
      readonly children: readonly RouterDescriptorNode[];
      readonly companions?: DirectoryCompanions;
    };

/** Root descriptor tree. */
export type RouterDescriptorTree = {
  readonly root: RouterDescriptorNode;
  readonly rootCompanions?: Pick<DirectoryCompanions, "dependencies">;
};

/** Input for building the descriptor tree from route descriptors. */
export type BuildDescriptorTreeInput = {
  readonly descriptors: readonly {
    readonly filePath: string;
    readonly entrypointExport: "handler" | "template" | "default";
    readonly runtimeKind: RuntimeKind;
    readonly entrypointIsFunction: boolean;
    readonly entrypointExpectsRefSubject: boolean;
    readonly composedConcerns: ComposedConcernsShape;
    readonly inFileConcerns: {
      layout?: boolean;
      dependencies?: boolean;
      catch?: boolean;
      guard?: boolean;
    };
  }[];
  readonly dirToCompanions: ReadonlyMap<
    string,
    { layout?: string; dependencies?: string; catch?: string }
  >;
  readonly guardExportByPath: Readonly<Record<string, "default" | "guard">>;
  readonly catchExportByPath: Readonly<Record<string, "catch" | "catchFn">>;
  readonly catchFormByPath: Readonly<Record<string, CatchForm>>;
  readonly normalizeDir: (dir: string) => string;
  readonly isDirectoryCompanion: (path: string) => boolean;
  readonly siblingCompanionPath: (
    leafPath: string,
    kind: "guard" | "dependencies" | "layout" | "catch",
  ) => string;
};

/** Build declarative tree from route descriptors. */
export function buildRouterDescriptorTree(input: BuildDescriptorTreeInput): RouterDescriptorTree {
  const {
    descriptors,
    dirToCompanions,
    catchExportByPath,
    catchFormByPath,
    normalizeDir,
    isDirectoryCompanion,
    siblingCompanionPath,
  } = input;

  const toMatchDescriptor = (
    d: BuildDescriptorTreeInput["descriptors"][number],
  ): RouteMatchDescriptor => {
    const sibling = (k: "guard" | "dependencies" | "layout" | "catch") =>
      siblingCompanionPath(d.filePath, k);
    const hasSibling = (k: "guard" | "dependencies" | "layout" | "catch") =>
      d.composedConcerns[k].includes(sibling(k));
    const dirGuardPath = d.composedConcerns.guard.find(isDirectoryCompanion);

    const guardPath = d.inFileConcerns.guard
      ? d.filePath
      : hasSibling("guard")
        ? sibling("guard")
        : dirGuardPath;
    const catchPath = d.inFileConcerns.catch
      ? d.filePath
      : hasSibling("catch")
        ? sibling("catch")
        : undefined;
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
      catchExport: catchPath
        ? (() => {
            const exp = catchExportByPath[catchPath];
            if (!exp) throw new Error(`RVM: catch export missing for ${catchPath}`);
            return exp;
          })()
        : undefined,
      catchForm: catchPath
        ? (() => {
            const form = catchFormByPath[catchPath];
            if (!form) throw new Error(`RVM: catch form missing for ${catchPath}`);
            return form;
          })()
        : undefined,
      layoutPath: d.inFileConcerns.layout
        ? d.filePath
        : hasSibling("layout")
          ? sibling("layout")
          : undefined,
      depsPath: d.inFileConcerns.dependencies
        ? d.filePath
        : hasSibling("dependencies")
          ? sibling("dependencies")
          : undefined,
    };
  };

  const allDirs = new Set(descriptors.map((d) => normalizeDir(dirname(d.filePath))));
  for (const [dir] of dirToCompanions) allDirs.add(dir);
  if (allDirs.size > 0) allDirs.add("");
  const sortedDirs = [...allDirs].sort(
    (a, b) => b.split("/").filter(Boolean).length - a.split("/").filter(Boolean).length,
  );

  const dirNodeByPath = new Map<string, RouterDescriptorNode>();

  for (const dir of sortedDirs) {
    const directRoutes = descriptors.filter((d) => normalizeDir(dirname(d.filePath)) === dir);
    const isImmediateChild = (s: string) =>
      s !== dir &&
      (dir === ""
        ? s.indexOf("/") === -1
        : s.startsWith(dir + "/") && s.slice((dir + "/").length).indexOf("/") === -1);
    const childDirs = sortedDirs.filter(isImmediateChild);
    const routeChildren: RouterDescriptorNode[] = directRoutes.map((d) => ({
      type: "route",
      match: toMatchDescriptor(d),
    }));
    const dirChildren: RouterDescriptorNode[] = childDirs.map((s) => dirNodeByPath.get(s)!);
    const children: RouterDescriptorNode[] = [...routeChildren, ...dirChildren];

    const companions = dirToCompanions.get(dir);
    const hasCompanions =
      companions &&
      (companions.layout || companions.catch || (dir !== "" && companions.dependencies));
    const node: RouterDescriptorNode =
      children.length === 0
        ? {
            type: "directory",
            dirPath: dir,
            children: [],
            companions: hasCompanions
              ? {
                  layout: companions!.layout,
                  catch: companions!.catch,
                  dependencies: dir !== "" ? companions!.dependencies : undefined,
                }
              : undefined,
          }
        : children.length === 1 && !hasCompanions
          ? children[0]!
          : {
              type: "directory",
              dirPath: dir,
              children,
              companions: hasCompanions
                ? {
                    layout: companions!.layout,
                    catch: companions!.catch,
                    dependencies: dir !== "" ? companions!.dependencies : undefined,
                  }
                : undefined,
            };
    dirNodeByPath.set(dir, node);
  }

  let root = dirNodeByPath.get("");
  if (!root || (root.type === "directory" && root.children.length === 0)) {
    const flatChildren: RouterDescriptorNode[] = descriptors.map((d) => ({
      type: "route",
      match: toMatchDescriptor(d),
    }));
    root =
      flatChildren.length === 0
        ? { type: "directory", dirPath: "", children: [] }
        : flatChildren.length === 1
          ? flatChildren[0]!
          : { type: "directory", dirPath: "", children: flatChildren };
  }
  const rootCompanions = dirToCompanions.get("");
  return {
    root,
    rootCompanions: rootCompanions?.dependencies
      ? { dependencies: rootCompanions.dependencies }
      : undefined,
  };
}

function dirname(p: string): string {
  const i = p.lastIndexOf("/");
  return i < 0 ? "" : p.slice(0, i);
}

/** Context for rendering: var names and expr generators. */
export type RenderContext = {
  readonly varNameByPath: ReadonlyMap<string, string>;
  readonly guardExportByPath: Readonly<Record<string, "default" | "guard">>;
  readonly catchExportByPath: Readonly<Record<string, "catch" | "catchFn">>;
  readonly catchFormByPath: Readonly<Record<string, CatchForm>>;
  readonly depsFormByPath: Readonly<Record<string, DepsExportKind>>;
  readonly handlerExprFor: (match: RouteMatchDescriptor, varName: string) => string;
  readonly catchExprFor: (form: CatchForm, varName: string, exportName: string) => string;
  readonly depsExprFor: (kind: DepsExportKind, varName: string) => string;
};

/** Render tree to source. Optimizes: no merge for single child, minimal parens. */
export function renderRouterDescriptorTree(tree: RouterDescriptorTree, ctx: RenderContext): string {
  const emit = (node: RouterDescriptorNode): string => {
    if (node.type === "route") {
      return emitRoute(node.match, ctx);
    }
    const { children, companions } = node;
    let inner: string;
    if (children.length === 0) {
      throw new Error("RVM: directory node with no children should not be rendered");
    }
    if (children.length === 1) {
      inner = emit(children[0]!);
    } else {
      inner = `Router.merge(\n  ${children.map((c) => emit(c)).join(",\n  ")}\n)`;
    }
    if (companions?.layout) {
      const v = ctx.varNameByPath.get(companions.layout)!;
      inner = `${inner}.layout(${v}.layout)`;
    }
    if (companions?.catch) {
      const v = ctx.varNameByPath.get(companions.catch)!;
      const exp = ctx.catchExportByPath[companions.catch];
      if (!exp) throw new Error(`RVM: catch export missing for ${companions.catch}`);
      const form = ctx.catchFormByPath[companions.catch];
      if (!form) throw new Error(`RVM: catch form missing for ${companions.catch}`);
      const catchExpr = ctx.catchExprFor(form, v, exp);
      inner = `${inner}.catchCause(${catchExpr})`;
    }
    if (companions?.dependencies) {
      const v = ctx.varNameByPath.get(companions.dependencies)!;
      const depsKind = ctx.depsFormByPath[companions.dependencies];
      if (depsKind === undefined)
        throw new Error(
          `RVM: dependency form unknown for ${companions.dependencies}; validation should have failed (RVM-DEPS-001)`,
        );
      const depsExpr = ctx.depsExprFor(depsKind, v);
      inner = `${inner}.provide(${depsExpr})`;
    }
    return inner;
  };

  let result = emit(tree.root);
  if (tree.rootCompanions?.dependencies) {
    const v = ctx.varNameByPath.get(tree.rootCompanions.dependencies)!;
    const depsKind = ctx.depsFormByPath[tree.rootCompanions.dependencies];
    if (depsKind === undefined)
      throw new Error(
        `RVM: dependency form unknown for ${tree.rootCompanions.dependencies}; validation should have failed (RVM-DEPS-001)`,
      );
    const depsExpr = ctx.depsExprFor(depsKind, v);
    result = `${result}.provide(${depsExpr})`;
  }
  return result;
}

/** Emit Router.match(...) for a route. Favors positional when no extra opts. */
function emitRoute(match: RouteMatchDescriptor, ctx: RenderContext): string {
  const routeVar = ctx.varNameByPath.get(match.routePath)!;
  const routeRef = `${routeVar}.route`;
  const handlerExpr = ctx.handlerExprFor(match, routeVar);
  const hasExtraOpts = match.layoutPath || match.depsPath || match.catchPath;
  const guardPath = match.guardPath;
  const guardExport = guardPath ? ctx.guardExportByPath[guardPath] : undefined;
  const guardExpr =
    guardPath && guardExport ? `${ctx.varNameByPath.get(guardPath)!}.${guardExport}` : undefined;

  const opts: string[] = [`handler: ${handlerExpr}`];
  if (match.depsPath) {
    opts.push(`dependencies: ${ctx.varNameByPath.get(match.depsPath)!}.dependencies`);
  }
  if (match.layoutPath) {
    opts.push(`layout: ${ctx.varNameByPath.get(match.layoutPath)!}.layout`);
  }
  if (match.catchPath && match.catchExport) {
    const catchVar = ctx.varNameByPath.get(match.catchPath)!;
    const form = match.catchForm;
    if (!form) throw new Error(`RVM: catch form missing for ${match.catchPath}`);
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
