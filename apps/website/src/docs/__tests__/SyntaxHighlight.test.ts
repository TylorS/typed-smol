import { describe, expect, it } from "vitest";
import { highlightCode, normalizeLanguage } from "../SyntaxHighlight.js";
import { renderGuideMarkdown } from "../RenderMarkdown.js";

describe("static syntax highlighting", () => {
  it("escapes source text while marking TypeScript tokens", () => {
    const highlighted = highlightCode(
      "ts",
      'const message: string = "<script>alert(1)</script>";\n// keep this local\nconsole.log(message);',
    );

    expect(highlighted).toContain('<span class="tok-keyword">const</span>');
    expect(highlighted).toContain('<span class="tok-type">string</span>');
    expect(highlighted).toContain(
      '<span class="tok-string">&quot;&lt;script&gt;alert(1)&lt;/script&gt;&quot;</span>',
    );
    expect(highlighted).toContain('<span class="tok-comment">// keep this local</span>');
    expect(highlighted).not.toContain("<script>");
    expect(highlighted).toContain("alert(1)");
  });

  it("marks representative non-TypeScript languages without changing their source", () => {
    expect(highlightCode("html", '<button class="primary">Hello</button>')).toContain(
      '<span class="tok-tag">button</span>',
    );
    expect(highlightCode("css", ".button { color: #22d3d1; }")).toContain(
      '<span class="tok-selector">.button</span>',
    );
    expect(highlightCode("sh", "pnpm build:static # publish")).toContain(
      '<span class="tok-command">pnpm</span>',
    );
    expect(highlightCode("json", '{"enabled": true, "count": 2}')).toContain(
      '<span class="tok-property">&quot;enabled&quot;</span>',
    );
  });

  it("highlights html tagged templates as HTML with TypeScript interpolations", () => {
    const highlighted = highlightCode(
      "ts",
      'const view = html`<button class=${tone} ?disabled=${disabled}>${disabled === false ? "Saving" : "Save"}</button>`;',
    );

    expect(highlighted).toContain('<span class="tok-template-tag">html</span>');
    expect(highlighted).toContain('<span class="tok-tag">button</span>');
    expect(highlighted).toContain('<span class="tok-attribute">class</span>');
    expect(highlighted).toContain('<span class="tok-attribute">?disabled</span>');
    expect(highlighted).toContain('<span class="tok-template-punctuation">${</span>tone');
    expect(highlighted).toContain('<span class="tok-boolean">false</span>');
    expect(highlighted).not.toContain("<button");
  });

  it("keeps untagged TypeScript template literals as strings", () => {
    expect(highlightCode("ts", "const message = `Hello ${name}`;")).toContain(
      '<span class="tok-string">`Hello ${name}`</span>',
    );
  });

  it("highlights JSX tags, attributes, fragments, and expressions alongside script tokens", () => {
    const highlighted = highlightCode(
      "tsx",
      'const view = <><Button aria-label="Save" disabled={ready}>{title}</Button></>;',
    );

    expect(highlighted).toContain('<span class="tok-keyword">const</span>');
    expect(highlighted).toContain('<span class="tok-punctuation">&lt;&gt;</span>');
    expect(highlighted).toContain('<span class="tok-tag">Button</span>');
    expect(highlighted).toContain('<span class="tok-attribute">aria-label</span>');
    expect(highlighted).toContain('<span class="tok-punctuation">{</span>ready');
    expect(highlighted).toContain('<span class="tok-punctuation">{</span>title');
    expect(highlighted).toContain('<span class="tok-punctuation">&lt;/&gt;</span>');
  });

  it("keeps TSX generic type arguments as script before highlighting a later JSX return", () => {
    const highlighted = highlightCode(
      "tsx",
      "const ref = useRef<HTMLDivElement>(null);\nconst value: Renderable<unknown> = content;\nreturn <div>{value}</div>;",
    );

    expect(highlighted).toContain(
      '<span class="tok-operator">&lt;</span><span class="tok-type">HTMLDivElement</span><span class="tok-operator">&gt;</span>',
    );
    expect(highlighted).toContain(
      '<span class="tok-type">Renderable</span><span class="tok-operator">&lt;</span><span class="tok-type">unknown</span><span class="tok-operator">&gt;</span>',
    );
    expect(highlighted).toContain('<span class="tok-tag">div</span>');
    expect(highlighted).toContain('<span class="tok-punctuation">{</span>value');
  });

  it("keeps generic arrows and post-call type arguments as script before later JSX", () => {
    const highlighted = highlightCode(
      "tsx",
      "const identity = <T,>(value: T) => value;\nconst created = factory()<Value>();\nreturn <div>{identity(created)}</div>;",
    );

    expect(highlighted).toContain(
      '<span class="tok-operator">&lt;</span><span class="tok-type">T</span><span class="tok-punctuation">,</span><span class="tok-operator">&gt;</span>',
    );
    expect(highlighted).toContain(
      '<span class="tok-operator">&lt;</span><span class="tok-type">Value</span><span class="tok-operator">&gt;</span>',
    );
    expect(highlighted).toContain('<span class="tok-tag">div</span>');
    expect(highlighted).toContain(
      '<span class="tok-punctuation">{</span><span class="tok-function">identity</span>',
    );
  });

  it("returns to TypeScript after a self-closing JSX element", () => {
    const highlighted = highlightCode(
      "tsx",
      "const view = <div />; const after: number = 1;",
    );

    expect(highlighted).toContain('<span class="tok-tag">div</span>');
    expect(highlighted).toContain('<span class="tok-keyword">const</span> after');
    expect(highlighted).toContain('<span class="tok-type">number</span>');
  });

  it("returns to TypeScript after a paired JSX element", () => {
    const highlighted = highlightCode(
      "tsx",
      "const view = <div></div>; const after: number = 1;",
    );

    expect(highlighted).toContain('<span class="tok-tag">div</span>');
    expect(highlighted).toContain('<span class="tok-keyword">const</span> after');
    expect(highlighted).toContain('<span class="tok-type">number</span>');
  });

  it("highlights Svelte markup, template control flow, TypeScript scripts, and CSS styles", () => {
    const highlighted = highlightCode(
      "svelte",
      `<script lang="ts">
  const count: number = 1;
</script>
{#if count > 0}
  <button class:active={count > 0}>{count}</button>
{/if}
<style>
  .button { color: #22d3d1; }
</style>`,
    );

    expect(highlighted).toContain('<span class="tok-tag">script</span>');
    expect(highlighted).toContain('<span class="tok-attribute">lang</span>');
    expect(highlighted).toContain('<span class="tok-keyword">const</span>');
    expect(highlighted).toContain('<span class="tok-type">number</span>');
    expect(highlighted).toContain('<span class="tok-keyword">#if</span>');
    expect(highlighted).toContain('<span class="tok-tag">button</span>');
    expect(highlighted).toContain('<span class="tok-attribute">class:active</span>');
    expect(highlighted).toContain('<span class="tok-punctuation">{</span>count');
    expect(highlighted).toContain('<span class="tok-keyword">/if</span>');
    expect(highlighted).toContain('<span class="tok-tag">style</span>');
    expect(highlighted).toContain('<span class="tok-selector">.button</span>');
  });

  it("keeps Markdown code fences semantic and assigns a stable language class", () => {
    const rendered = renderGuideMarkdown("```typescript\nconst answer = 42\n```");

    expect(rendered.html).toContain(
      '<pre class="code-block code-block--ts"><code class="language-ts">',
    );
    expect(rendered.html).toContain('<span class="tok-keyword">const</span>');
    expect(rendered.html).toContain('<span class="tok-number">42</span>');
    expect(rendered.html).toContain("</code></pre>");
  });

  it("renders fx-marble fences as static, labelled filter timelines", () => {
    const rendered = renderGuideMarkdown(`\`\`\`fx-marble
title: filter keeps even values
input: 1 . 2 . 3 . 4 |
operator: filter(isEven)
output: . . 2 . . . 4 |
\`\`\``);

    expect(rendered.html).toContain('<figure class="fx-marble" aria-label="filter keeps even values">');
    expect(rendered.html).toContain('role="img" aria-label="Input timeline: slot 1 1, slot 3 2, slot 5 3, slot 7 4, slot 8 complete"');
    expect(rendered.html).toContain('class="fx-marble__operator">filter(isEven)</span>');
    expect(rendered.html).toContain('class="fx-marble__event fx-marble__event--value"');
    expect(rendered.html).toContain('class="fx-marble__event fx-marble__event--complete"');
  });

  it("uses explicit shapes and accessible names for fx-marble errors and cancellation", () => {
    const rendered = renderGuideMarkdown(`\`\`\`fx-marble
input: request !timeout x
operator: retry
output: request !timeout x
\`\`\``);

    expect(rendered.html).toContain('aria-label="Input timeline: slot 1 request, slot 2 error: timeout, slot 3 cancelled"');
    expect(rendered.html).toContain('class="fx-marble__event fx-marble__event--error"');
    expect(rendered.html).toContain('class="fx-marble__event fx-marble__event--cancelled"');
    expect(rendered.html).toContain('aria-hidden="true">!</span>');
    expect(rendered.html).toContain('aria-hidden="true">x</span>');
  });

  it("uses one shared clock for named fx-marble timelines", () => {
    const rendered = renderGuideMarkdown(`\`\`\`fx-marble
title: sample reads the latest value on every tick
input values: a . source-b . |
input sampler: . tick . tick |
operator: sample(values)
output: . a . sampled-b |
\`\`\``);

    expect(rendered.html).toContain('class="fx-marble__diagram" style="--fx-marble-steps: 5"');
    expect(rendered.html).toContain('class="fx-marble__label">Values</span>');
    expect(rendered.html).toContain('class="fx-marble__label">Sampler</span>');
    expect(rendered.html).toContain('aria-label="Values timeline: slot 1 a, slot 3 source-b, slot 5 complete"');
    expect(rendered.html).toContain('style="--fx-marble-slot: 3" aria-hidden="true">source-b</span>');
    expect(rendered.html).not.toContain('class="fx-marble__track" style="--fx-marble-steps:');
  });

  it("renders inner Fx lifetimes on the same clock as their outer source", () => {
    const rendered = renderGuideMarkdown(`\`\`\`fx-marble
title: switchMap ends the old inner before starting its replacement
input outer: a . b . . . |
operator: switchMap(preview)
inner a: ^ a1 x . . . .
inner b: . . ^ b1 . b2 |
output: . a1 . b1 . b2 |
\`\`\``);

    expect(rendered.html).toContain('class="fx-marble__row fx-marble__row--inner"');
    expect(rendered.html).toContain('class="fx-marble__label">A</span>');
    expect(rendered.html).toContain(
      'aria-label="A timeline: slot 1 start, slot 2 a1, slot 3 cancelled"',
    );
    expect(rendered.html).toContain('class="fx-marble__event fx-marble__event--start"');
    expect(rendered.html).toContain('style="--fx-marble-slot: 3" aria-hidden="true">x</span>');
    expect(rendered.html).toContain('aria-label="B timeline: slot 3 start, slot 4 b1, slot 6 b2, slot 7 complete"');
  });

  it("shows every public operator represented by a shared semantic diagram", () => {
    const rendered = renderGuideMarkdown(`\`\`\`fx-marble
title: filter keeps values which satisfy a predicate
covers: filter, filterEffect
input: 1 . 2 . 3 . 4 |
operator: filter / filterEffect
output: . . 2 . . . 4 |
\`\`\``);

    expect(rendered.html).toContain('data-fx-operators="filter filterEffect"');
    expect(rendered.html).toContain('class="fx-marble__coverage"');
    expect(rendered.html).toContain('aria-label="Operators represented: filter, filterEffect"');
    expect(rendered.html).toContain('<code>filter</code><code>filterEffect</code>');
  });

  it("links exact platform and Typed inline-code identifiers without guessing", () => {
    const rendered = renderGuideMarkdown(
      "`Node` and `DocumentFragment` are platform APIs. `Wire` is a Typed symbol. `NodeLike` is not.",
    );

    expect(rendered.html).toContain(
      '<code class="inline-code-link"><a href="https://developer.mozilla.org/en-US/docs/Web/API/Node" rel="external">Node</a></code>',
    );
    expect(rendered.html).toContain(
      '<code class="inline-code-link"><a href="https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment" rel="external">DocumentFragment</a></code>',
    );
    expect(rendered.html).toContain(
      '<code class="inline-code-link"><a href="/reference/%40typed%2Ftemplate%23Wire">Wire</a></code>',
    );
    expect(rendered.html).toContain("<code>NodeLike</code>");
    expect(rendered.html).not.toContain('<a href="/reference/%40typed%2Ftemplate%23NodeLike">');
  });

  it("resolves an explicitly supplied Typed symbol context by canonical id", () => {
    const rendered = renderGuideMarkdown("Use `CustomThing` here.", undefined, {
      typedSymbolIds: { CustomThing: "@typed/example#CustomThing" },
    });

    expect(rendered.html).toContain(
      '<code class="inline-code-link"><a href="/reference/%40typed%2Fexample%23CustomThing">CustomThing</a></code>',
    );
  });

  it("normalizes aliases and keeps unknown languages safe", () => {
    expect(normalizeLanguage("TypeScript")).toBe("ts");
    expect(normalizeLanguage("jsx")).toBe("jsx");
    expect(normalizeLanguage("svelte")).toBe("svelte");
    expect(normalizeLanguage("made-up<lang>")).toBe("text");
    expect(highlightCode("made-up<lang>", "<b>not markup</b>")).toBe(
      "&lt;b&gt;not markup&lt;/b&gt;",
    );
  });
});
