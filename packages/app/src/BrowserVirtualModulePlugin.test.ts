import type { VirtualModuleBuildError } from "@typed/virtual-modules";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createBrowserVirtualModulePlugin } from "./index.js";
import { typeCheckGeneratedSource } from "./test-utils/generatedSourceHarness.js";

const tempDirs: string[] = [];

function createFixture(files: Readonly<Record<string, string>> = {}) {
  const root = mkdtempSync(join(process.cwd(), "tmp-browser-vm-"));
  tempDirs.push(root);
  const src = join(root, "src");
  mkdirSync(src, { recursive: true });
  const importer = join(src, "entry.browser.ts");
  writeFileSync(importer, "export {};", "utf8");
  for (const [path, text] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(join(target, ".."), { recursive: true });
    writeFileSync(target, text, "utf8");
  }
  return { root, importer };
}

const buildBrowser = (id: string, importer = createFixture().importer) =>
  createBrowserVirtualModulePlugin().build(id, importer, {} as never);

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir && existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
});

describe("BrowserVirtualModulePlugin", () => {
  it("resolves valid typed:browser ids", () => {
    const plugin = createBrowserVirtualModulePlugin();

    expect(plugin.shouldResolve("typed:browser?routes=*", "/project/src/entry.ts")).toBe(true);
    expect(plugin.shouldResolve("typed:browser?mode=hydrate", "/project/src/entry.ts")).toBe(false);
    expect(plugin.shouldResolve("typed:server?routes=./routes", "/project/src/entry.ts")).toBe(
      false,
    );
  });

  it("uses configured runtime defaults for bare typed:browser ids", () => {
    const plugin = createBrowserVirtualModulePlugin({
      runtimeDefaults: {
        base: "/app",
        mode: "mpa",
        name: "web",
        root: "#shell",
        routes: ["./pages"],
      },
    });

    expect(plugin.shouldResolve("typed:browser", "/project/src/entry.ts")).toBe(true);
    expect(plugin.build("typed:browser", "/project/src/entry.ts", {} as never))
      .toMatchInlineSnapshot(`
        "import * as Cause from "effect/Cause";
        import * as Effect from "effect/Effect";
        import * as Layer from "effect/Layer";
        import { composeWithLayers, type ComputeLayers, type LayerOrGroup } from "@typed/app/internal/appLayerTypes";
        import { createAppDomTemplateRuntime } from "@typed/app/runtime/domTemplateRuntime";
        import { mount as mountRuntime } from "@typed/app/runtime/mount";
        import * as TypedRouter from "@typed/router";
        import Routes0 from "typed:router?dir=./pages";
        type BrowserLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;
        type BrowserLayerInputs = readonly LayerOrGroup[];
        type BrowserBaseLayer = ReturnType<typeof makeRenderLayer>;
        type BrowserCompanionLayers = typeof companionLayers;
        type BrowserAllLayers<Layers extends BrowserLayerInputs> = readonly [...BrowserCompanionLayers, ...Layers];
        type BrowserLayerWith<Layers extends BrowserLayerInputs> = ComputeLayers<BrowserAllLayers<Layers>, BrowserBaseLayer>;
        type BrowserHydratedLayer<Layers extends BrowserLayerInputs> = BrowserLayerWith<Layers>;
        type BrowserRunEffect<Layers extends BrowserLayerInputs> = Effect.Effect<never, Layer.Error<BrowserHydratedLayer<Layers>>, Layer.Services<BrowserHydratedLayer<Layers>>>;
        type BrowserErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;
        interface BrowserOptions<Layers extends BrowserLayerInputs = readonly []> {
          readonly window?: Window;
          readonly root?: string | HTMLElement;
          readonly layers?: Layers;
          readonly onError?: BrowserErrorHandler<Layer.Error<BrowserLayerWith<Layers>>>;
        }
        type BrowserOptionsWithLayers<Layers extends BrowserLayerInputs> = BrowserOptions<Layers> & { readonly layers: Layers };
        const routeModules = [Routes0];
        const companionLayers = [] as const;
        const companionOnError = undefined;
        export const Routes = Routes0;
        export const BrowserRuntime = {
          routeModules,
          root: "#shell",
          base: "/app",
          mode: "mpa",
          name: "web",
          companionLayers,
        };
        function makeRenderLayer(win: Window, root: HTMLElement, options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs>) {
          const domRuntime = createAppDomTemplateRuntime();
          return Layer.effectDiscard(mountRuntime(Routes, { root, runtime: domRuntime })).pipe(
            Layer.provideMerge(TypedRouter.BrowserRouter(win)),
          );
        }
        export function hydrate(options?: BrowserOptions<readonly []>): BrowserLayerWith<readonly []>;
        export function hydrate<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): BrowserLayerWith<Layers>;
        export function hydrate(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserHydratedLayer<BrowserLayerInputs> {
          return hydrateFromOptions(options);
        }
        function hydrateFromOptions(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs>) {
          const win = options.window ?? window;
          const root = resolveRoot(options.root ?? BrowserRuntime.root, win.document);
          const renderLayer = makeRenderLayer(win, root, options);
          return options.layers === undefined ? renderLayer : composeWithLayers(renderLayer, options.layers);
        }
        export function run(options?: BrowserOptions<readonly []>): BrowserRunEffect<readonly []>;
        export function run<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<BrowserLayerWith<Layers>>, Layer.Services<BrowserLayerWith<Layers>>>;
        export function run(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserRunEffect<BrowserLayerInputs> {
          const BrowserLayer = hydrateFromOptions(options);
          const program = withErrorHandling(Layer.launch(BrowserLayer), options.onError);
          return program;
        }
        function resolveRoot(root: string | HTMLElement, document: Document): HTMLElement {
          if (typeof root !== "string") return root;
          const element = document.querySelector(root);
          if (element instanceof HTMLElement) return element;
          throw new Error(\`typed:browser root not found: \${root}\`);
        }
        function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: BrowserErrorHandler<E> | undefined): Effect.Effect<A, E, R> {
          const handler = onError ?? companionOnError;
          return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;
        }
        function callErrorHandler<E>(handler: BrowserErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {
          const result = handler(cause);
          return Effect.isEffect(result) ? result : Effect.void;
        }"
      `);
  });

  it("emits composable run, hydrate, and BrowserRuntime exports for wildcard routes", () => {
    const source = buildBrowser("typed:browser?routes=*") as string;

    expect(source).toMatchInlineSnapshot(`
      "import * as Cause from "effect/Cause";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import { composeWithLayers, type ComputeLayers, type LayerOrGroup } from "@typed/app/internal/appLayerTypes";
      import { createAppDomTemplateRuntime } from "@typed/app/runtime/domTemplateRuntime";
      import { mount as mountRuntime } from "@typed/app/runtime/mount";
      import * as TypedRouter from "@typed/router";
      import Routes0 from "typed:router?dir=*";
      type BrowserLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;
      type BrowserLayerInputs = readonly LayerOrGroup[];
      type BrowserBaseLayer = ReturnType<typeof makeRenderLayer>;
      type BrowserCompanionLayers = typeof companionLayers;
      type BrowserAllLayers<Layers extends BrowserLayerInputs> = readonly [...BrowserCompanionLayers, ...Layers];
      type BrowserLayerWith<Layers extends BrowserLayerInputs> = ComputeLayers<BrowserAllLayers<Layers>, BrowserBaseLayer>;
      type BrowserHydratedLayer<Layers extends BrowserLayerInputs> = BrowserLayerWith<Layers>;
      type BrowserRunEffect<Layers extends BrowserLayerInputs> = Effect.Effect<never, Layer.Error<BrowserHydratedLayer<Layers>>, Layer.Services<BrowserHydratedLayer<Layers>>>;
      type BrowserErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;
      interface BrowserOptions<Layers extends BrowserLayerInputs = readonly []> {
        readonly window?: Window;
        readonly root?: string | HTMLElement;
        readonly layers?: Layers;
        readonly onError?: BrowserErrorHandler<Layer.Error<BrowserLayerWith<Layers>>>;
      }
      type BrowserOptionsWithLayers<Layers extends BrowserLayerInputs> = BrowserOptions<Layers> & { readonly layers: Layers };
      const routeModules = [Routes0];
      const companionLayers = [] as const;
      const companionOnError = undefined;
      export const Routes = Routes0;
      export const BrowserRuntime = {
        routeModules,
        root: "#typed-root",
        base: "/",
        name: undefined,
        companionLayers,
      };
      function makeRenderLayer(win: Window, root: HTMLElement, options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs>) {
        const domRuntime = createAppDomTemplateRuntime();
        return Layer.effectDiscard(mountRuntime(Routes, { root, runtime: domRuntime })).pipe(
          Layer.provideMerge(TypedRouter.BrowserRouter(win)),
        );
      }
      export function hydrate(options?: BrowserOptions<readonly []>): BrowserLayerWith<readonly []>;
      export function hydrate<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): BrowserLayerWith<Layers>;
      export function hydrate(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserHydratedLayer<BrowserLayerInputs> {
        return hydrateFromOptions(options);
      }
      function hydrateFromOptions(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs>) {
        const win = options.window ?? window;
        const root = resolveRoot(options.root ?? BrowserRuntime.root, win.document);
        const renderLayer = makeRenderLayer(win, root, options);
        return options.layers === undefined ? renderLayer : composeWithLayers(renderLayer, options.layers);
      }
      export function run(options?: BrowserOptions<readonly []>): BrowserRunEffect<readonly []>;
      export function run<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<BrowserLayerWith<Layers>>, Layer.Services<BrowserLayerWith<Layers>>>;
      export function run(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserRunEffect<BrowserLayerInputs> {
        const BrowserLayer = hydrateFromOptions(options);
        const program = withErrorHandling(Layer.launch(BrowserLayer), options.onError);
        return program;
      }
      function resolveRoot(root: string | HTMLElement, document: Document): HTMLElement {
        if (typeof root !== "string") return root;
        const element = document.querySelector(root);
        if (element instanceof HTMLElement) return element;
        throw new Error(\`typed:browser root not found: \${root}\`);
      }
      function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: BrowserErrorHandler<E> | undefined): Effect.Effect<A, E, R> {
        const handler = onError ?? companionOnError;
        return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;
      }
      function callErrorHandler<E>(handler: BrowserErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {
        const result = handler(cause);
        return Effect.isEffect(result) ? result : Effect.void;
      }"
    `);
  });

  it("keeps devtools imports out of the default browser virtual module", () => {
    const source = buildBrowser("typed:browser?routes=*") as string;

    expect(source).not.toContain("installTypedDevtoolsBridge");
    expect(source).not.toContain("makeDomRegistry");
    expect(source).not.toContain("makeDevtoolsRuntime");
    expect(source).not.toContain("devtools?: boolean");
    expect(source).toContain("createAppDomTemplateRuntime()");
  });

  it("emits devtools instrumentation only for explicit browser devtools modules", () => {
    const source = buildBrowser("typed:browser?routes=*&devtools=1") as string;

    expect(source).toContain(
      'import Routes0, { __typedDevtoolsComponentSummaries as Routes0DevtoolsComponentSummaries } from "typed:router?dir=*&devtools=1";',
    );
    expect(source).toContain("installTypedDevtoolsBridge");
    expect(source).toContain("makeDevtoolsRuntime");
    expect(source).toContain("makeDomRegistry");
    expect(source).toContain("const devtoolsRuntime = makeDevtoolsRuntime({ enabled: true });");
    expect(source).toContain("const domRegistry = makeDomRegistry({ runtime: devtoolsRuntime });");
    expect(source).toContain(
      "  for (const component of [...Routes0DevtoolsComponentSummaries]) domRegistry.registerComponent(component as unknown as Parameters<typeof domRegistry.registerComponent>[0]);",
    );
    expect(source).toContain("runtime: devtoolsRuntime");
    expect(source).toContain("devtools: { enabled: true, domRegistry }");
  });

  it("allows runtime defaults to select the devtools browser module", () => {
    const plugin = createBrowserVirtualModulePlugin({
      runtimeDefaults: { devtools: true, routes: ["./routes"] },
    });
    const source = plugin.build("typed:browser", "/project/src/entry.ts", {} as never);

    expect(source).toContain("installTypedDevtoolsBridge");
    expect(source).toContain("makeDomRegistry");
  });

  it("type-checks generated browser entry source without ts-nocheck", () => {
    const fixture = createFixture({
      "src/routes.ts": "const routes: any = {};\nexport default routes;\n",
      "src/typed-app.d.ts": [
        'declare module "@typed/app/internal/appLayerTypes" {',
        '  import type * as Effect from "effect/Effect";',
        '  import type * as Layer from "effect/Layer";',
        "  export type LayerAny = Layer.Any;",
        "  export type LayerOrGroup = LayerAny;",
        "  export type ComputeLayers<Layers extends ReadonlyArray<LayerOrGroup>, Base extends LayerAny> = Base;",
        "  export function composeWithLayers<Base extends LayerAny, const Layers extends ReadonlyArray<LayerOrGroup>>(base: Base, layers?: Layers): ComputeLayers<Layers, Base>;",
        "}",
        'declare module "@typed/app/runtime/domTemplateRuntime" {',
        "  export function createAppDomTemplateRuntime(options?: unknown): unknown;",
        "}",
        'declare module "@typed/app/runtime/mount" {',
        '  import type * as Effect from "effect/Effect";',
        "  export function mount(input: any, options: { readonly root: HTMLElement; readonly runtime?: unknown }): Effect.Effect<unknown, never, never>;",
        "}",
      ].join("\n"),
    });
    const source = buildBrowser("typed:browser?routes=./routes", fixture.importer) as string;
    const result = typeCheckGeneratedSource({
      rootDir: fixture.root,
      generatedPath: "src/generated.browser.ts",
      sourceText: source,
      rootFiles: [
        fixture.importer,
        join(fixture.root, "src/routes.ts"),
        join(fixture.root, "src/typed-app.d.ts"),
      ],
      moduleFallbacks: {
        "typed:router?dir=./routes": join(fixture.root, "src/routes.ts"),
        "@typed/app/internal/appLayerTypes": join(fixture.root, "src/typed-app.d.ts"),
        "@typed/app/runtime/domTemplateRuntime": join(fixture.root, "src/typed-app.d.ts"),
        "@typed/app/runtime/mount": join(fixture.root, "src/typed-app.d.ts"),
      },
    });

    expect(result.diagnostics).toEqual([]);
  });

  it("emits repeated explicit route imports in source order", () => {
    const source = buildBrowser("typed:browser?routes=./main&routes=./admin") as string;

    expect(source.indexOf('import Routes0 from "typed:router?dir=./main";')).toBeLessThan(
      source.indexOf('import Routes1 from "typed:router?dir=./admin";'),
    );
    expect(source).toMatchInlineSnapshot(`
      "import * as Cause from "effect/Cause";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import { composeWithLayers, type ComputeLayers, type LayerOrGroup } from "@typed/app/internal/appLayerTypes";
      import { createAppDomTemplateRuntime } from "@typed/app/runtime/domTemplateRuntime";
      import { mount as mountRuntime } from "@typed/app/runtime/mount";
      import * as TypedRouter from "@typed/router";
      import Routes0 from "typed:router?dir=./main";
      import Routes1 from "typed:router?dir=./admin";
      type BrowserLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;
      type BrowserLayerInputs = readonly LayerOrGroup[];
      type BrowserBaseLayer = ReturnType<typeof makeRenderLayer>;
      type BrowserCompanionLayers = typeof companionLayers;
      type BrowserAllLayers<Layers extends BrowserLayerInputs> = readonly [...BrowserCompanionLayers, ...Layers];
      type BrowserLayerWith<Layers extends BrowserLayerInputs> = ComputeLayers<BrowserAllLayers<Layers>, BrowserBaseLayer>;
      type BrowserHydratedLayer<Layers extends BrowserLayerInputs> = BrowserLayerWith<Layers>;
      type BrowserRunEffect<Layers extends BrowserLayerInputs> = Effect.Effect<never, Layer.Error<BrowserHydratedLayer<Layers>>, Layer.Services<BrowserHydratedLayer<Layers>>>;
      type BrowserErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;
      interface BrowserOptions<Layers extends BrowserLayerInputs = readonly []> {
        readonly window?: Window;
        readonly root?: string | HTMLElement;
        readonly layers?: Layers;
        readonly onError?: BrowserErrorHandler<Layer.Error<BrowserLayerWith<Layers>>>;
      }
      type BrowserOptionsWithLayers<Layers extends BrowserLayerInputs> = BrowserOptions<Layers> & { readonly layers: Layers };
      const routeModules = [Routes0, Routes1];
      const companionLayers = [] as const;
      const companionOnError = undefined;
      export const Routes = TypedRouter.merge(Routes0, Routes1);
      export const BrowserRuntime = {
        routeModules,
        root: "#typed-root",
        base: "/",
        name: undefined,
        companionLayers,
      };
      function makeRenderLayer(win: Window, root: HTMLElement, options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs>) {
        const domRuntime = createAppDomTemplateRuntime();
        return Layer.effectDiscard(mountRuntime(Routes, { root, runtime: domRuntime })).pipe(
          Layer.provideMerge(TypedRouter.BrowserRouter(win)),
        );
      }
      export function hydrate(options?: BrowserOptions<readonly []>): BrowserLayerWith<readonly []>;
      export function hydrate<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): BrowserLayerWith<Layers>;
      export function hydrate(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserHydratedLayer<BrowserLayerInputs> {
        return hydrateFromOptions(options);
      }
      function hydrateFromOptions(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs>) {
        const win = options.window ?? window;
        const root = resolveRoot(options.root ?? BrowserRuntime.root, win.document);
        const renderLayer = makeRenderLayer(win, root, options);
        return options.layers === undefined ? renderLayer : composeWithLayers(renderLayer, options.layers);
      }
      export function run(options?: BrowserOptions<readonly []>): BrowserRunEffect<readonly []>;
      export function run<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<BrowserLayerWith<Layers>>, Layer.Services<BrowserLayerWith<Layers>>>;
      export function run(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserRunEffect<BrowserLayerInputs> {
        const BrowserLayer = hydrateFromOptions(options);
        const program = withErrorHandling(Layer.launch(BrowserLayer), options.onError);
        return program;
      }
      function resolveRoot(root: string | HTMLElement, document: Document): HTMLElement {
        if (typeof root !== "string") return root;
        const element = document.querySelector(root);
        if (element instanceof HTMLElement) return element;
        throw new Error(\`typed:browser root not found: \${root}\`);
      }
      function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: BrowserErrorHandler<E> | undefined): Effect.Effect<A, E, R> {
        const handler = onError ?? companionOnError;
        return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;
      }
      function callErrorHandler<E>(handler: BrowserErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {
        const result = handler(cause);
        return Effect.isEffect(result) ? result : Effect.void;
      }"
    `);
  });

  it("emits root, base, mode, and name options", () => {
    const source = buildBrowser(
      "typed:browser?routes=./routes&root=%23shell&base=/admin&mode=mpa&name=admin",
    ) as string;

    expect(source).toMatchInlineSnapshot(`
      "import * as Cause from "effect/Cause";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import { composeWithLayers, type ComputeLayers, type LayerOrGroup } from "@typed/app/internal/appLayerTypes";
      import { createAppDomTemplateRuntime } from "@typed/app/runtime/domTemplateRuntime";
      import { mount as mountRuntime } from "@typed/app/runtime/mount";
      import * as TypedRouter from "@typed/router";
      import Routes0 from "typed:router?dir=./routes";
      type BrowserLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;
      type BrowserLayerInputs = readonly LayerOrGroup[];
      type BrowserBaseLayer = ReturnType<typeof makeRenderLayer>;
      type BrowserCompanionLayers = typeof companionLayers;
      type BrowserAllLayers<Layers extends BrowserLayerInputs> = readonly [...BrowserCompanionLayers, ...Layers];
      type BrowserLayerWith<Layers extends BrowserLayerInputs> = ComputeLayers<BrowserAllLayers<Layers>, BrowserBaseLayer>;
      type BrowserHydratedLayer<Layers extends BrowserLayerInputs> = BrowserLayerWith<Layers>;
      type BrowserRunEffect<Layers extends BrowserLayerInputs> = Effect.Effect<never, Layer.Error<BrowserHydratedLayer<Layers>>, Layer.Services<BrowserHydratedLayer<Layers>>>;
      type BrowserErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;
      interface BrowserOptions<Layers extends BrowserLayerInputs = readonly []> {
        readonly window?: Window;
        readonly root?: string | HTMLElement;
        readonly layers?: Layers;
        readonly onError?: BrowserErrorHandler<Layer.Error<BrowserLayerWith<Layers>>>;
      }
      type BrowserOptionsWithLayers<Layers extends BrowserLayerInputs> = BrowserOptions<Layers> & { readonly layers: Layers };
      const routeModules = [Routes0];
      const companionLayers = [] as const;
      const companionOnError = undefined;
      export const Routes = Routes0;
      export const BrowserRuntime = {
        routeModules,
        root: "#shell",
        base: "/admin",
        mode: "mpa",
        name: "admin",
        companionLayers,
      };
      function makeRenderLayer(win: Window, root: HTMLElement, options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs>) {
        const domRuntime = createAppDomTemplateRuntime();
        return Layer.effectDiscard(mountRuntime(Routes, { root, runtime: domRuntime })).pipe(
          Layer.provideMerge(TypedRouter.BrowserRouter(win)),
        );
      }
      export function hydrate(options?: BrowserOptions<readonly []>): BrowserLayerWith<readonly []>;
      export function hydrate<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): BrowserLayerWith<Layers>;
      export function hydrate(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserHydratedLayer<BrowserLayerInputs> {
        return hydrateFromOptions(options);
      }
      function hydrateFromOptions(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs>) {
        const win = options.window ?? window;
        const root = resolveRoot(options.root ?? BrowserRuntime.root, win.document);
        const renderLayer = makeRenderLayer(win, root, options);
        return options.layers === undefined ? renderLayer : composeWithLayers(renderLayer, options.layers);
      }
      export function run(options?: BrowserOptions<readonly []>): BrowserRunEffect<readonly []>;
      export function run<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<BrowserLayerWith<Layers>>, Layer.Services<BrowserLayerWith<Layers>>>;
      export function run(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserRunEffect<BrowserLayerInputs> {
        const BrowserLayer = hydrateFromOptions(options);
        const program = withErrorHandling(Layer.launch(BrowserLayer), options.onError);
        return program;
      }
      function resolveRoot(root: string | HTMLElement, document: Document): HTMLElement {
        if (typeof root !== "string") return root;
        const element = document.querySelector(root);
        if (element instanceof HTMLElement) return element;
        throw new Error(\`typed:browser root not found: \${root}\`);
      }
      function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: BrowserErrorHandler<E> | undefined): Effect.Effect<A, E, R> {
        const handler = onError ?? companionOnError;
        return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;
      }
      function callErrorHandler<E>(handler: BrowserErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {
        const result = handler(cause);
        return Effect.isEffect(result) ? result : Effect.void;
      }"
    `);
  });

  it("imports entry-adjacent named browser companions when present", () => {
    const fixture = createFixture({
      "src/.browser.dependencies.ts": "export const layers = [];",
      "src/.navigation.ts": "export const onNavigation = () => undefined;",
      "src/.errors.ts": "export const onError = () => undefined;",
    });
    const source = buildBrowser("typed:browser?routes=./routes", fixture.importer) as string;

    expect(source).toMatchInlineSnapshot(`
      "import * as Cause from "effect/Cause";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import { composeWithLayers, type ComputeLayers, type LayerOrGroup } from "@typed/app/internal/appLayerTypes";
      import { createAppDomTemplateRuntime } from "@typed/app/runtime/domTemplateRuntime";
      import { mount as mountRuntime } from "@typed/app/runtime/mount";
      import * as TypedRouter from "@typed/router";
      import Routes0 from "typed:router?dir=./routes";
      import * as BrowserDependenciesCompanion from "./.browser.dependencies.js";
      import * as BrowserNavigationCompanion from "./.navigation.js";
      import * as BrowserErrorsCompanion from "./.errors.js";
      type BrowserLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;
      type BrowserLayerInputs = readonly LayerOrGroup[];
      type BrowserBaseLayer = ReturnType<typeof makeRenderLayer>;
      type BrowserCompanionLayers = typeof companionLayers;
      type BrowserAllLayers<Layers extends BrowserLayerInputs> = readonly [...BrowserCompanionLayers, ...Layers];
      type BrowserLayerWith<Layers extends BrowserLayerInputs> = ComputeLayers<BrowserAllLayers<Layers>, BrowserBaseLayer>;
      type BrowserHydratedLayer<Layers extends BrowserLayerInputs> = BrowserLayerWith<Layers>;
      type BrowserRunEffect<Layers extends BrowserLayerInputs> = Effect.Effect<never, Layer.Error<BrowserHydratedLayer<Layers>>, Layer.Services<BrowserHydratedLayer<Layers>>>;
      type BrowserErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;
      interface BrowserOptions<Layers extends BrowserLayerInputs = readonly []> {
        readonly window?: Window;
        readonly root?: string | HTMLElement;
        readonly layers?: Layers;
        readonly onError?: BrowserErrorHandler<Layer.Error<BrowserLayerWith<Layers>>>;
      }
      type BrowserOptionsWithLayers<Layers extends BrowserLayerInputs> = BrowserOptions<Layers> & { readonly layers: Layers };
      const routeModules = [Routes0];
      const companionLayers = BrowserDependenciesCompanion.layers;
      const companionOnError = BrowserErrorsCompanion.onError ?? undefined;
      export const Routes = Routes0;
      export const BrowserRuntime = {
        routeModules,
        root: "#typed-root",
        base: "/",
        name: undefined,
        companionLayers,
      };
      function makeRenderLayer(win: Window, root: HTMLElement, options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs>) {
        const domRuntime = createAppDomTemplateRuntime();
        return Layer.effectDiscard(mountRuntime(Routes, { root, runtime: domRuntime })).pipe(
          Layer.provideMerge(TypedRouter.BrowserRouter(win)),
        );
      }
      export function hydrate(options?: BrowserOptions<readonly []>): BrowserLayerWith<readonly []>;
      export function hydrate<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): BrowserLayerWith<Layers>;
      export function hydrate(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserHydratedLayer<BrowserLayerInputs> {
        return hydrateFromOptions(options);
      }
      function hydrateFromOptions(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs>) {
        const win = options.window ?? window;
        const root = resolveRoot(options.root ?? BrowserRuntime.root, win.document);
        const renderLayer = makeRenderLayer(win, root, options);
        return composeWithLayers(renderLayer, [...companionLayers, ...(options.layers ?? [])] as BrowserAllLayers<BrowserLayerInputs>);
      }
      export function run(options?: BrowserOptions<readonly []>): BrowserRunEffect<readonly []>;
      export function run<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<BrowserLayerWith<Layers>>, Layer.Services<BrowserLayerWith<Layers>>>;
      export function run(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserRunEffect<BrowserLayerInputs> {
        const BrowserLayer = hydrateFromOptions(options);
        const program = withErrorHandling(Layer.launch(BrowserLayer), options.onError);
        return program;
      }
      function resolveRoot(root: string | HTMLElement, document: Document): HTMLElement {
        if (typeof root !== "string") return root;
        const element = document.querySelector(root);
        if (element instanceof HTMLElement) return element;
        throw new Error(\`typed:browser root not found: \${root}\`);
      }
      function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: BrowserErrorHandler<E> | undefined): Effect.Effect<A, E, R> {
        const handler = onError ?? companionOnError;
        return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;
      }
      function callErrorHandler<E>(handler: BrowserErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {
        const result = handler(cause);
        return Effect.isEffect(result) ? result : Effect.void;
      }"
    `);
  });

  it("returns parser diagnostics with the browser plugin name", () => {
    const result = buildBrowser("typed:browser?routes=*&mode=server") as VirtualModuleBuildError;

    expect(result.errors).toEqual([
      {
        code: "TVM-BROWSER-002",
        message: 'typed:browser mode must be one of "mount" or "mpa"',
        pluginName: "typed-browser-virtual-module",
      },
    ]);
  });
});
