import { Effect } from "effect";
import * as Route from "@typed/router";

export const route = Route.Join(Route.Parse("docs"), Route.Param("slug"));
/** Effect function handler: (params) => Effect. */
export const handler = (_params: { slug: string }): Effect.Effect<string> =>
  Effect.succeed("doc-by-slug");
