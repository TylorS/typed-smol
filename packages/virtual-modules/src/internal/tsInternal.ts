/**
 * Internal TypeScript API access.
 *
 * The TypeScript Compiler API does not expose all capabilities we need for
 * type-target resolution, assignability fallbacks, and serialization. This
 * module centralizes use of non-public APIs (via type casts) so that:
 * - All such use is in one place and documented.
 * - Callers can guard with try/catch and optional chaining.
 * - Upgrades to new TS versions can be handled here.
 *
 * These APIs are not part of the public TypeScript contract and may change
 * across versions. Tested with TypeScript 5.x.
 */

import type * as ts from "typescript";

/** Index signature entry shape from internal getIndexInfosOfType (not in public .d.ts). */
export interface IndexInfo {
  readonly keyType: ts.Type;
  readonly type: ts.Type;
  readonly isReadonly?: boolean;
}

/**
 * Get index signature key/value types for an object type when available.
 * Uses internal TypeChecker.getIndexInfosOfType; may change in future TS versions.
 * Returns undefined when the API is missing or throws.
 */
export function getIndexInfosOfType(
  type: ts.Type,
  checker: ts.TypeChecker,
): readonly IndexInfo[] | undefined {
  try {
    const fn = (checker as ts.TypeChecker & { getIndexInfosOfType?(t: ts.Type): readonly IndexInfo[] })
      .getIndexInfosOfType;
    return fn?.(type);
  } catch {
    return undefined;
  }
}

/**
 * Resolve an alias symbol to the symbol it refers to (re-exports, import-then-export).
 * Only call when symbol.flags includes SymbolFlags.Alias.
 * Uses internal TypeChecker.getAliasedSymbol; may change in future TS versions.
 * Returns the original symbol when the API is missing or throws.
 */
export function getAliasedSymbol(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  tsMod: typeof import("typescript"),
): ts.Symbol {
  if ((symbol.flags & tsMod.SymbolFlags.Alias) === 0) return symbol;
  try {
    const aliased = (
      checker as ts.TypeChecker & { getAliasedSymbol(s: ts.Symbol): ts.Symbol }
    ).getAliasedSymbol(symbol);
    return aliased ?? symbol;
  } catch {
    return symbol;
  }
}

/**
 * Get the base (generic declaration) type from a TypeReference.
 * Uses internal (type as TypeReference).target; may change in future TS versions.
 * Returns undefined when not a TypeReference with target or when access throws.
 */
export function getTypeReferenceTarget(
  type: ts.Type,
  checker: ts.TypeChecker,
): (ts.Type & { symbol?: ts.Symbol }) | undefined {
  try {
    const args = checker.getTypeArguments(type as ts.TypeReference);
    if (args.length > 0) {
      const target = (type as ts.TypeReference & { target?: ts.Type }).target;
      return target as (ts.Type & { symbol?: ts.Symbol }) | undefined;
    }
  } catch {
    /* getTypeArguments can throw for some type shapes */
  }
  return undefined;
}

/**
 * Get the symbol attached to a type when available (e.g. interface, class, type alias).
 * Uses internal (type as Type).symbol; may change in future TS versions.
 */
export function getTypeSymbol(type: ts.Type): ts.Symbol | undefined {
  return (type as ts.Type & { symbol?: ts.Symbol }).symbol;
}

/**
 * Get namespace/merged declaration exports from a symbol when available.
 * Uses internal (symbol as Symbol).exports; may change in future TS versions.
 * Prefer checker.getExportsOfModule(moduleSymbol) for module symbols when applicable.
 */
export function getSymbolExports(
  symbol: ts.Symbol,
): Map<unknown, ts.Symbol> | undefined {
  return (symbol as ts.Symbol & { exports?: Map<unknown, ts.Symbol> }).exports;
}

/**
 * Get base types of an interface/class for inheritance checks.
 * Uses internal TypeChecker.getBaseTypes; may change in future TS versions.
 * Returns undefined when the API is missing or throws (e.g. type is not interface or class).
 */
export function getBaseTypes(
  type: ts.InterfaceType,
  checker: ts.TypeChecker,
): ts.Type[] | undefined {
  try {
    const fn = (checker as ts.TypeChecker & { getBaseTypes?(t: ts.InterfaceType): ts.Type[] })
      .getBaseTypes;
    return fn?.(type);
  } catch {
    return undefined;
  }
}

/**
 * ObjectFlags.Mapped value when the public ts.ObjectFlags is missing (e.g. older or different TS build).
 * Used only as a fallback for mapped-type detection in serialization.
 * Value 32 corresponds to ObjectFlags.Mapped in TypeScript 5.x; may need adjustment for other versions.
 */
export const FALLBACK_OBJECT_FLAGS_MAPPED = 32;
