import type * as ts from "typescript";

/**
 * Minimal PluginCreateInfo shape used when the plugin is loaded by tsserver.
 * The full interface is defined in typescript/lib/tsserverlibrary.
 */
export interface PluginCreateInfo {
  readonly languageService: ts.LanguageService;
  readonly project: ts.LanguageServiceHost & {
    getCurrentDirectory?(): string;
    watchFile?(path: string, callback: () => void): ts.FileWatcher;
    watchDirectory?(path: string, callback: () => void, recursive?: boolean): ts.FileWatcher;
    projectService?: {
      logger?: { info?(message: string): void };
    };
  };
  readonly config?: unknown;
}
