import { Fx } from "@typed/fx";
import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import { hasProperty } from "effect/Predicate";
import * as Stream from "effect/Stream";
import {
  type HttpRouter,
  type Provided as HttpRouterProvided,
  type Request as HttpRouterRequest,
  type Route,
  RouteContext,
} from "effect/unstable/http/HttpRouter";
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
import { Ids } from "@typed/id";
import { initialMemory } from "@typed/navigation";
import { renderToHtml, renderToHtmlString, type RenderEvent } from "@typed/template";

type ProvidedForSsr = Scope.Scope | Router;

type SsrForHttpRequirement<E, R> =
  | Exclude<R, ProvidedForSsr>
  | HttpRouterRequest.From<"Error", E | HttpServerError.HttpServerError>;

type SsrForHttpEffect<E, R> = Effect.Effect<void, never, SsrForHttpRequirement<E, R>>;

type SsrResponse<E, R> = (
  rendered: Fx.Fx<RenderEvent, E, R | ProvidedForSsr>,
  requestServices: Context.Context<R | HttpRouterProvided>,
) => Effect.Effect<
  HttpServerResponse.HttpServerResponse,
  E,
  HttpRouterProvided
>;

const htmlResponseHeaders = { "content-type": "text/html; charset=utf-8" } as const;

const bufferedResponse =
  <E, R>(): SsrResponse<E, R> =>
  (rendered, requestServices) =>
    Effect.gen(function* () {
      const html = yield* renderToHtmlString(rendered).pipe(Effect.provideContext(requestServices));
      return HttpServerResponse.text(html, { headers: htmlResponseHeaders });
    }) as Effect.Effect<
      HttpServerResponse.HttpServerResponse,
      E,
      HttpRouterProvided
    >;

const streamingResponse =
  <E, R>(): SsrResponse<E, R> =>
  (rendered, requestServices) =>
    Effect.gen(function* () {
      const context = Context.merge(requestServices, yield* Effect.context());
      return HttpServerResponse.stream(
        Stream.provideContext(
          renderToHtml(rendered).pipe(
            Fx.provideContext(requestServices),
            Fx.toStream,
            Stream.encodeText,
          ),
          context,
        ) as Stream.Stream<Uint8Array, E, never>,
        { headers: htmlResponseHeaders },
      );
    }) as Effect.Effect<
      HttpServerResponse.HttpServerResponse,
      E,
      HttpRouterProvided
    >;

function makeSsrForHttp<E, R>(createResponse: SsrResponse<E, R>): {
  (input: Matcher<RenderEvent, E, R>): (router: HttpRouter) => SsrForHttpEffect<E, R>;
  (router: HttpRouter, input: Matcher<RenderEvent, E, R>): SsrForHttpEffect<E, R>;
} {
  return dual(2, (router: HttpRouter, input: Matcher<RenderEvent, E, R>) => {
    return Effect.gen(function* () {
      const matcher = Option.match(yield* Effect.serviceOption(CurrentRoute), {
        onNone: () => input,
        onSome: (parent: CurrentRouteTree) => input.prefix(parent.route),
      });
      const entries = compile(matcher.cases);
      const currentServices = yield* Effect.context<R>();
      const candidatesByPath = new Map<`/${string}`, Array<CompiledEntry>>();

      for (const entry of entries) {
        const path = getMatcherPath(entry.route.path);
        const candidates = candidatesByPath.get(path);
        if (candidates === undefined) {
          candidatesByPath.set(path, [entry]);
        } else {
          candidates.push(entry);
        }
      }

      yield* router.addAll(
        Array.from(candidatesByPath, ([path, candidates]) =>
          toRoute(path, candidates, currentServices, createResponse),
        ),
      );
    });
  });
}

function getMatcherPath(path: string): `/${string}` {
  const queryStart = path.search(/\?[^/?]+=/);
  return (queryStart < 0 ? path : path.slice(0, queryStart)) as `/${string}`;
}

/**
 * Registers buffered, GET-only HTML routes for a matcher.
 *
 * Path captures take precedence over same-named query parameters. Rendering
 * completes before the response is created; this adapter does not stream.
 */
export const ssrForHttp: {
  <E, R>(input: Matcher<RenderEvent, E, R>): (router: HttpRouter) => SsrForHttpEffect<E, R>;
  <E, R>(router: HttpRouter, input: Matcher<RenderEvent, E, R>): SsrForHttpEffect<E, R>;
} = makeSsrForHttp(bufferedResponse());

/**
 * Registers streaming, GET-only HTML routes for a matcher.
 *
 * Path captures take precedence over same-named query parameters. HTML chunks
 * are emitted as they are rendered via `renderToHtml` and `HttpServerResponse.stream`.
 */
export const streamingSsrForHttp: {
  <E, R>(input: Matcher<RenderEvent, E, R>): (router: HttpRouter) => SsrForHttpEffect<E, R>;
  <E, R>(router: HttpRouter, input: Matcher<RenderEvent, E, R>): SsrForHttpEffect<E, R>;
} = makeSsrForHttp(streamingResponse());

/**
 * Converts Effect HTTP server errors into empty 400, 404, or 500 responses.
 * Other failures remain in the global error channel.
 */
export function handleHttpServerError(router: HttpRouter) {
  return router.addGlobalMiddleware(
    Effect.catch((error: unknown) =>
      HttpServerError.isHttpServerError(error)
        ? Effect.succeed(HttpServerResponse.empty({ status: getStatus(error) }))
        : Effect.fail(error),
    ),
  );
}

function getStatus(error: HttpServerError.HttpServerError): number {
  const reason = error.reason;
  switch (reason._tag) {
    case "RouteNotFound":
      return 404;
    case "RequestParseError":
      return 400;
    case "InternalError":
    case "ResponseError":
      return 500;
    default: {
      const _exhaustive: never = reason;
      return 500;
    }
  }
}

function toRoute<E, R>(
  path: `/${string}`,
  candidates: ReadonlyArray<CompiledEntry>,
  currentServices: Context.Context<R>,
  createResponse: SsrResponse<E, R>,
): Route<E | HttpServerError.HttpServerError, HttpRouterProvided> {
  return {
    ["~effect/http/HttpRouter/Route"]: "~effect/http/HttpRouter/Route",
    method: "GET",
    path,
    handler: Effect.gen(function* () {
      const routeContext = yield* RouteContext;
      const request = yield* HttpServerRequest.HttpServerRequest;
      const searchParams = yield* HttpServerRequest.ParsedSearchParams;
      const requestUrl = Option.getOrElse(
        HttpServerRequest.toURL(request),
        () => new URL(request.url, "http://localhost"),
      );
      const provided = Layer.mergeAll(
        initialMemory({ url: requestUrl, origin: requestUrl.origin }).pipe(
          Layer.provide(Ids.Default),
        ),
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
      const input = { ...searchParams, ...routeContext.params };
      const requestServices = Context.merge(
        currentServices,
        yield* Effect.context<HttpRouterProvided>(),
      );
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

      return yield* createResponse(rendered, requestServices);
    }) as Effect.Effect<
      HttpServerResponse.HttpServerResponse,
      E | HttpServerError.HttpServerError,
      HttpRouterProvided
    >,
    uninterruptible: false,
    prefix: Option.none(),
  };
}

function hasTag<const Tag extends string>(
  value: unknown,
  tag: Tag,
): value is { readonly _tag: Tag } {
  return hasProperty(value, "_tag") && value._tag === tag;
}

function isRouteDecodeError(value: unknown): value is RouteDecodeError {
  return hasTag(value, "RouteDecodeError");
}

function isRouteGuardError(value: unknown): value is RouteGuardError {
  return hasTag(value, "RouteGuardError");
}
