declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: { readonly recursive?: boolean }): void;
  export function rmSync(path: string, options?: { readonly force?: boolean; readonly recursive?: boolean }): void;
}

declare module "node:path" {
  export function dirname(path: string): string;
  export function resolve(...paths: readonly string[]): string;
}

declare module "node:url" {
  export function fileURLToPath(url: string | URL): string;
}

declare const process: {
  readonly argv: readonly string[];
  cwd(): string;
  exitCode?: number;
};
