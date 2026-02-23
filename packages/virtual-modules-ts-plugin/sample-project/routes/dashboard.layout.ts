import type { Layout } from "@typed/router";

/** Sibling layout for dashboard route - passthrough. */
export const layout: Layout<any, any, never, any, any, never, any> = ({ content }) => content;
