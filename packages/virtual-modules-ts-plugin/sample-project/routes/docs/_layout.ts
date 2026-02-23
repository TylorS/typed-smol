import { Fx } from "@typed/fx";

/** Directory layout for docs/* routes - passthrough. */
export const layout = <A, E, R>({ content }: { content: Fx.Fx<A, E, R> }) => content;
