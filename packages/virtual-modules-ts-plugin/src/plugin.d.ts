import type * as ts from "typescript";

interface VirtualModulesTsPluginConfig {
  readonly plugins?: readonly string[];
  readonly debounceMs?: number;
}

declare function init(modules: {
  typescript: typeof import("typescript");
}): {
  create: (
    info: {
      languageService: ts.LanguageService;
      project: ts.LanguageServiceHost;
      config?: VirtualModulesTsPluginConfig;
    },
  ) => ts.LanguageService;
};

export = init;
