/**
 * Entry for bundling the router virtual module plugin to CJS.
 * Used by scripts/build-router-plugin.cjs so the sample project can load
 * the plugin via require() (NodeModulePluginLoader is sync CJS).
 */
import { createRouterVirtualModulePlugin } from "@typed/app";

export default createRouterVirtualModulePlugin();
