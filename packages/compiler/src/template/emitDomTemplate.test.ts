import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, EventHandler, html, render } from "@typed/template";
import { Window } from "happy-dom";
import { analyzeTemplate } from "./analyzeTemplate.js";
import { emitDomTemplate } from "./emitDomTemplate.js";

const strings = (...values: readonly string[]): TemplateStringsArray =>
  Object.assign([...values], { raw: [...values] }) as unknown as TemplateStringsArray;

describe("emitDomTemplate", () => {
  it("renders static element structure like DomRenderTemplate", async () => {
    const template = strings("<main><h1>Hello</h1><input disabled /></main>");

    const compiled = await compiledDom(template);
    const runtime = await runtimeDom(template);

    expect(compiled.body.innerHTML).toBe(runtime.body.innerHTML);
  });

  it("renders dynamic nodes and sparse text attributes like DomRenderTemplate", async () => {
    const template = strings(
      '<button class="count-',
      '" data-label=',
      ' aria-label="',
      " ",
      '">Count: ',
      "</button>",
    );
    const values = ["active", "Counter", "prefix", 7, 7] as const;

    const compiled = await compiledDom(template, ...values);
    const runtime = await runtimeDom(template, ...values);
    const compiledButton = compiled.body.querySelector("button")!;
    const runtimeButton = runtime.body.querySelector("button")!;

    expect(compiledButton.className).toBe(runtimeButton.className);
    expect(compiledButton.getAttribute("data-label")).toBe(
      runtimeButton.getAttribute("data-label"),
    );
    expect(compiledButton.getAttribute("aria-label")).toBe(
      runtimeButton.getAttribute("aria-label"),
    );
    expect(compiledButton.textContent).toBe(runtimeButton.textContent);
    expect(compiledButton.lastChild?.nodeValue).toBe(runtimeButton.lastChild?.nodeValue);
  });

  it("renders boolean, data, property, and properties parts like DomRenderTemplate", async () => {
    const template = strings("<input ?disabled=", " .value=", " .data=", " .props=", " />");
    const props = { placeholder: "Name", "?required": true, ".customValue": 42 } as const;

    const compiled = await compiledDom(template, true, "Ada", { userId: "7" }, props);
    const runtime = await runtimeDom(template, true, "Ada", { userId: "7" }, props);
    const compiledInput = compiled.body.querySelector("input")!;
    const runtimeInput = runtime.body.querySelector("input")!;

    expect(compiled.body.innerHTML).toBe(runtime.body.innerHTML);
    expect(compiledInput.getAttribute("data-userid")).toBe(
      runtimeInput.getAttribute("data-userid"),
    );
    expect((compiledInput as HTMLInputElement).value).toBe(
      (runtimeInput as HTMLInputElement).value,
    );
    expect((compiledInput as any).customValue).toBe((runtimeInput as any).customValue);
  });

  it("sets up event handlers and refs like DomRenderTemplate", async () => {
    const template = strings("<button onClick=", " ref=", ">Save</button>");
    let compiledClicked = false;
    let runtimeClicked = false;
    let compiledDefaultPrevented = false;
    let runtimeDefaultPrevented = false;
    let compiledRef: Element | undefined;
    let runtimeRef: Element | undefined;

    const compiled = await compiledDom(
      template,
      EventHandler.make(
        (event) => {
          compiledClicked = true;
          compiledDefaultPrevented = event.defaultPrevented;
        },
        { preventDefault: true },
      ),
      (element: Element) => {
        compiledRef = element;
      },
    );
    const runtime = await runtimeDomWithInteraction(
      template,
      [
        EventHandler.make(
          (event) => {
            runtimeClicked = true;
            runtimeDefaultPrevented = event.defaultPrevented;
          },
          { preventDefault: true },
        ),
        (element: Element) => {
          runtimeRef = element;
        },
      ],
      (body) => {
        (body.querySelector("button")! as HTMLButtonElement).click();
      },
    );

    (compiled.body.querySelector("button")! as HTMLButtonElement).click();

    expect(compiled.body.innerHTML).toBe(runtime.body.innerHTML);
    expect(compiledClicked).toBe(true);
    expect(runtimeClicked).toBe(true);
    expect(compiledDefaultPrevented).toBe(runtimeDefaultPrevented);
    expect(compiledRef).toBe(compiled.body.querySelector("button"));
    expect(runtimeRef).toBe(runtime.body.querySelector("button"));
  });

  it("renders comments and text-only elements like DomRenderTemplate", async () => {
    const template = strings("<!--", '--><script type="module">console.log("', '")</script>');

    const compiled = await compiledDom(template, "ready", "Ada");
    const runtime = await runtimeDom(template, "ready", "Ada");

    expect(compiled.body.innerHTML).toBe(runtime.body.innerHTML);
  });

  it("adds multi-root template boundaries like DomRenderTemplate", async () => {
    const template = strings("<h1>", "</h1><p>", "</p>");

    const compiled = await compiledDom(template, "Title", "Body");
    const runtime = await runtimeDom(template, "Title", "Body");

    expect(compiled.body.innerHTML).toBe(runtime.body.innerHTML);
  });
});

async function compiledDom(template: TemplateStringsArray, ...values: readonly unknown[]) {
  const window = createWindow();
  const compiled = emitDomTemplate(analyzeTemplate(template));
  const rendered = await compiled.renderInto(window.document.body, values);
  return { body: window.document.body, rendered, window } as const;
}

async function runtimeDom(template: TemplateStringsArray, ...values: readonly unknown[]) {
  return runtimeDomWithInteraction(template, values, () => undefined);
}

async function runtimeDomWithInteraction(
  template: TemplateStringsArray,
  values: readonly unknown[],
  interact: (body: HTMLElement) => void,
) {
  const window = createWindow();
  await Effect.runPromise(
    Effect.gen(function* () {
      yield* render(html(template, ...values), window.document.body).pipe(
        Fx.provide(DomRenderTemplate.using(window.document)),
        Fx.take(1),
        Fx.collectAll,
      );
      interact(window.document.body);
    }).pipe(Effect.scoped),
  );
  return { body: window.document.body, window } as const;
}

function createWindow(): globalThis.Window & typeof globalThis {
  return new Window() as unknown as globalThis.Window & typeof globalThis;
}
