import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import { Articles } from "../../application/Articles.js";
import { HttpMethod, authToken } from "../../common/http.js";
import { respondNoContent } from "../../common/errors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Parse("/:slug");
export const method = HttpMethod.Delete;
export const success = HttpApiSchema.NoContent;

export const handler = Effect.fn("Articles.delete")(function* ({ headers, path }) {
  return yield* respondNoContent(
    Articles.use((articles) => articles.delete(authToken(headers), path.slug)),
  );
}) satisfies RawHandler<Articles>;
