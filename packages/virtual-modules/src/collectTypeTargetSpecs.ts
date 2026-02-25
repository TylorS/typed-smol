import type { TypeTargetSpec, VirtualModulePlugin } from "./types.js";

/**
 * Collects and merges typeTargetSpecs from plugins. Dedupes by id (first wins).
 */
export function collectTypeTargetSpecsFromPlugins(
  plugins: readonly VirtualModulePlugin[],
): readonly TypeTargetSpec[] {
  const seen = new Set<string>();
  const result: TypeTargetSpec[] = [];
  for (const plugin of plugins) {
    const specs = plugin.typeTargetSpecs;
    if (!specs?.length) continue;
    for (const spec of specs) {
      if (!seen.has(spec.id)) {
        seen.add(spec.id);
        result.push(spec);
      }
    }
  }
  return result;
}
