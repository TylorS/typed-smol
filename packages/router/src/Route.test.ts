import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Route from "./Route.js";

describe("typed/router/Route", () => {
  describe("Parse", () => {
    it("creates route from literal string", () => {
      const route = Route.Parse("users");

      expect(route.path).toEqual("/users");
      expect(route.ast.type).toEqual("path");
    });

    it("creates route from multi-segment literal", () => {
      const route = Route.Parse("api/v1/users");

      expect(route.path).toEqual("/api/v1/users");
    });
  });

  describe("slash", () => {
    it("creates root route", () => {
      expect(Route.Slash.path).toEqual("/");
    });
  });

  describe("wildcard", () => {
    it("creates wildcard route", () => {
      expect(Route.Wildcard.path).toEqual("/*");
    });
  });

  describe("param", () => {
    it("creates parameter route", () => {
      const route = Route.Param("id");

      expect(route.path).toEqual("/:id");
    });

    it("creates parameter route with descriptive name", () => {
      const route = Route.Param("userId");

      expect(route.path).toEqual("/:userId");
    });
  });

  describe("join", () => {
    it("joins literal routes", () => {
      const route = Route.Join(Route.Parse("api"), Route.Parse("users"));

      expect(route.path).toEqual("/api/users");
    });

    it("joins literal with parameter", () => {
      const route = Route.Join(Route.Parse("users"), Route.Param("id"));

      expect(route.path).toEqual("/users/:id");
    });

    it("joins multiple routes", () => {
      const route = Route.Join(
        Route.Parse("api"),
        Route.Parse("v1"),
        Route.Parse("users"),
        Route.Param("userId"),
        Route.Parse("posts"),
        Route.Param("postId"),
      );

      expect(route.path).toEqual("/api/v1/users/:userId/posts/:postId");
    });

    it("joins with wildcard", () => {
      const route = Route.Join(Route.Parse("files"), Route.Wildcard);

      expect(route.path).toEqual("/files/*");
    });
  });

  describe("paramsSchema", () => {
    it("decodes path params from literal route", () =>
      Effect.gen(function* () {
        const route = Route.Parse("users");
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({});

        expect(decoded).toEqual({});
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes path params from param route", () =>
      Effect.gen(function* () {
        const route = Route.Param("id");
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({ id: "123" });

        expect(decoded).toEqual({ id: "123" });
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes path params from joined route", () =>
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("users"), Route.Param("id"));
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({ id: "123" });

        expect(decoded).toEqual({ id: "123" });
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes wildcard params", () =>
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("files"), Route.Wildcard);
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({ "*": "path/to/file" });

        expect(decoded).toEqual({ "*": "path/to/file" });
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes multiple params from joined route", () =>
      Effect.gen(function* () {
        const route = Route.Join(
          Route.Parse("users"),
          Route.Param("userId"),
          Route.Parse("posts"),
          Route.Param("postId"),
        );
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({
          userId: "u1",
          postId: "p1",
        });

        expect(decoded).toEqual({ userId: "u1", postId: "p1" });
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes typed params from joined routes", () =>
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("comments"), Route.Int("commentId"));
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({ commentId: "42" });

        expect(decoded).toEqual({ commentId: 42 });
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("pathSchema", () => {
    it("decodes path-only params (excludes query)", () =>
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("users"), Route.Param("id"));
        const decoded = yield* Schema.decodeEffect(route.pathSchema)({ id: "123" });

        expect(decoded).toEqual({ id: "123" });
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("querySchema", () => {
    it("decodes empty query schema for path-only route", () =>
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("users"), Route.Param("id"));
        const decoded = yield* Schema.decodeEffect(route.querySchema)({});

        expect(decoded).toEqual({});
      }).pipe(Effect.scoped, Effect.runPromise));

    it("creates typed query params without adding them to the route path", () =>
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("articles"), Route.QueryParams(Route.Int("page")));
        const decoded = yield* Schema.decodeEffect(route.querySchema)({ page: "3" });

        expect(route.path).toEqual("/articles");
        expect(decoded).toEqual({ page: 3 });
      }).pipe(Effect.scoped, Effect.runPromise));

    it("merges query params from joined route segments", () =>
      Effect.gen(function* () {
        const route = Route.Join(
          Route.Parse("articles"),
          Route.QueryParams(Route.Int("page")),
          Route.QueryParams(Route.Param("tag")),
        );
        const decoded = yield* Schema.decodeEffect(route.paramsSchema)({
          page: "2",
          tag: "typed",
        });

        expect(decoded).toEqual({ page: 2, tag: "typed" });
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes optional typed query params", () =>
      Effect.gen(function* () {
        const route = Route.Join(
          Route.Parse("articles"),
          Route.QueryParams(Route.Int("page").optional()),
        );
        const decode = Schema.decodeEffect(route.querySchema);

        expect(yield* decode({})).toEqual({});
        expect(yield* decode({ page: "2" })).toEqual({ page: 2 });
      }).pipe(Effect.scoped, Effect.runPromise));

    it("makes any schema-backed query param optional", () =>
      Effect.gen(function* () {
        const route = Route.Join(
          Route.Parse("articles"),
          Route.QueryParams(
            Route.ParamWithSchema(
              "limit",
              Schema.NumberFromString.pipe(Schema.decodeTo(Schema.Int)),
            ).optional(),
          ),
        );
        const decode = Schema.decodeEffect(route.querySchema);

        expect(yield* decode({})).toEqual({});
        expect(yield* decode({ limit: "10" })).toEqual({ limit: 10 });
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes optional non-negative integer query params", () =>
      Effect.gen(function* () {
        const route = Route.Join(
          Route.Parse("articles"),
          Route.QueryParams(Route.NonNegativeInt("limit").optional()),
        );
        const decode = Schema.decodeEffect(route.querySchema);
        const negative = yield* decode({ limit: "-1" }).pipe(Effect.flip);

        expect(yield* decode({})).toEqual({});
        expect(yield* decode({ limit: "10" })).toEqual({ limit: 10 });
        expect(negative).toBeDefined();
      }).pipe(Effect.scoped, Effect.runPromise));

    it("decodes optional positive integer query params", () =>
      Effect.gen(function* () {
        const route = Route.Join(
          Route.Parse("articles"),
          Route.QueryParams(Route.PositiveInt("page").optional()),
        );
        const decode = Schema.decodeEffect(route.querySchema);
        const zero = yield* decode({ page: "0" }).pipe(Effect.flip);

        expect(yield* decode({})).toEqual({});
        expect(yield* decode({ page: "2" })).toEqual({ page: 2 });
        expect(zero).toBeDefined();
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("pipe", () => {
    it("supports pipeable interface", () => {
      const route = Route.Parse("users");
      const result = route.pipe((r) => r.path);

      expect(result).toEqual("/users");
    });
  });

  describe("path correctness", () => {
    describe("Literal path handling", () => {
      it("adds leading slash to simple literal", () => {
        expect(Route.Parse("users").path).toEqual("/users");
      });

      it("preserves slashes in input", () => {
        expect(Route.Parse("/users").path).toEqual("/users");
      });

      it("preserves internal slashes", () => {
        expect(Route.Parse("api/v1/users").path).toEqual("/api/v1/users");
      });

      it("handles empty string as root", () => {
        expect(Route.Parse("").path).toEqual("/");
      });
    });

    describe("join path construction", () => {
      it("joins single route", () => {
        const route = Route.Join(Route.Parse("users"));
        expect(route.path).toEqual("/users");
      });

      it("joins slash with literal", () => {
        const route = Route.Join(Route.Slash, Route.Parse("users"));
        expect(route.path).toEqual("//users");
      });

      it("joins param at start", () => {
        const route = Route.Join(Route.Param("tenant"), Route.Parse("users"));
        expect(route.path).toEqual("/:tenant/users");
      });

      it("joins wildcard at start", () => {
        const route = Route.Join(Route.Wildcard, Route.Parse("match"));
        expect(route.path).toEqual("/*/match");
      });

      it("joins three params", () => {
        const route = Route.Join(Route.Param("a"), Route.Param("b"), Route.Param("c"));
        expect(route.path).toEqual("/:a/:b/:c");
      });

      it("joins param between literals", () => {
        const route = Route.Join(Route.Parse("users"), Route.Param("id"), Route.Parse("profile"));
        expect(route.path).toEqual("/users/:id/profile");
      });

      it("joins nested api pattern", () => {
        const route = Route.Join(
          Route.Parse("api"),
          Route.Parse("v2"),
          Route.Parse("organizations"),
          Route.Param("orgId"),
          Route.Parse("teams"),
          Route.Param("teamId"),
          Route.Parse("members"),
          Route.Param("memberId"),
        );
        expect(route.path).toEqual("/api/v2/organizations/:orgId/teams/:teamId/members/:memberId");
      });

      it("joins wildcard at end for catch-all", () => {
        const route = Route.Join(Route.Parse("docs"), Route.Param("version"), Route.Wildcard);
        expect(route.path).toEqual("/docs/:version/*");
      });

      it("joins multiple wildcards", () => {
        const route = Route.Join(Route.Wildcard, Route.Wildcard);
        expect(route.path).toEqual("/*/*");
      });

      it("joins alternating params and literals", () => {
        const route = Route.Join(
          Route.Param("a"),
          Route.Parse("x"),
          Route.Param("b"),
          Route.Parse("y"),
          Route.Param("c"),
        );
        expect(route.path).toEqual("/:a/x/:b/y/:c");
      });
    });

    describe("individual route paths", () => {
      it("Slash is /", () => {
        expect(Route.Slash.path).toEqual("/");
      });

      it("Wildcard is /*", () => {
        expect(Route.Wildcard.path).toEqual("/*");
      });

      it("Param includes colon prefix", () => {
        expect(Route.Param("foo").path).toEqual("/:foo");
      });

      it("Param with long name", () => {
        expect(Route.Param("organizationId").path).toEqual("/:organizationId");
      });

      it("Param with numeric suffix", () => {
        expect(Route.Param("id1").path).toEqual("/:id1");
      });
    });
  });
});
