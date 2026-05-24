import { describe, expect, expectTypeOf, it } from "vitest";
import { Window } from "happy-dom";
import * as Effect from "effect/Effect";
import {
  bindText,
  defineDomTemplate,
  getElementAtPath,
  instantiateDomTemplate,
  mountDomTemplateBindings,
} from "./dom.js";
import {
  createDomTemplateBindingId,
  type DomTemplateDevtoolsBindingEvent,
  type DomTemplateDevtoolsObserver,
} from "./devtools.js";

describe("compiler-runtime DOM DevTools hooks", () => {
  it("records template mount and binding metadata without changing render output", async () => {
    const window = new Window();
    const root = window.document.createElement("div");
    const events: Array<{ readonly _tag: string; readonly payload: unknown }> = [];
    const devtools: DomTemplateDevtoolsObserver = {
      onTemplateBinding: (event) => events.push({ _tag: "binding", payload: event }),
      onTemplateMounted: (event) => events.push({ _tag: "mounted", payload: event }),
    };
    const view = defineDomTemplate<[string, string]>({
      html: "<button></button><!--n_1-->",
      templateHash: "dom-devtools",
      mount: (instance, values, runtime) =>
        mountDomTemplateBindings(instance, values, runtime, [
          {
            kind: "attr",
            name: "aria-label",
            path: [0],
            valueIndex: 0,
            valueKind: "plain",
          },
          {
            kind: "node",
            path: [1],
            valueIndex: 1,
            valueKind: "plain",
          },
        ]),
    });

    await view("Save", "now").renderInto(root, undefined, { devtools });

    expect(root.innerHTML).toBe('<button aria-label="Save"></button>now<!--n_1-->');
    expect(events.map((event) => event._tag)).toEqual(["binding", "binding", "mounted"]);
    expect(events[0]?.payload).toMatchObject({
      bindingId: "dom-devtools#attr:0:aria-label:0",
      kind: "attr",
      name: "aria-label",
      path: [0],
      templateHash: "dom-devtools",
      valueIndex: 0,
    });
    expect(events[1]?.payload).toMatchObject({
      bindingId: "dom-devtools#node:1:1",
      kind: "node",
      path: [1],
      templateHash: "dom-devtools",
      valueIndex: 1,
    });
  });

  it("notifies unmount before replacing a previously rendered template", async () => {
    const window = new Window();
    const root = window.document.createElement("div");
    const events: string[] = [];
    const devtools: DomTemplateDevtoolsObserver = {
      onTemplateMounted: (event) => events.push(`mounted:${event.templateHash}`),
      onTemplateUnmounted: (event) => events.push(`unmounted:${event.templateHash}`),
    };
    const view = defineDomTemplate<[string]>({
      html: "<p></p>",
      templateHash: "dom-replace",
      mount: (instance, values, runtime) =>
        bindText(getElementAtPath(instance.root, [0]), values[0], "plain", runtime),
    });

    await view("first").renderInto(root, undefined, { devtools });
    await view("second").renderInto(root, undefined, { devtools });

    expect(root.innerHTML).toBe("<p>second</p>");
    expect(events).toEqual(["mounted:dom-replace", "unmounted:dom-replace", "mounted:dom-replace"]);
  });

  it("keeps rendering when an observer throws", async () => {
    const window = new Window();
    const root = window.document.createElement("div");
    const view = defineDomTemplate<[string]>({
      html: "<p></p>",
      templateHash: "dom-devtools-throw",
      mount: (instance, values, runtime) =>
        mountDomTemplateBindings(instance, values, runtime, [
          {
            kind: "text",
            path: [0],
            valueIndex: 0,
            valueKind: "plain",
          },
        ]),
    });

    await expect(
      view("still renders").renderInto(root, undefined, {
        devtools: {
          onTemplateBinding() {
            throw new Error("observer failed");
          },
        },
      }),
    ).resolves.toHaveLength(1);
    expect(root.innerHTML).toBe("<p>still renders</p>");
  });

  it("does not notify bindings until the mount effect runs", async () => {
    const window = new Window();
    const events: DomTemplateDevtoolsBindingEvent[] = [];
    const instance = instantiateDomTemplate(window.document, "<p></p>", "lazy-template");
    const effect = mountDomTemplateBindings(
      instance,
      ["Hello"],
      {
        devtools: {
          onTemplateBinding: (event) => events.push(event),
        },
      },
      [
        {
          kind: "text",
          path: [0],
          valueIndex: 0,
          valueKind: "plain",
        },
      ],
    );

    expect(events).toEqual([]);

    await Effect.runPromise(effect);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      bindingId: "lazy-template#text:0:0",
      kind: "text",
      path: [0],
      templateHash: "lazy-template",
      valueIndex: 0,
    });
  });

  it("preserves helper type inference for hook payloads", () => {
    const event = {
      bindingId: createDomTemplateBindingId({
        kind: "text",
        path: [0],
        templateHash: "hash",
        valueIndex: 0,
      }),
      kind: "text",
      node: {} as Node,
      path: [0],
      templateHash: "hash",
      valueIndex: 0,
    } as const satisfies DomTemplateDevtoolsBindingEvent;

    expectTypeOf(event).toExtend<DomTemplateDevtoolsBindingEvent>();
  });
});
