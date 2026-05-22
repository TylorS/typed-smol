import type * as AST from "@typed/router/AST";
import * as Matcher from "@typed/router/Matcher";
import type * as Route from "@typed/router/Route";

type AnyMatcher = Matcher.Matcher<any, any, any>;
type AnyHandler = Matcher.MatchHandler<any, any, any, any>;
type AnyDependency = Matcher.AnyDependency | readonly Matcher.AnyDependency[];
type AnyLayer = Matcher.AnyLayer;

export interface RouteHandlers {
  readonly matcher: AnyMatcher;
  match<Rt extends Route.Route.Any, B, E = never, R = never>(
    route: Rt,
    handler: (params: any) => Matcher.MatchHandlerReturnValue<B, E, R>,
  ): RouteHandlers;
  match<Rt extends Route.Route.Any, B, E = never, R = never>(
    route: Rt,
    handler: Matcher.MatchHandlerReturnValue<B, E, R>,
  ): RouteHandlers;
  provide(dependencies: AnyDependency): RouteHandlers;
}

class RouteHandlersImpl implements RouteHandlers {
  constructor(readonly matcher: AnyMatcher) {}

  match(route: Route.Route.Any, handler: AnyHandler): RouteHandlers {
    return new RouteHandlersImpl(this.matcher.match(route, handler));
  }

  provide(dependencies: AnyDependency): RouteHandlers {
    return new RouteHandlersImpl(this.matcher.provide(normalizeDependencyInput(dependencies)));
  }
}

export const empty: RouteHandlers = new RouteHandlersImpl(Matcher.empty as unknown as AnyMatcher);
export const normalizeDependencyInput = Matcher.normalizeDependencyInput;

export function apply<A, E, R>(
  matcher: Matcher.Matcher<A, E, R>,
  handlers: RouteHandlers,
): Matcher.Matcher<A, E, R> {
  const handlerByRoute = collectHandlersByRoute(handlers.matcher.cases);
  if (handlerByRoute.size === 0) return matcher;
  const combined = makeMatcher(
    matcher.cases.map((match) => overlayHandlers(match, handlerByRoute)),
  );
  const dependencies = collectDependencies(handlers.matcher.cases);
  return (
    dependencies.length === 0
      ? combined
      : combined.provide(...(dependencies as readonly [AnyLayer, ...AnyLayer[]]))
  ) as Matcher.Matcher<A, E, R>;
}

export function merge(...handlers: readonly RouteHandlers[]): RouteHandlers {
  return new RouteHandlersImpl(
    Matcher.merge(...handlers.map((handler) => handler.matcher)) as AnyMatcher,
  );
}

export const RouteHandlers = {
  empty,
  apply,
  merge,
  normalizeDependencyInput,
};

function collectHandlersByRoute(matches: readonly AST.MatchAst[]): Map<AST.RouteAst, AnyHandler> {
  const out = new Map<AST.RouteAst, AnyHandler>();
  const visit = (match: AST.MatchAst): void => {
    switch (match.type) {
      case "route":
        out.set(match.route, match.handler);
        break;
      case "layer":
      case "layout":
      case "prefixed":
      case "catch":
        match.matches.forEach(visit);
        break;
    }
  };
  matches.forEach(visit);
  return out;
}

function overlayHandlers(
  match: AST.MatchAst,
  handlers: ReadonlyMap<AST.RouteAst, AnyHandler>,
): AST.MatchAst {
  switch (match.type) {
    case "route": {
      const handler = handlers.get(match.route);
      return handler === undefined ? match : { ...match, handler };
    }
    case "layer":
    case "layout":
    case "prefixed":
    case "catch":
      return {
        ...match,
        matches: match.matches.map((child) => overlayHandlers(child, handlers)),
      } as AST.MatchAst;
  }
}

function collectDependencies(matches: readonly AST.MatchAst[]): readonly AnyLayer[] {
  const out: AnyLayer[] = [];
  const visit = (match: AST.MatchAst): void => {
    switch (match.type) {
      case "layer":
        out.push(...match.deps);
        match.matches.forEach(visit);
        break;
      case "layout":
      case "prefixed":
      case "catch":
        match.matches.forEach(visit);
        break;
      case "route":
        break;
    }
  };
  matches.forEach(visit);
  return out;
}

function makeMatcher<A, E, R>(cases: readonly AST.MatchAst[]): Matcher.Matcher<A, E, R> {
  const prototype = Object.getPrototypeOf(Matcher.empty);
  return Object.create(prototype, {
    cases: {
      configurable: true,
      enumerable: true,
      value: cases,
      writable: false,
    },
  }) as Matcher.Matcher<A, E, R>;
}
