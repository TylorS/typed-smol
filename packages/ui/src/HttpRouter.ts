import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { dual } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Scope from "effect/Scope";
import * as ServiceMap from "effect/ServiceMap";
import { type HttpRouter, type Route, RouteContext } from "effect/unstable/http/HttpRouter";
import * as HttpServerError from "effect/unstable/http/HttpServerError";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import { RefSubject } from "@typed/fx";
import {
  type CurrentRouteTree,
  type CompiledEntry,
  compile,
  CurrentRoute,
  makeCatchManager,
  makeLayerManager,
  makeLayoutManager,
  type Matcher,
  Join,
  Parse,
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
    const currentServices = yield* Effect.services<R>();

    yield* router.addAll(entries.map((e: CompiledEntry) => toRoute(e, currentServices)));
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

function toRoute(
  entry: CompiledEntry,
  currentServices: ServiceMap.ServiceMap<never>,
): Route<any, any> {
  return {
    "~effect/http/HttpRouter/Route": "~effect/http/HttpRouter/Route",
    method: "GET",
    path: entry.route.path,
    handler: Effect.gen(function* () {
      const fiberId = yield* Effect.fiberId;
      const rootScope = yield* Effect.scope;
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

      const params = yield* Effect.mapError(
        entry.decode(input),
        (cause) =>
          new HttpServerError.HttpServerError({
            reason: new HttpServerError.RequestParseError({ request, cause }),
          }),
      );

      const memoMap = yield* Layer.makeMemoMap;
      const layerManager = makeLayerManager(memoMap, rootScope, fiberId);
      const layoutManager = makeLayoutManager(rootScope, fiberId);
      const catchManager = makeCatchManager(rootScope, fiberId);
      const prepared = yield* layerManager.prepare(entry.layers.concat(provided));

      const guardExit = yield* entry
        .guard(params)
        .pipe(Effect.provideServices(prepared.services), Effect.exit);

      if (Exit.isFailure(guardExit) || Option.isNone(guardExit.value)) {
        yield* prepared.rollback;
        return yield* new HttpServerError.HttpServerError({
          reason: new HttpServerError.RouteNotFound({ request }),
        });
      }

      const matchedParams = guardExit.value.value;
      yield* prepared.commit;

      const scope = yield* Scope.fork(rootScope);
      const paramsRef = yield* RefSubject.make(matchedParams).pipe(Scope.provide(scope));

      const preparedServices = prepared.services as ServiceMap.ServiceMap<any>;
      const handlerServices = ServiceMap.merge(
        ServiceMap.merge(currentServices, preparedServices),
        ServiceMap.make(Scope.Scope, scope),
      );

      const handlerFx = entry.handler(paramsRef);

      const withLayouts = yield* layoutManager.apply(
        entry.layouts,
        matchedParams,
        handlerFx,
        preparedServices,
      );

      const withCatches = yield* catchManager.apply(entry.catches, withLayouts, preparedServices);

      const html = yield* renderToHtmlString(withCatches).pipe(
        Effect.provideServices(handlerServices),
      );
      return HttpServerResponse.text(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }),
    uninterruptible: false,
    prefix: undefined,
  };
}
