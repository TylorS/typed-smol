import { describe, expect, it } from "vitest";
import { transformTemplateModule } from "./transformTemplateModule.js";

describe("transformTemplateModule", () => {
  it("emits direct DOM template factories by default", () => {
    const sourceText = [
      'import { html as h } from "@typed/template";',
      'const name = "Ada";',
      "export const view = h`<p>Hello ${name}</p>`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText).toMatchInlineSnapshot(`
      "import { html as h } from "@typed/template";
      import * as __typedTemplateEffect from "effect/Effect";
      import { bindAttr, bindBoolean, bindClass, bindData, bindEvent, bindNode, bindProperty, bindRef, bindText, defineDomTemplate, getCommentAtPath, getElementAtPath, getNodeAtPath, mountDomTemplateBindings } from "@typed/template/compiler-runtime/dom";

      const __typed_template_0 = defineDomTemplate({
        templateHash: "vCVlpuXGdBI=",
        html: "<p>Hello <!--n_0--></p>",
        mount(instance, values, runtime) {
          return __typedTemplateEffect.all([bindNode(getCommentAtPath(instance.root, [
        0,
        1
      ]), values[0], "unknown", runtime)], { concurrency: "unbounded" });
        }
      });


      const name = "Ada";
      export const view = __typed_template_0(name);"
    `);
  });

  it("does not inject duplicate imports when a module already imports Effect", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      'import * as Effect from "effect/Effect";',
      "const name = Effect.succeed('Ada');",
      "export const view = html`<p>Hello ${name}</p>`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText.match(/from "effect\/Effect"/g)).toHaveLength(1);
    expect(result.sourceText).toMatchInlineSnapshot(`
      "import { html } from "@typed/template";
      import * as Effect from "effect/Effect";
      import { bindAttr, bindBoolean, bindClass, bindData, bindEvent, bindNode, bindProperty, bindRef, bindText, defineDomTemplate, getCommentAtPath, getElementAtPath, getNodeAtPath, mountDomTemplateBindings } from "@typed/template/compiler-runtime/dom";

      const __typed_template_0 = defineDomTemplate({
        templateHash: "vCVlpuXGdBI=",
        html: "<p>Hello <!--n_0--></p>",
        mount(instance, values, runtime) {
          return Effect.all([bindNode(getCommentAtPath(instance.root, [
        0,
        1
      ]), values[0], "unknown", runtime)], { concurrency: "unbounded" });
        }
      });


      const name = Effect.succeed('Ada');
      export const view = __typed_template_0(name);"
    `);
  });

  it("rewrites namespace html imports to direct factories", () => {
    const sourceText = [
      'import * as Template from "@typed/template";',
      "const label = 'Save';",
      "export const view = Template.html`<button>${label}</button>`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText).toMatchInlineSnapshot(`
      "import * as Template from "@typed/template";
      import * as __typedTemplateEffect from "effect/Effect";
      import { bindAttr, bindBoolean, bindClass, bindData, bindEvent, bindNode, bindProperty, bindRef, bindText, defineDomTemplate, getCommentAtPath, getElementAtPath, getNodeAtPath, mountDomTemplateBindings } from "@typed/template/compiler-runtime/dom";

      const __typed_template_0 = defineDomTemplate({
        templateHash: "t8XNH46jtNU=",
        html: "<button><!--n_0--></button>",
        mount(instance, values, runtime) {
          return __typedTemplateEffect.all([bindNode(getCommentAtPath(instance.root, [
        0,
        0
      ]), values[0], "unknown", runtime)], { concurrency: "unbounded" });
        }
      });


      const label = 'Save';
      export const view = __typed_template_0(label);"
    `);
  });

  it("does not corrupt nested html templates inside outer template expressions", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "const avatar = '/avatar.png';",
      "const Link = (options: unknown) => options;",
      "export const view = html`${Link({ content: html`<img src=${avatar} />` })}`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText).toMatchInlineSnapshot(`
      "import { html } from "@typed/template";
      import * as __typedTemplateEffect from "effect/Effect";
      import { bindAttr, bindBoolean, bindClass, bindData, bindEvent, bindNode, bindProperty, bindRef, bindText, defineDomTemplate, getCommentAtPath, getElementAtPath, getNodeAtPath, mountDomTemplateBindings } from "@typed/template/compiler-runtime/dom";

      const __typed_template_0 = defineDomTemplate({
        templateHash: "BRUAAAUVAAA=",
        html: "<!--n_0-->",
        mount(instance, values, runtime) {
          return __typedTemplateEffect.all([bindNode(getCommentAtPath(instance.root, [
        0
      ]), values[0], "unknown", runtime)], { concurrency: "unbounded" });
        }
      });


      const avatar = '/avatar.png';
      const Link = (options: unknown) => options;
      export const view = __typed_template_0(Link({ content: html\`<img src=\${avatar} />\` }));"
    `);
  });

  it("does not direct-transform function-local renderable templates", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "export function view(name: string) {",
      "  return html`<p>Hello ${name}</p>`;",
      "}",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(false);
    expect(result.sourceText).toBe(sourceText);
  });

  it("does not direct-transform route module template exports", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "export const template = html`<section>Login</section>`;",
    ].join("\n");

    const result = transformTemplateModule({
      moduleId: "/src/routes/login.ts",
      sourceText,
      target: "server",
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(false);
    expect(result.sourceText).toBe(sourceText);
  });

  it("preserves modules without imported typed templates", () => {
    const sourceText = [
      "const html = String.raw;",
      "export const view = html`<p>not typed</p>`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result).toMatchObject({
      diagnostics: [],
      sourceText,
      transformed: false,
    });
  });

  it("can emit direct server template factories instead of html calls", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "const name = 'Ada';",
      "export const view = html`<main>Hello ${name}</main>`;",
    ].join("\n");

    const result = transformTemplateModule({
      moduleId: "/src/view.ts",
      sourceText,
      target: "server",
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText).toContain(
      'from "@typed/template/compiler-runtime/server"',
    );
    expect(result.sourceText).toContain("defineServerTemplate");
    expect(result.sourceText).toContain("renderServerChunks");
    expect(result.sourceText).toContain("export const view = __typed_template_0(name);");
    expect(result.sourceText).not.toContain("html(__typed_template_0");
    expect(result.sourceText).not.toContain("html`<main>");
  });

  it("can emit direct DOM template factories with path-bound parts", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "const name = 'Ada';",
      "export const view = html`<main>Hello ${name}</main>`;",
    ].join("\n");

    const result = transformTemplateModule({
      moduleId: "/src/view.ts",
      sourceText,
      target: "dom",
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(true);
    expect(result.sourceText).toMatchInlineSnapshot(`
      "import { html } from "@typed/template";
      import * as __typedTemplateEffect from "effect/Effect";
      import { bindAttr, bindBoolean, bindClass, bindData, bindEvent, bindNode, bindProperty, bindRef, bindText, defineDomTemplate, getCommentAtPath, getElementAtPath, getNodeAtPath, mountDomTemplateBindings } from "@typed/template/compiler-runtime/dom";

      const __typed_template_0 = defineDomTemplate({
        templateHash: "Y8vheQhuAQo=",
        html: "<main>Hello <!--n_0--></main>",
        mount(instance, values, runtime) {
          return __typedTemplateEffect.all([bindNode(getCommentAtPath(instance.root, [
        0,
        1
      ]), values[0], "unknown", runtime)], { concurrency: "unbounded" });
        }
      });


      const name = 'Ada';
      export const view = __typed_template_0(name);"
    `);
  });

  it("leaves unsupported direct templates unchanged instead of metadata fallback", () => {
    const sourceText = [
      'import { html } from "@typed/template";',
      "const props = { id: 'save' };",
      "export const view = html`<button ...${props}>Save</button>`;",
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.diagnostics).toEqual([]);
    expect(result.transformed).toBe(false);
    expect(result.sourceText).toBe(sourceText);
  });

  it("uses table-driven DOM bindings for templates with more than 32 dynamic parts", () => {
    const values = Array.from({ length: 33 }, (_, index) => `v${index}`);
    const sourceText = [
      'import { html } from "@typed/template";',
      ...values.map((value) => `const ${value} = ${JSON.stringify(value)};`),
      `export const view = html\`${values.map((value) => `<span>\${${value}}</span>`).join("")}\`;`,
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.transformed).toBe(true);
    expect(result.sourceText).toMatchInlineSnapshot(`
      "import { html } from "@typed/template";
      import * as __typedTemplateEffect from "effect/Effect";
      import { bindAttr, bindBoolean, bindClass, bindData, bindEvent, bindNode, bindProperty, bindRef, bindText, defineDomTemplate, getCommentAtPath, getElementAtPath, getNodeAtPath, mountDomTemplateBindings } from "@typed/template/compiler-runtime/dom";

      const __typed_template_0 = defineDomTemplate({
        templateHash: "LeVXBSQFlrw=",
        html: "<span><!--n_0--></span><span><!--n_1--></span><span><!--n_2--></span><span><!--n_3--></span><span><!--n_4--></span><span><!--n_5--></span><span><!--n_6--></span><span><!--n_7--></span><span><!--n_8--></span><span><!--n_9--></span><span><!--n_10--></span><span><!--n_11--></span><span><!--n_12--></span><span><!--n_13--></span><span><!--n_14--></span><span><!--n_15--></span><span><!--n_16--></span><span><!--n_17--></span><span><!--n_18--></span><span><!--n_19--></span><span><!--n_20--></span><span><!--n_21--></span><span><!--n_22--></span><span><!--n_23--></span><span><!--n_24--></span><span><!--n_25--></span><span><!--n_26--></span><span><!--n_27--></span><span><!--n_28--></span><span><!--n_29--></span><span><!--n_30--></span><span><!--n_31--></span><span><!--n_32--></span>",
        mount(instance, values, runtime) {
          return mountDomTemplateBindings(instance, values, runtime, [
        {
          "kind": "node",
          "path": [
            0,
            0
          ],
          "valueIndex": 0,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            1,
            0
          ],
          "valueIndex": 1,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            2,
            0
          ],
          "valueIndex": 2,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            3,
            0
          ],
          "valueIndex": 3,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            4,
            0
          ],
          "valueIndex": 4,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            5,
            0
          ],
          "valueIndex": 5,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            6,
            0
          ],
          "valueIndex": 6,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            7,
            0
          ],
          "valueIndex": 7,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            8,
            0
          ],
          "valueIndex": 8,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            9,
            0
          ],
          "valueIndex": 9,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            10,
            0
          ],
          "valueIndex": 10,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            11,
            0
          ],
          "valueIndex": 11,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            12,
            0
          ],
          "valueIndex": 12,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            13,
            0
          ],
          "valueIndex": 13,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            14,
            0
          ],
          "valueIndex": 14,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            15,
            0
          ],
          "valueIndex": 15,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            16,
            0
          ],
          "valueIndex": 16,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            17,
            0
          ],
          "valueIndex": 17,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            18,
            0
          ],
          "valueIndex": 18,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            19,
            0
          ],
          "valueIndex": 19,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            20,
            0
          ],
          "valueIndex": 20,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            21,
            0
          ],
          "valueIndex": 21,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            22,
            0
          ],
          "valueIndex": 22,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            23,
            0
          ],
          "valueIndex": 23,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            24,
            0
          ],
          "valueIndex": 24,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            25,
            0
          ],
          "valueIndex": 25,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            26,
            0
          ],
          "valueIndex": 26,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            27,
            0
          ],
          "valueIndex": 27,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            28,
            0
          ],
          "valueIndex": 28,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            29,
            0
          ],
          "valueIndex": 29,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            30,
            0
          ],
          "valueIndex": 30,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            31,
            0
          ],
          "valueIndex": 31,
          "valueKind": "unknown"
        },
        {
          "kind": "node",
          "path": [
            32,
            0
          ],
          "valueIndex": 32,
          "valueKind": "unknown"
        }
      ]);
        }
      });


      const v0 = "v0";
      const v1 = "v1";
      const v2 = "v2";
      const v3 = "v3";
      const v4 = "v4";
      const v5 = "v5";
      const v6 = "v6";
      const v7 = "v7";
      const v8 = "v8";
      const v9 = "v9";
      const v10 = "v10";
      const v11 = "v11";
      const v12 = "v12";
      const v13 = "v13";
      const v14 = "v14";
      const v15 = "v15";
      const v16 = "v16";
      const v17 = "v17";
      const v18 = "v18";
      const v19 = "v19";
      const v20 = "v20";
      const v21 = "v21";
      const v22 = "v22";
      const v23 = "v23";
      const v24 = "v24";
      const v25 = "v25";
      const v26 = "v26";
      const v27 = "v27";
      const v28 = "v28";
      const v29 = "v29";
      const v30 = "v30";
      const v31 = "v31";
      const v32 = "v32";
      export const view = __typed_template_0(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24, v25, v26, v27, v28, v29, v30, v31, v32);"
    `);
  });

  it("emits valid table-driven DOM metadata for event and ref parts", () => {
    const values = Array.from({ length: 31 }, (_, index) => `v${index}`);
    const sourceText = [
      'import { html } from "@typed/template";',
      ...values.map((value) => `const ${value} = ${JSON.stringify(value)};`),
      "const handleClick = () => {};",
      "const capture = () => {};",
      `export const view = html\`${values.map((value) => `<span>\${${value}}</span>`).join("")}<button @click=\${handleClick} ref=\${capture}>Go</button>\`;`,
    ].join("\n");

    const result = transformTemplateModule({ moduleId: "/src/view.ts", sourceText });

    expect(result.transformed).toBe(true);
    expect(result.sourceText).toMatch(
      /"kind": "event",\n\s+"name": "click",\n\s+"path": \[\n\s+31\n\s+\],\n\s+"valueIndex": 31\n\s+}/,
    );
    expect(result.sourceText).toMatch(
      /"kind": "ref",\n\s+"path": \[\n\s+31\n\s+\],\n\s+"valueIndex": 32\n\s+}/,
    );
  });
});
