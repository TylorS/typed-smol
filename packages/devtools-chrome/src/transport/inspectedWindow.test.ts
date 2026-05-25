import { DevtoolsProtocolFixtures, makeDomBindingId } from "@typed/devtools-protocol";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  elementsSidebarModel,
  registerTypedElementsSidebar,
  type ElementsSidebarModel,
} from "../elementsSidebar.js";
import {
  TYPED_DEVTOOLS_INSPECT_DOM_BINDING_EXPRESSION,
  TYPED_DEVTOOLS_SELECTED_NODE_EXPRESSION,
  inspectDomBinding,
  makeInspectedWindowDomResolver,
  type ChromeInspectedWindow,
} from "./inspectedWindow.js";

describe("Chrome inspected window transport", () => {
  it("evaluates the selected element through the page-side Typed DOM bridge", async () => {
    const inspectedWindow = makeFakeInspectedWindow(DevtoolsProtocolFixtures.domBindingResolution);
    const resolver = makeInspectedWindowDomResolver(inspectedWindow);

    await expect(resolver.resolveSelectedElement()).resolves.toEqual(
      DevtoolsProtocolFixtures.domBindingResolution,
    );
    expect(inspectedWindow.expressions).toEqual([TYPED_DEVTOOLS_SELECTED_NODE_EXPRESSION]);
  });

  it("evaluates DOM binding inspection through the page-side Typed DOM bridge", async () => {
    const inspectedWindow = makeFakeInspectedWindow({
      _tag: "Inspected",
      bindingId: DevtoolsProtocolFixtures.ids.domBinding,
    });

    await expect(
      inspectDomBinding(inspectedWindow, DevtoolsProtocolFixtures.ids.domBinding),
    ).resolves.toEqual({ ok: true });
    expect(inspectedWindow.expressions).toEqual([
      TYPED_DEVTOOLS_INSPECT_DOM_BINDING_EXPRESSION(DevtoolsProtocolFixtures.ids.domBinding),
    ]);
  });

  it("returns explicit unbound results for eval exceptions and invalid payloads", async () => {
    const failed = makeInspectedWindowDomResolver(
      makeFakeInspectedWindow(undefined, { description: "bridge missing" }),
    );
    const invalid = makeInspectedWindowDomResolver(makeFakeInspectedWindow({ nope: true }));

    await expect(failed.resolveSelectedElement()).resolves.toEqual({
      _tag: "Unbound",
      bindingId: makeDomBindingId("selected-node"),
      reason: "Inspected window evaluation failed: bridge missing",
    });
    await expect(invalid.resolveSelectedElement()).resolves.toEqual({
      _tag: "Unbound",
      bindingId: makeDomBindingId("selected-node"),
      reason: "Inspected window returned an invalid DOM binding resolution",
    });
  });

  it("returns an explicit unbound result when inspectedWindow.eval throws", async () => {
    const resolver = makeInspectedWindowDomResolver({
      eval() {
        throw new Error("inspected target is gone");
      },
    });

    await expect(resolver.resolveSelectedElement()).resolves.toEqual({
      _tag: "Unbound",
      bindingId: makeDomBindingId("selected-node"),
      reason: "Inspected window evaluation failed: inspected target is gone",
    });
  });
});

describe("Chrome Elements sidebar", () => {
  it("renders selected element component, template, state, and Fx summaries", async () => {
    const chrome = makeFakeElementsChrome();
    registerTypedElementsSidebar(chrome, {
      resolveSelectedElement: () => Promise.resolve(DevtoolsProtocolFixtures.domBindingResolution),
    });

    await chrome.emitSelectionChanged();

    expect(chrome.sidebar.objects).toEqual([
      {
        object: elementsSidebarModel(DevtoolsProtocolFixtures.domBindingResolution),
        rootTitle: "Typed",
      },
    ]);
    expect(chrome.sidebar.page).toBe("elementsSidebar.html");
  });

  it("renders an explicit unbound model when the selected element resolver rejects", async () => {
    const chrome = makeFakeElementsChrome();
    registerTypedElementsSidebar(chrome, {
      resolveSelectedElement: () => Promise.reject(new Error("selection bridge disconnected")),
    });

    await chrome.emitSelectionChanged();

    expect(chrome.sidebar.objects).toEqual([
      {
        object: {
          _tag: "Unbound",
          bindingId: makeDomBindingId("selected-node"),
          reason: "Typed Elements sidebar selection failed: selection bridge disconnected",
        },
        rootTitle: "Typed",
      },
    ]);
  });

  it("keeps the newest selected element summary when async selections resolve out of order", async () => {
    const firstResolution = deferred<typeof DevtoolsProtocolFixtures.domBindingResolution>();
    const secondResolution = deferred<typeof DevtoolsProtocolFixtures.domBindingResolution>();
    const secondBindingResolution = {
      ...DevtoolsProtocolFixtures.domBindingResolution,
      bindingId: makeDomBindingId("second"),
    };
    const chrome = makeFakeElementsChrome();
    let callIndex = 0;
    registerTypedElementsSidebar(chrome, {
      resolveSelectedElement: () =>
        ++callIndex === 1 ? firstResolution.promise : secondResolution.promise,
    });

    const firstSelection = chrome.emitSelectionChanged();
    const secondSelection = chrome.emitSelectionChanged();
    secondResolution.resolve(secondBindingResolution);
    await secondSelection;
    firstResolution.resolve(DevtoolsProtocolFixtures.domBindingResolution);
    await firstSelection;

    expect(chrome.sidebar.objects).toEqual([
      {
        object: elementsSidebarModel(secondBindingResolution),
        rootTitle: "Typed",
      },
    ]);
  });

  it("keeps sidebar view models protocol typed", () => {
    const model = elementsSidebarModel(DevtoolsProtocolFixtures.domBindingResolution);

    expectTypeOf(model).toExtend<ElementsSidebarModel>();
    expect(model).toMatchObject({
      _tag: "Resolved",
      bindingId: "dom:button:submit",
      component: {
        componentId: "cmp:app/root",
        deepLink: "typed://component/cmp%3Aapp%2Froot",
        displayName: "Root",
      },
      fx: [
        {
          deepLink: "typed://fx/fx%3Acomponent%2Froot%2Fload-user",
          fxNodeId: "fx:component/root/load-user",
        },
      ],
      refSubjects: [
        {
          deepLink: "typed://refsubject/ref%3Acomponent%2Froot%2Fuser",
          refSubjectId: "ref:component/root/user",
        },
      ],
      template: {
        partId: "part:sha256:root-template#0.1",
        templateHash: "tpl:sha256:root-template",
      },
    });
  });
});

function makeFakeInspectedWindow(
  result: unknown,
  exceptionInfo?: { readonly description?: string; readonly value?: string },
): ChromeInspectedWindow & { readonly expressions: string[] } {
  const expressions: string[] = [];
  return {
    expressions,
    eval(expression, callback) {
      expressions.push(expression);
      callback(result, exceptionInfo);
    },
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function makeFakeElementsChrome() {
  let listener: (() => void | Promise<void>) | undefined;
  const sidebar = {
    objects: [] as { readonly object: unknown; readonly rootTitle?: string }[],
    page: "",
    setObject(object: unknown, rootTitle?: string) {
      this.objects.push({ object, rootTitle });
    },
    setPage(page: string) {
      this.page = page;
    },
  };
  return {
    sidebar,
    devtools: {
      panels: {
        elements: {
          createSidebarPane(_title: string, callback: (pane: typeof sidebar) => void) {
            callback(sidebar);
          },
          onSelectionChanged: {
            addListener(nextListener: () => void | Promise<void>) {
              listener = nextListener;
            },
          },
        },
      },
    },
    async emitSelectionChanged() {
      await listener?.();
    },
  };
}
