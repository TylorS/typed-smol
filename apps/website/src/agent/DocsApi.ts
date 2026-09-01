import { Effect, Layer, Schema } from "effect";
import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from "effect/unstable/httpapi";
import {
  GlossaryEntrySchema,
  GuideDocumentationSchema,
  ExposurePayloadSchema,
} from "../docs/Model.js";
import { operations } from "./Operations.js";

const SearchResult = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  kind: Schema.Literals(["package", "module", "exposure", "resource", "glossary", "guide"]),
  text: Schema.String,
  href: Schema.String,
  score: Schema.Number,
});

const SearchResponse = Schema.Struct({
  query: Schema.String,
  results: Schema.Array(SearchResult),
  repositoryRevision: Schema.String,
});

export class DocumentationNotFound extends Schema.TaggedError<DocumentationNotFound>()(
  "DocumentationNotFound",
  { resource: Schema.String },
) {}

export class DocumentationApiGroup extends HttpApiGroup.make("documentation")
  .add(
    HttpApiEndpoint.get("search", "/search", {
      query: {
        q: Schema.String,
        limit: Schema.optional(Schema.NumberFromString),
      },
      success: SearchResponse,
    }),
    HttpApiEndpoint.get("symbol", "/symbol/:id", {
      params: { id: Schema.String },
      success: ExposurePayloadSchema,
      error: DocumentationNotFound.pipe(HttpApiSchema.status(404)),
    }),
    HttpApiEndpoint.get("guide", "/guide/:slug", {
      params: { slug: Schema.String },
      success: GuideDocumentationSchema,
      error: DocumentationNotFound.pipe(HttpApiSchema.status(404)),
    }),
    HttpApiEndpoint.get("glossary", "/glossary/:id", {
      params: { id: Schema.String },
      success: GlossaryEntrySchema,
      error: DocumentationNotFound.pipe(HttpApiSchema.status(404)),
    }),
  )
  .prefix("/api/docs")
  .annotateMerge(
    OpenApi.annotations({
      title: "Typed documentation",
      description: "Typed guides, public API symbols, and canonical glossary terms.",
    }),
  ) {}

export class DocumentationApi extends HttpApi.make("typed-documentation")
  .add(DocumentationApiGroup)
  .annotateMerge(
    OpenApi.annotations({
      title: "Typed documentation API",
      description:
        "A read-only, schema-described API generated from the same documentation model as the human site.",
      version: "1.0.0",
    }),
  ) {}

const DocumentationHandlers = HttpApiBuilder.group(
  DocumentationApi,
  "documentation",
  // oxlint-disable-next-line require-yield
  Effect.fn(function* (handlers) {
    return handlers.handleAll({
      search: ({ query }) => Effect.promise(() => operations.search(query.q, query.limit)),
      symbol: Effect.fn(function* ({ params }) {
        const value = yield* Effect.promise(() => operations.symbol(params.id));
        if (value === undefined) {
          return yield* new DocumentationNotFound({ resource: `symbol:${params.id}` });
        }
        return value;
      }),
      guide: Effect.fn(function* ({ params }) {
        const value = operations.guide(params.slug);
        if (value === undefined) {
          return yield* new DocumentationNotFound({ resource: `guide:${params.slug}` });
        }
        return value;
      }),
      glossary: Effect.fn(function* ({ params }) {
        const value = operations.glossary(params.id);
        if (value === undefined) {
          return yield* new DocumentationNotFound({ resource: `glossary:${params.id}` });
        }
        return value;
      }),
    });
  }),
);

export const DocumentationApiRoutes = HttpApiBuilder.layer(DocumentationApi, {
  openapiPath: "/api/docs/openapi.json",
}).pipe(Layer.provide(DocumentationHandlers));
