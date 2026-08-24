import type { Component } from "svelte";
import type { Readable } from "svelte/store";

declare const Bridge: Component<{
  readonly component: Component<Record<string, any>>;
  readonly values: Readable<Record<string, any>>;
}>;

export default Bridge;
