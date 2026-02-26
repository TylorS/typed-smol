import type { Plugin } from "vite";
import type { CreateTypeInfoApiSession, VirtualModuleResolver } from "@typed/virtual-modules";
import { encodeVirtualId, decodeVirtualId, isVirtualId } from "./encodeVirtualId.js";

const PLUGIN_NAME = "virtual-modules";

export interface VirtualModulesVitePluginOptions {
  /**
   * Resolver that handles virtual module resolution (e.g. a PluginManager instance).
   */
  readonly resolver: VirtualModuleResolver;
  /**
   * Optional session factory for TypeInfo API when plugins need type information.
   */
  readonly createTypeInfoApiSession?: CreateTypeInfoApiSession;
  /**
   * When true, resolution errors are logged with console.warn. Default true.
   */
  readonly warnOnError?: boolean;
}

/** Validate decoded id/importer before passing to resolver (defense in depth). */
function validateDecodedPayload(id: string, importer: string): boolean {
  if (typeof id !== "string" || id.length === 0 || id.includes("\0")) return false;
  if (typeof importer !== "string" || importer.length === 0 || importer.includes("\0"))
    return false;
  if (id.length > 4096 || importer.length > 4096) return false;
  return true;
}

/**
 * Vite plugin that integrates @typed/virtual-modules: resolves and loads virtual
 * modules via the given resolver (e.g. PluginManager) in both dev and build.
 */
export function virtualModulesVitePlugin(options: VirtualModulesVitePluginOptions): Plugin {
  const { resolver, createTypeInfoApiSession, warnOnError = true } = options;

  return {
    name: PLUGIN_NAME,
    enforce: "pre",

    resolveId(id: string, importer: string | undefined): string | null {
      if (!importer) {
        return null;
      }
      let effectiveImporter = importer;
      if (isVirtualId(importer)) {
        const decoded = decodeVirtualId(importer);
        if (decoded && validateDecodedPayload(decoded.id, decoded.importer)) {
          effectiveImporter = decoded.importer;
        }
      }
      const result = resolver.resolveModule({
        id,
        importer: effectiveImporter,
        createTypeInfoApiSession,
      });
      if (result.status === "resolved") {
        return encodeVirtualId(id, effectiveImporter);
      }
      if (result.status === "error" && warnOnError) {
        console.warn(
          `[${PLUGIN_NAME}] ${result.diagnostic.pluginName}: ${result.diagnostic.message}`,
        );
      }
      return null;
    },

    load(resolvedId: string): string | { code: string } | null {
      if (!isVirtualId(resolvedId)) {
        return null;
      }
      const parsed = decodeVirtualId(resolvedId);
      if (!parsed || !validateDecodedPayload(parsed.id, parsed.importer)) {
        return null;
      }
      const { id, importer } = parsed;
      const result = resolver.resolveModule({
        id,
        importer,
        createTypeInfoApiSession,
      });
      if (result.status === "resolved") {
        return { code: result.sourceText };
      }
      if (result.status === "error" && warnOnError) {
        console.warn(
          `[${PLUGIN_NAME}] load ${result.diagnostic.pluginName}: ${result.diagnostic.message}`,
        );
      }
      return null;
    },
  };
}
