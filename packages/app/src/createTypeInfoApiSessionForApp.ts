import type { CreateTypeInfoApiSessionOptions, TypeTargetSpec } from "@typed/virtual-modules";
import {
  createTypeInfoApiSession,
  createTypeTargetBootstrapContent,
} from "@typed/virtual-modules";
import { HTTPAPI_TYPE_TARGET_SPECS, ROUTER_TYPE_TARGET_SPECS } from "./internal/typeTargetSpecs.js";

/** Merged type target specs for router + HttpApi plugins. Dedupes by id. */
const APP_TYPE_TARGET_SPECS: readonly TypeTargetSpec[] = (() => {
  const seen = new Set<string>();
  const out: TypeTargetSpec[] = [];
  for (const spec of [...ROUTER_TYPE_TARGET_SPECS, ...HTTPAPI_TYPE_TARGET_SPECS]) {
    if (!seen.has(spec.id)) {
      seen.add(spec.id);
      out.push(spec);
    }
  }
  return out;
})();

/** Bootstrap content for app type targets. Include in program rootNames when creating programs. */
export const APP_TYPE_TARGET_BOOTSTRAP_CONTENT = createTypeTargetBootstrapContent(
  APP_TYPE_TARGET_SPECS,
);

/**
 * Creates a TypeInfo API session with type target specs for router and HttpApi
 * virtual modules. Use when providing createTypeInfoApiSession to typedVitePlugin
 * or other integrations that need structural assignability (assignableTo) checks.
 *
 * The program must include imports from canonical type target modules (effect/Effect,
 * @typed/router, etc.). If the program has no such imports, add a bootstrap file:
 * write APP_TYPE_TARGET_BOOTSTRAP_CONTENT to a file and include it in rootNames.
 *
 * @example
 * ```ts
 * import { createTypeInfoApiSessionForApp, APP_TYPE_TARGET_BOOTSTRAP_CONTENT } from "@typed/app";
 * import { writeFileSync } from "node:fs";
 * import { join } from "node:path";
 * import ts from "typescript";
 *
 * const bootstrapPath = join(tmpDir, "__typeTargetBootstrap.ts");
 * writeFileSync(bootstrapPath, APP_TYPE_TARGET_BOOTSTRAP_CONTENT);
 * const program = ts.createProgram(["src/main.ts", bootstrapPath], options, host);
 * typedVitePlugin({
 *   createTypeInfoApiSession: () => createTypeInfoApiSessionForApp({ ts, program }),
 * });
 * ```
 */
export function createTypeInfoApiSessionForApp(
  options: Omit<CreateTypeInfoApiSessionOptions, "typeTargetSpecs">,
) {
  return createTypeInfoApiSession({
    ...options,
    typeTargetSpecs: APP_TYPE_TARGET_SPECS,
  });
}
