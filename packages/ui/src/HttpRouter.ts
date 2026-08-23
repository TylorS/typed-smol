import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import { hasProperty } from "effect/Predicate";
import { type HttpRouter, type Route, RouteContext } from "effect/unstable/http/HttpRouter";
import * as HttpServerError from "effect/unstable/http/HttpServerError";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import {
  type CurrentRouteTree,
  type CompiledEntry,
  compile,
  CurrentRoute,
  makeRouteExecutor,
  type Matcher,
  Join,
  Parse,
  type RouteDecodeError,
  type RouteGuardError,
  type Router,
} from "@typed/router";
import { initialMemory } from "@typed/navigation";
import { renderToHtmlString, type RenderEvent } from "@typed/template";

type ProvidedForSsr = Scope.Scope | Router;

export const ssrForHttp: {
  <E, R>(
    input: Matcher<RenderEvent, E, R>,
  ): (router: HttpRouter) => Effect.Effect<void, never, Exclude<R, ProvidedForSsr>>;
  <E, R>(
    router: HttpRouter,
    input: Matcher<RenderEvent, E, R>,
  ): Effect.Effect<void, never, Exclude<R, ProvidedForSsr>>;
} = dual(2, <E, R>(router: HttpRouter, input: Matcher<RenderEvent, E, R>) => {
  return Effect.gen(function* () {
    const matcher = Option.match(yield* Effect.serviceOption(CurrentRoute), {
      onNone: () => input,
      onSome: (parent: CurrentRouteTree) => input.prefix(parent.route),
    });
    const entries = compile(matcher.cases);
    const currentServices = yield* Effect.context<R>();
    const candidatesByPath = new Map<string, Array<CompiledEntry>>();

    for (const entry of entries) {
      const candidates = candidatesByPath.get(entry.route.path);
      if (candidates === undefined) {
        candidatesByPath.set(entry.route.path, [entry]);
      } else {
        candidates.push(entry);
      }
    }

    yield* router.addAll(
      Array.from(candidatesByPath.values(), (candidates) =>
        toRoute<E, R>(candidates, currentServices),
      ),
    );
  });
});

export function handleHttpServerError(router: HttpRouter) {
  return router.addGlobalMiddleware(
    Effect.catch((error: unknown) =>
      HttpServerError.isHttpServerError(error)
        ? Effect.succeed(HttpServerResponse.text(error.message, { status: getStatus(error) }))
        : Effect.fail(error),
    ),
  );
}

function getStatus(error: HttpServerError.HttpServerError): number {
  switch (error.reason._tag) {
    case "RouteNotFound":
      return 404;
    case "RequestParseError":
      return 400;
    case "InternalError":
    case "ResponseError":
      return 500;
  }
}

function toRoute<E, R>(
  candidates: ReadonlyArray<CompiledEntry>,
  currentServices: Context.Context<R>,
): Route<any, any> {
  return {
    ["~effect/http/HttpRouter/Route"]: "~effect/http/HttpRouter/Route",
    method: "GET",
    path: candidates[0].route.path,
    handler: Effect.gen(function* () {
      const routeContext = yield* RouteContext;
      const request = yield* HttpServerRequest.HttpServerRequest;
      const searchParams = yield* HttpServerRequest.ParsedSearchParams;
      const provided = Layer.mergeAll(
        initialMemory({ url: request.url }),
        Layer.succeed(
          CurrentRoute,
          yield* Effect.serviceOption(CurrentRoute).pipe(
            Effect.map(
              Option.match({
                onNone: (): CurrentRouteTree => ({
                  route: Parse(request.url),
                  parent: undefined,
                }),
                onSome: (parent: CurrentRouteTree): CurrentRouteTree => ({
                  route: Join(parent.route, Parse(request.url)),
                  parent,
                }),
              }),
            ),
          ),
        ),
      );
      const input = { ...routeContext.params, ...searchParams };
      const requestServices = Context.merge(currentServices, yield* Effect.context<any>());
      const executor = yield* makeRouteExecutor<RenderEvent, E, R>().pipe(
        Effect.provideContext(requestServices),
      );
      const rendered = yield* executor
        .transition({
          path: request.url,
          input,
          candidates,
          layers: [provided],
        })
        .pipe(
          Effect.catchIf(
            isRouteDecodeError,
            (error) =>
              new HttpServerError.HttpServerError({
                reason: new HttpServerError.RequestParseError({ request, cause: error }),
              }),
          ),
          Effect.catchIf(
            isRouteGuardError,
            () =>
              new HttpServerError.HttpServerError({
                reason: new HttpServerError.RouteNotFound({ request }),
              }),
          ),
        );

      const html = yield* renderToHtmlString(rendered).pipe(Effect.provideContext(requestServices));
      return HttpServerResponse.text(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }),
    uninterruptible: false,
    prefix: Option.none(),
  };
}

function hasTag<const Tag extends string>(
  value: unknown,
  tag: Tag,
): value is { readonly _tag: Tag } {
  return (
    hasProperty(value, "_tag") &&
    value._tag === tag
  );
}

function isRouteDecodeError(value: unknown): value is RouteDecodeError {
  return hasTag(value, "RouteDecodeError");
}

function isRouteGuardError(value: unknown): value is RouteGuardError {
  return hasTag(value, "RouteGuardError");
}
