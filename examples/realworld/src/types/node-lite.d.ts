declare module "node:buffer" {
  export class Buffer extends Uint8Array {
    static from(input: string, encoding?: string): Buffer;
    toString(encoding?: string): string;
  }
}

declare module "node:crypto" {
  import { Buffer } from "node:buffer";

  export function randomBytes(size: number): Buffer;
  export function scrypt(
    password: string,
    salt: string,
    keylen: number,
    callback: (error: Error | null, derivedKey: Buffer) => void,
  ): void;
  export function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean;
}

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
