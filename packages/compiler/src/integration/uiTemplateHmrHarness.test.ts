import { describe, expect, it } from "vitest";
import { planCompileCapabilities } from "../capabilities/compileCapabilities.js";
import { analyzeComponentHmr } from "../hmr/analyzeComponentHmr.js";
import { emitViteHmrRuntime, type ViteHmrServicePlan } from "../hmr/viteHmr.js";
import { transformTemplateModule } from "../template/transformTemplateModule.js";

describe("typed ui template and HMR integration harness", () => {
  it("optimizes templates and plans HMR state for routes rendering @typed/ui components", () => {
    const sourceText = routeSource({});
    const transformed = transformTemplateModule({ moduleId: routeModuleId, sourceText });
    const hmr = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: routeModuleId,
      sourceText,
    });
    const plan = planCompileCapabilities({
      boundary: "route-component",
      component: hmr,
      hmrVersion: "test",
      moduleId: routeModuleId,
      templates: transformed.analysis.templates.map((template) => template.plan),
    });
    const runtime = emitViteHmrRuntime({
      eligible: plan.hmr.eligible,
      moduleId: routeModuleId,
      rejected: plan.hmr.rejected,
      services: plan.hmr.services,
    });

    expect(transformed.transformed).toBe(true);
    expect(transformed.sourceText).toMatchInlineSnapshot(`
      "
          import { Fx } from "@typed/fx";
          import { html } from "@typed/template";
          import { Dialog, Select, State as UiState } from "@typed/ui";
      import * as __typedTemplateEffect from "effect/Effect";
      import { bindAttr, bindBoolean, bindClass, bindData, bindEvent, bindNode, bindProperty, bindRef, bindText, defineDomTemplate, getCommentAtPath, getElementAtPath, getNodeAtPath, mountDomTemplateBindings } from "@typed/template/compiler-runtime/dom";
      import { getOrCreateHmrState, getOrCreateHmrStateEffect, pruneHmrState, typedHmrRegistryKey, type HmrRegistryEntry } from "@typed/app/runtime/hmrRegistry";
      interface __TypedHot {
        readonly data: Record<string, unknown>;
        readonly accept: {
          (): void;
          (callback: (nextModule: Record<string, unknown> | undefined) => void): void;
        };
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      }
      declare global {
        interface ImportMeta {
          readonly hot?: __TypedHot;
        }
      }
      const __typedHmrDescriptors = [{"continuationFingerprints":[],"dependencyFingerprints":[],"moduleId":"/src/routes/ui.ts","serviceId":"/src/routes/ui.ts#select","shapeFingerprint":"inline-refsubject:select:Select.makeState({ id: \\"fruit-select\\" })","version":"1","compatibilityFingerprint":"{\\"continuationFingerprints\\":[],\\"dependencyFingerprints\\":[],\\"shapeFingerprint\\":\\"inline-refsubject:select:Select.makeState({ id: \\\\\\"fruit-select\\\\\\" })\\",\\"version\\":\\"1\\"}"},{"continuationFingerprints":[],"dependencyFingerprints":[],"moduleId":"/src/routes/ui.ts","serviceId":"@app/ui/DialogState","shapeFingerprint":"refsubject-service:DialogState:@app/ui/DialogState","version":"1","compatibilityFingerprint":"{\\"continuationFingerprints\\":[],\\"dependencyFingerprints\\":[],\\"shapeFingerprint\\":\\"refsubject-service:DialogState:@app/ui/DialogState\\",\\"version\\":\\"1\\"}"}];
      const __typedHmrModules = new Set(__typedHmrDescriptors.map((item) => item.moduleId));
      const __typedHot = import.meta.hot;
      function __typedHasDescriptor(entry: HmrRegistryEntry): boolean {
        return __typedHmrDescriptors.some((item) => item.moduleId === entry.moduleId && item.serviceId === entry.serviceId);
      }
      export function __typedGetHmrState<A>(serviceId: string, create: () => A): A {
        const descriptor = __typedHmrDescriptors.find((item) => item.serviceId === serviceId);
        return descriptor ? getOrCreateHmrState(descriptor, create, { hotData: __typedHot?.data }) : create();
      }
      export function __typedGetHmrStateEffect<A, E, R>(serviceId: string, create: () => import("effect/Effect").Effect<A, E, R>): import("effect/Effect").Effect<A, E, R> {
        const descriptor = __typedHmrDescriptors.find((item) => item.serviceId === serviceId);
        return descriptor ? getOrCreateHmrStateEffect(descriptor, create, { hotData: __typedHot?.data }) : create();
      }
      if (__typedHot && import.meta.hot) {
        import.meta.hot.accept();
        __typedHot.dispose((data) => {
          data[typedHmrRegistryKey] = (globalThis as Record<string, unknown>)[typedHmrRegistryKey];
          pruneHmrState((entry) => __typedHmrModules.has(entry.moduleId) && !__typedHasDescriptor(entry));
        });
      }
      const __typed_template_0 = defineDomTemplate({
        templateHash: "1KlYDOskl3w=",
        html: "<h1><!--n_0--></h1>",
        mount(instance, values, runtime) {
          return __typedTemplateEffect.all([bindNode(getCommentAtPath(instance.root, [
        0,
        0
      ]), values[0], "unknown", runtime)], { concurrency: "unbounded" });
        }
      });



          const DialogState = UiState.Service<Dialog.State>()("@app/ui/DialogState");
          const routeTitle = "Fruit";
          export const RouteShell = __typed_template_0(routeTitle);

          export const Route = Fx.gen(function*() {
            const dialog = yield* DialogState;
            const select = yield* __typedGetHmrStateEffect("/src/routes/ui.ts#select", () => Select.makeState({ id: "fruit-select" }));

            return html\`<main>
              <h1>Fruit</h1>
              \${Dialog.Trigger({ state: dialog, content: "Open" })}
              \${Dialog.Content({ state: dialog, label: "Dialog", content: "Body" })}
              \${Select.Trigger({ state: select, content: "Fruit" })}
              \${Select.Content({
                state: select,
                content: Select.Option({ state: select, id: "apple", value: "Apple", content: "Apple" }),
              })}
            </main>\`;
          });
        "
    `);
    expect(plan.templates).toHaveLength(2);
    expect(plan.templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ strategy: "optimized-html", targets: ["dom", "server"] }),
      ]),
    );
    expect(plan.hmr.services.map((service) => service.serviceId).sort()).toEqual([
      "@app/ui/DialogState",
      "/src/routes/ui.ts#select",
    ].sort());
    expect(runtime).toMatchInlineSnapshot(`
      "import { getOrCreateHmrState, getOrCreateHmrStateEffect, pruneHmrState, typedHmrRegistryKey, type HmrRegistryEntry } from "@typed/app/runtime/hmrRegistry";
      interface __TypedHot {
        readonly data: Record<string, unknown>;
        readonly accept: {
          (): void;
          (callback: (nextModule: Record<string, unknown> | undefined) => void): void;
        };
        readonly dispose: (callback: (data: Record<string, unknown>) => void) => void;
        readonly invalidate: (message?: string) => void;
      }
      declare global {
        interface ImportMeta {
          readonly hot?: __TypedHot;
        }
      }
      const __typedHmrDescriptors = [{"continuationFingerprints":[],"dependencyFingerprints":[],"moduleId":"/src/routes/ui.ts","serviceId":"/src/routes/ui.ts#select","shapeFingerprint":"inline-refsubject:select:Select.makeState({ id: \\"fruit-select\\" })","version":"test","compatibilityFingerprint":"{\\"continuationFingerprints\\":[],\\"dependencyFingerprints\\":[],\\"shapeFingerprint\\":\\"inline-refsubject:select:Select.makeState({ id: \\\\\\"fruit-select\\\\\\" })\\",\\"version\\":\\"test\\"}"},{"continuationFingerprints":[],"dependencyFingerprints":[],"moduleId":"/src/routes/ui.ts","serviceId":"@app/ui/DialogState","shapeFingerprint":"refsubject-service:DialogState:@app/ui/DialogState","version":"test","compatibilityFingerprint":"{\\"continuationFingerprints\\":[],\\"dependencyFingerprints\\":[],\\"shapeFingerprint\\":\\"refsubject-service:DialogState:@app/ui/DialogState\\",\\"version\\":\\"test\\"}"}];
      const __typedHmrModules = new Set(__typedHmrDescriptors.map((item) => item.moduleId));
      const __typedHot = import.meta.hot;
      function __typedHasDescriptor(entry: HmrRegistryEntry): boolean {
        return __typedHmrDescriptors.some((item) => item.moduleId === entry.moduleId && item.serviceId === entry.serviceId);
      }
      export function __typedGetHmrState<A>(serviceId: string, create: () => A): A {
        const descriptor = __typedHmrDescriptors.find((item) => item.serviceId === serviceId);
        return descriptor ? getOrCreateHmrState(descriptor, create, { hotData: __typedHot?.data }) : create();
      }
      export function __typedGetHmrStateEffect<A, E, R>(serviceId: string, create: () => import("effect/Effect").Effect<A, E, R>): import("effect/Effect").Effect<A, E, R> {
        const descriptor = __typedHmrDescriptors.find((item) => item.serviceId === serviceId);
        return descriptor ? getOrCreateHmrStateEffect(descriptor, create, { hotData: __typedHot?.data }) : create();
      }
      if (__typedHot && import.meta.hot) {
        import.meta.hot.accept();
        __typedHot.dispose((data) => {
          data[typedHmrRegistryKey] = (globalThis as Record<string, unknown>)[typedHmrRegistryKey];
          pruneHmrState((entry) => __typedHmrModules.has(entry.moduleId) && !__typedHasDescriptor(entry));
        });
      }"
    `);
  });

  it("preserves HMR state across markup-only updates and resets when UI state shape changes", () => {
    const first = planUiRoute(routeSource({ title: "Fruit" }));
    const markupOnly = planUiRoute(routeSource({ title: "Choose fruit" }));
    const stateShapeChanged = planUiRoute(routeSource({ selectedValue: "Apple", title: "Choose fruit" }));
    const store = new Map<string, StoreEntry>();

    const firstDialog = getFixtureState(service(first, "@app/ui/DialogState"), () => ({ open: true }), store);
    const firstSelect = getFixtureState(
      service(first, "/src/routes/ui.ts#select"),
      () => ({ value: "Banana" }),
      store,
    );
    const markupDialog = getFixtureState(
      service(markupOnly, "@app/ui/DialogState"),
      () => ({ open: false }),
      store,
    );
    const markupSelect = getFixtureState(
      service(markupOnly, "/src/routes/ui.ts#select"),
      () => ({ value: "Apple" }),
      store,
    );
    const changedSelect = getFixtureState(
      service(stateShapeChanged, "/src/routes/ui.ts#select"),
      () => ({ value: "Apple" }),
      store,
    );

    expect(markupDialog).toBe(firstDialog);
    expect(markupSelect).toBe(firstSelect);
    expect(changedSelect).not.toBe(firstSelect);
  });

  it("recognizes every @typed/ui state factory exported through the package namespace", () => {
    const hmr = analyzeComponentHmr({
      boundary: "route-component",
      moduleId: routeModuleId,
      sourceText: everyStateFactoryRouteSource(),
    });

    expect(hmr.services.map((service) => service.serviceId).sort()).toEqual(
      stateFactoryNames.map((name) => `${routeModuleId}#${stateLocalName(name)}`).sort(),
    );
  });
});

const routeModuleId = "/src/routes/ui.ts";

interface RouteSourceOptions {
  readonly selectedValue?: string;
  readonly title?: string;
}

interface StoreEntry {
  readonly fingerprint: string;
  readonly value: object;
}

function routeSource(options: RouteSourceOptions): string {
  const title = options.title ?? "Fruit";
  const selectedValue = options.selectedValue;
  const selectInitial = selectedValue
    ? `{ id: "fruit-select", value: "${selectedValue}" }`
    : `{ id: "fruit-select" }`;

  return `
    import { Fx } from "@typed/fx";
    import { html } from "@typed/template";
    import { Dialog, Select, State as UiState } from "@typed/ui";

    const DialogState = UiState.Service<Dialog.State>()("@app/ui/DialogState");
    const routeTitle = "${title}";
    export const RouteShell = html\`<h1>\${routeTitle}</h1>\`;

    export const Route = Fx.gen(function*() {
      const dialog = yield* DialogState;
      const select = yield* Select.makeState(${selectInitial});

      return html\`<main>
        <h1>${title}</h1>
        \${Dialog.Trigger({ state: dialog, content: "Open" })}
        \${Dialog.Content({ state: dialog, label: "Dialog", content: "Body" })}
        \${Select.Trigger({ state: select, content: "Fruit" })}
        \${Select.Content({
          state: select,
          content: Select.Option({ state: select, id: "apple", value: "Apple", content: "Apple" }),
        })}
      </main>\`;
    });
  `;
}

const stateFactoryNames = [
  "Checkbox",
  "Collection",
  "Combobox",
  "Composite",
  "Dialog",
  "Disclosure",
  "Form",
  "Hovercard",
  "Listbox",
  "Menu",
  "Menubar",
  "Popover",
  "Radio",
  "RadioGroup",
  "Select",
  "Tab",
  "Tabs",
  "Toolbar",
  "Tooltip",
] as const;

function everyStateFactoryRouteSource(): string {
  return `
    import { Fx } from "@typed/fx";
    import { html } from "@typed/template";
    import * as Ui from "@typed/ui";

    export const Route = Fx.gen(function*() {
      const checkbox = yield* Ui.Checkbox.makeState({ checked: true });
      const collection = yield* Ui.Collection.makeState();
      const combobox = yield* Ui.Combobox.makeState({ id: "combobox" });
      const composite = yield* Ui.Composite.makeState();
      const dialog = yield* Ui.Dialog.makeState({ open: false });
      const disclosure = yield* Ui.Disclosure.makeState({ open: false });
      const form = yield* Ui.Form.makeState({ values: { email: "" } });
      const hovercard = yield* Ui.Hovercard.makeState({ id: "hovercard" });
      const listbox = yield* Ui.Listbox.makeState();
      const menu = yield* Ui.Menu.makeState({ id: "menu" });
      const menubar = yield* Ui.Menubar.makeState();
      const popover = yield* Ui.Popover.makeState({ id: "popover" });
      const radio = yield* Ui.Radio.makeState({ value: "one" });
      const radioGroup = yield* Ui.RadioGroup.makeState({ value: "one" });
      const select = yield* Ui.Select.makeState({ id: "select" });
      const tab = yield* Ui.Tab.makeState({ selectedId: "one" });
      const tabs = yield* Ui.Tabs.makeState({ selectedId: "one" });
      const toolbar = yield* Ui.Toolbar.makeState();
      const tooltip = yield* Ui.Tooltip.makeState({ id: "tooltip" });

      return html\`<main>\${
        [
          checkbox,
          collection,
          combobox,
          composite,
          dialog,
          disclosure,
          form,
          hovercard,
          listbox,
          menu,
          menubar,
          popover,
          radio,
          radioGroup,
          select,
          tab,
          tabs,
          toolbar,
          tooltip,
        ].length
      }</main>\`;
    });
  `;
}

function stateLocalName(name: (typeof stateFactoryNames)[number]): string {
  return `${name.slice(0, 1).toLocaleLowerCase()}${name.slice(1)}`;
}

function planUiRoute(sourceText: string): readonly ViteHmrServicePlan[] {
  const hmr = analyzeComponentHmr({
    boundary: "route-component",
    moduleId: routeModuleId,
    sourceText,
  });
  const plan = planCompileCapabilities({
    boundary: "route-component",
    component: hmr,
    hmrVersion: "test",
    moduleId: routeModuleId,
  });

  return plan.hmr.services;
}

function service(
  services: readonly ViteHmrServicePlan[],
  serviceId: string,
): ViteHmrServicePlan | undefined {
  return services.find((service) => service.serviceId === serviceId);
}

function getFixtureState(
  service: ViteHmrServicePlan | undefined,
  create: () => object,
  store: Map<string, StoreEntry>,
): object {
  if (!service) throw new Error("Expected HMR service plan.");
  const key = `${service.moduleId}:${service.serviceId}`;
  const entry = store.get(key);
  if (entry?.fingerprint === service.compatibilityFingerprint) return entry.value;
  const value = create();
  store.set(key, { fingerprint: service.compatibilityFingerprint, value });
  return value;
}
