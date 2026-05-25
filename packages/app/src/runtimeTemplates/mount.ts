import type { CompiledDomTemplate, RuntimeTemplateFallback } from "@typed/compiler";
import { type Fx, Fx as FxRuntime } from "@typed/fx";
import {
  DomRenderTemplate,
  render,
  type Renderable,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Scope from "effect/Scope";
import {
  emptyValues,
  type DomRuntimeTemplate,
  type MountedApp,
  type MountOptions,
} from "./RuntimeTemplate.js";
import { isCompiledDomTemplate, isTemplateFallback } from "./internal.js";

export function mount<Values extends ReadonlyArray<Renderable.Any>>(
  template: CompiledDomTemplate | RuntimeTemplateFallback<Values>,
  options: MountOptions<Values>,
): Effect.Effect<
  MountedApp,
  Renderable.Error<Values[number]>,
  Exclude<Renderable.Services<Values[number]>, RenderTemplate>
>;
export function mount<E, R>(
  template: Fx.Fx<RenderEvent, E, R>,
  options: MountOptions,
): Effect.Effect<MountedApp, E, Exclude<R, RenderTemplate>>;
export function mount<Values extends ReadonlyArray<Renderable.Any>, E, R>(
  template: DomRuntimeTemplate<Values> | Fx.Fx<RenderEvent, E, R>,
  options: MountOptions<Values>,
): Effect.Effect<
  MountedApp,
  Renderable.Error<Values[number]> | E,
  Exclude<Renderable.Services<Values[number]> | R, RenderTemplate>
> {
  if (isCompiledDomTemplate(template)) return mountCompiled(template, options);
  if (isTemplateFallback(template)) return mountFallback(template, options);
  if (FxRuntime.isFx(template)) return mountFx(template, options);
  return Effect.die(new TypeError("Expected a DOM runtime template"));
}

function mountCompiled<Values extends ReadonlyArray<Renderable.Any>>(
  template: CompiledDomTemplate,
  options: MountOptions<Values>,
): Effect.Effect<MountedApp> {
  return Effect.promise(async () => {
    const nodes = await template.renderInto(options.root, options.values ?? emptyValues());
    return mountedApp(options.root, nodes);
  });
}

function mountFallback<Values extends ReadonlyArray<Renderable.Any>>(
  template: RuntimeTemplateFallback<Values>,
  options: MountOptions<Values>,
): Effect.Effect<
  MountedApp,
  Renderable.Error<Values[number]>,
  Exclude<Renderable.Services<Values[number]>, RenderTemplate>
> {
  return mountRenderedFx(
    template.render(...(options.values ?? emptyValues())),
    options,
  ) as Effect.Effect<
    MountedApp,
    Renderable.Error<Values[number]>,
    Exclude<Renderable.Services<Values[number]>, RenderTemplate>
  >;
}

function mountFx<E, R>(
  fx: Fx.Fx<RenderEvent, E, R>,
  options: MountOptions,
): Effect.Effect<MountedApp, E, Exclude<R, RenderTemplate>> {
  return mountRenderedFx(fx, options) as Effect.Effect<MountedApp, E, Exclude<R, RenderTemplate>>;
}

function mountRenderedFx<E, R>(
  fx: Fx.Fx<RenderEvent, E, R>,
  options: MountOptions,
): Effect.Effect<MountedApp, E, Exclude<R, RenderTemplate | Scope.Scope>> {
  return Effect.gen(function* () {
    const scope = yield* Scope.make();
    yield* render(fx, options.root).pipe(
      FxRuntime.provide(DomRenderTemplate.using(options.root.ownerDocument)),
      FxRuntime.take(1),
      FxRuntime.collectAll,
      Effect.provideService(Scope.Scope, scope),
      Effect.onExit((exit) => Scope.close(scope, exit)),
    );
    return mountedApp(options.root, Array.from(options.root.childNodes), scope);
  }) as Effect.Effect<MountedApp, E, Exclude<R, RenderTemplate | Scope.Scope>>;
}

function mountedApp(root: HTMLElement, nodes: readonly Node[], scope?: Scope.Scope): MountedApp {
  return {
    root,
    nodes,
    dispose: Effect.gen(function* () {
      if (scope) yield* Scope.close(scope, Exit.void);
      root.replaceChildren();
    }),
  };
}
