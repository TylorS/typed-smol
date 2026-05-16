import { vavite } from "vavite";
import type { Plugin } from "vite";

export interface TypedVaviteIntegrationOptions {
  readonly serverEntry: string;
}

export function createTypedVavitePlugin(options: TypedVaviteIntegrationOptions): Plugin[] {
  const plugins = vavite({
    entries: [
      {
        entry: options.serverEntry,
        type: "runnable-handler",
        order: "post",
      },
    ],
  });
  return Array.isArray(plugins) ? (plugins as Plugin[]) : [plugins as Plugin];
}
