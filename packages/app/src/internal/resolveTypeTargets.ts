import type * as ts from "typescript";
import type { ResolvedTypeTarget } from "@typed/virtual-modules";

type TS = typeof import("typescript");

const ROUTER_TYPE_SPECS: readonly { id: string; module: string; exportName: string }[] = [
  { id: "Fx", module: "@typed/fx", exportName: "Fx" },
  { id: "Effect", module: "effect", exportName: "Effect" },
  { id: "Stream", module: "effect", exportName: "Stream" },
  { id: "Route", module: "@typed/router", exportName: "Route" },
  { id: "RefSubject", module: "@typed/fx", exportName: "RefSubject" },
  { id: "Option", module: "effect", exportName: "Option" },
  { id: "Layer", module: "effect/Layer", exportName: "Layer" },
  { id: "ServiceMap", module: "effect/ServiceMap", exportName: "ServiceMap" },
];

/**
 * Resolve well-known types from the program for structural assignability checks.
 * Scans source files for imports from the given modules and extracts the type
 * of each export. Use with createTypeInfoApiSession typeTargets option.
 *
 * @returns Array of ResolvedTypeTarget; entries may be missing if the program
 *   does not import from the required modules.
 */
export function resolveRouterTypeTargets(program: ts.Program, tsMod: TS): ResolvedTypeTarget[] {
  const checker = program.getTypeChecker();
  const found = new Map<string, ts.Type>();

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;
    tsMod.forEachChild(sourceFile, (node) => {
      if (!tsMod.isImportDeclaration(node)) return;
      const moduleSpecifier = node.moduleSpecifier;
      if (!tsMod.isStringLiteral(moduleSpecifier)) return;
      const moduleSpec = moduleSpecifier.text;
      const binding = node.importClause;
      if (!binding) return;

      const addNamed = (name: ts.ImportSpecifier) => {
        const exportName = (name.propertyName ?? name.name).getText(sourceFile);
        const spec = ROUTER_TYPE_SPECS.find(
          (s) => s.module === moduleSpec && s.exportName === exportName,
        );
        if (!spec || found.has(spec.id)) return;
        const symbol = checker.getSymbolAtLocation(name.name);
        if (!symbol) return;
        const aliased =
          (
            checker as ts.TypeChecker & { getAliasedSymbol?(s: ts.Symbol): ts.Symbol }
          ).getAliasedSymbol?.(symbol) ?? symbol;
        const decl = aliased.valueDeclaration ?? aliased.declarations?.[0];
        const type = decl
          ? checker.getTypeOfSymbolAtLocation(aliased, decl)
          : checker.getDeclaredTypeOfSymbol(aliased);
        if (type && !(type.flags & tsMod.TypeFlags.Any)) {
          found.set(spec.id, type);
        }
      };

      if (binding.namedBindings) {
        if (tsMod.isNamedImports(binding.namedBindings)) {
          for (const elem of binding.namedBindings.elements) {
            addNamed(elem);
          }
        }
      } else if (binding.name) {
        // Namespace import: import * as M from "mod"
        const spec = ROUTER_TYPE_SPECS.find((s) => s.module === moduleSpec);
        if (!spec || found.has(spec.id)) return;
        const symbol = checker.getSymbolAtLocation(binding.name);
        if (!symbol) return;
        const nsType = checker.getTypeOfSymbolAtLocation(symbol, binding.name);
        const prop = nsType.getProperty?.(spec.exportName);
        if (!prop) return;
        const decl = prop.valueDeclaration ?? prop.declarations?.[0];
        const type = decl
          ? checker.getTypeOfSymbolAtLocation(prop, decl)
          : checker.getDeclaredTypeOfSymbol(prop);
        if (type && !(type.flags & tsMod.TypeFlags.Any)) {
          found.set(spec.id, type);
        }
      }
    });
  }

  return ROUTER_TYPE_SPECS.filter((s) => found.has(s.id)).map((s) => ({
    id: s.id,
    type: found.get(s.id)!,
  }));
}
