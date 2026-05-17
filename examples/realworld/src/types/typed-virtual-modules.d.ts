declare module "typed:browser?*" {
  import type { Effect } from "effect";

  export const BrowserRuntime: unknown;
  export const Routes: unknown;
  export function hydrate(options?: {
    readonly layers?: readonly unknown[];
    readonly onError?: (cause: unknown) => unknown;
    readonly root?: string | HTMLElement;
    readonly window?: Window;
  }): unknown;
  export function run(options?: {
    readonly layers?: readonly unknown[];
    readonly onError?: (cause: unknown) => unknown;
    readonly root?: string | HTMLElement;
    readonly window?: Window;
  }): Effect.Effect<never, unknown, never>;
}

declare module "typed:server?*" {
  import type { Effect } from "effect";

  export const AppLayer: unknown;
  export const ServerLayer: unknown;
  export const handler: unknown;
  export default handler;
  export function run(options?: {
    readonly onError?: (cause: unknown) => unknown;
  }): Effect.Effect<never, unknown, never>;
}
