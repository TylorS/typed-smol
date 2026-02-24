/**
 * Entry for bundling the HttpApi virtual module plugin to sync ESM.
 * Used by scripts/build-router-plugin.mjs so the sample project can load
 * the plugin as an ESM module without top-level await.
 */
import { createHttpApiVirtualModulePlugin } from "@typed/app";

export default createHttpApiVirtualModulePlugin();
