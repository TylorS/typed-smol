import { Fx } from "@typed/fx";

/** Passthrough layout - renders content as-is. */
export const layout = <A, E, R>({ content }: { content: Fx.Fx<A, E, R> }) => content;
