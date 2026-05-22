import {
  analyzeComponentHmr,
  analyzeDependencyHmr,
  analyzeTemplate,
  emitDomTemplate,
  emitServerTemplate,
  planViteHmrBoundary,
} from "@typed/compiler";
import { RefSubject } from "@typed/fx";
import * as Effect from "effect/Effect";
import { getOrCreateHmrState } from "./runtimeTemplates/hmrRegistry.js";
import { hydrate } from "./runtimeTemplates/hydrate.js";
import { renderServer } from "./runtimeTemplates/renderServer.js";

export interface RuntimeTemplateCompilerExampleOptions {
  readonly globalObject?: Record<PropertyKey, unknown>;
  readonly root: HTMLElement;
}

export interface RuntimeTemplateCompilerExampleResult {
  readonly domHtml: string;
  readonly hmrServiceIds: readonly string[];
  readonly hmrStateReused: boolean;
  readonly serverHtml: string;
}

const Count = RefSubject.Service<unknown, number>()("@example/runtime-template-compiler/Count");

export async function runRuntimeTemplateCompilerExample(
  options: RuntimeTemplateCompilerExampleOptions,
): Promise<RuntimeTemplateCompilerExampleResult> {
  const template = strings("<main><p>Count: ", "</p></main>");
  const plan = analyzeTemplate(template);
  const server = await Effect.runPromise(renderServer(emitServerTemplate(plan), { values: [1] }));

  await Effect.runPromise(hydrate(emitDomTemplate(plan), { root: options.root, values: [1] }));
  const hmr = routeHmrPlan("Count: ${count}");
  const nextHmr = routeHmrPlan("Total: ${count}");
  const state = getExampleHmrState(hmr.services[0], options.globalObject, 1);
  const reloaded = getExampleHmrState(nextHmr.services[0], options.globalObject, 2);

  return {
    domHtml: options.root.innerHTML,
    hmrServiceIds: hmr.services.map((service) => service.serviceId),
    hmrStateReused: state === reloaded,
    serverHtml: server.html,
  };
}

const strings = (...values: readonly string[]): TemplateStringsArray =>
  Object.assign([...values], { raw: [...values] }) as unknown as TemplateStringsArray;

function getExampleHmrState(
  descriptor: Parameters<typeof getOrCreateHmrState>[0] | undefined,
  globalObject: Record<PropertyKey, unknown> | undefined,
  count: number,
) {
  if (!descriptor) return { count };
  return getOrCreateHmrState(descriptor, () => ({ count, serviceId: Count.id }), { globalObject });
}

function routeHmrPlan(routeText: string) {
  const route = analyzeComponentHmr({
    boundary: "route-component",
    moduleId: "/examples/runtime-template-compiler/route.tsx",
    sourceText: `
      const Count = RefSubject.Service<number>()("${Count.id}");
      export const Counter = Fx.gen(function*() {
        const count = yield* Count.service;
        return html\`<button>${routeText}</button>\`;
      });
    `,
  });
  const dependencies = analyzeDependencyHmr({
    dependencies: [
      {
        moduleId: "/examples/runtime-template-compiler/state.ts",
        reason: "imported",
        sourceText: `export const Count = RefSubject.Service<number>()("${Count.id}");`,
      },
    ],
    routeModuleId: "/examples/runtime-template-compiler/route.tsx",
  });

  return planViteHmrBoundary({ dependencies, route });
}
