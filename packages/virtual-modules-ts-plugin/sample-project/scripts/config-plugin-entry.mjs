/**
 * Entry for bundling the config virtual module plugin to sync ESM.
 * Used by scripts/build-router-plugin.mjs so generated api: sources can
 * resolve typed:config through vmc and the TS plugin sample project.
 */
import { createConfigVirtualModulePlugin, loadTypedConfig } from "@typed/app";
import ts from "typescript";

export default createConfigVirtualModulePlugin({
  loadConfig: () => loadTypedConfig({ projectRoot: process.cwd(), ts }),
});
