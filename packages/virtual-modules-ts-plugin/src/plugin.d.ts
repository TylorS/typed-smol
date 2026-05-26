import type * as ts from "typescript";

interface VirtualModulesTsPluginConfig {
  readonly debounceMs?: number;
  readonly debugTimings?: boolean;
  readonly templateDiagnostics?: boolean;
  readonly configPath?: string;
  readonly vmcConfigPath?: string;
}

declare function init(modules: { typescript: typeof import("typescript") }): {
  create: (info: {
    languageService: ts.LanguageService;
    project: ts.LanguageServiceHost;
    config?: VirtualModulesTsPluginConfig;
  }) => ts.LanguageService;
};

export = init;
