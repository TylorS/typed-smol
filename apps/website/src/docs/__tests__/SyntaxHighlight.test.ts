import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../../site/Markdown.js";

describe("Astro Markdown Fx diagrams", () => {
  it("renders fx-marble fences as static, labelled filter timelines", async () => {
    const rendered = await renderMarkdown(`\`\`\`fx-marble
title: filter keeps even values
input: 1 . 2 . 3 . 4 |
operator: filter(isEven)
output: . . 2 . . . 4 |
\`\`\``);

    expect(rendered.code).toContain('<figure class="fx-marble" aria-label="filter keeps even values">');
    expect(rendered.code).toContain('role="img" aria-label="Input timeline: slot 1 1, slot 3 2, slot 5 3, slot 7 4, slot 8 complete"');
    expect(rendered.code).toContain('class="fx-marble__operator">filter(isEven)</span>');
    expect(rendered.code).toContain('class="fx-marble__event fx-marble__event--value"');
    expect(rendered.code).toContain('class="fx-marble__event fx-marble__event--complete"');
  });

  it("uses explicit shapes and accessible names for fx-marble errors and cancellation", async () => {
    const rendered = await renderMarkdown(`\`\`\`fx-marble
input: request !timeout x
operator: retry
output: request !timeout x
\`\`\``);

    expect(rendered.code).toContain('aria-label="Input timeline: slot 1 request, slot 2 error: timeout, slot 3 cancelled"');
    expect(rendered.code).toContain('class="fx-marble__event fx-marble__event--error"');
    expect(rendered.code).toContain('class="fx-marble__event fx-marble__event--cancelled"');
    expect(rendered.code).toContain('aria-hidden="true">!</span>');
    expect(rendered.code).toContain('aria-hidden="true">x</span>');
  });

  it("uses one shared clock for named fx-marble timelines", async () => {
    const rendered = await renderMarkdown(`\`\`\`fx-marble
title: sample reads the latest value on every tick
input values: a . source-b . |
input sampler: . tick . tick |
operator: sample(values)
output: . a . sampled-b |
\`\`\``);

    expect(rendered.code).toContain('class="fx-marble__diagram" style="--fx-marble-steps: 5"');
    expect(rendered.code).toContain('class="fx-marble__label">Values</span>');
    expect(rendered.code).toContain('class="fx-marble__label">Sampler</span>');
    expect(rendered.code).toContain('aria-label="Values timeline: slot 1 a, slot 3 source-b, slot 5 complete"');
    expect(rendered.code).toContain('style="--fx-marble-slot: 3" aria-hidden="true">source-b</span>');
    expect(rendered.code).not.toContain('class="fx-marble__track" style="--fx-marble-steps:');
  });

  it("renders inner Fx lifetimes on the same clock as their outer source", async () => {
    const rendered = await renderMarkdown(`\`\`\`fx-marble
title: switchMap ends the old inner before starting its replacement
input outer: a . b . . . |
operator: switchMap(preview)
inner a: ^ a1 x . . . .
inner b: . . ^ b1 . b2 |
output: . a1 . b1 . b2 |
\`\`\``);

    expect(rendered.code).toContain('class="fx-marble__row fx-marble__row--inner"');
    expect(rendered.code).toContain('class="fx-marble__label">A</span>');
    expect(rendered.code).toContain(
      'aria-label="A timeline: slot 1 start, slot 2 a1, slot 3 cancelled"',
    );
    expect(rendered.code).toContain('class="fx-marble__event fx-marble__event--start"');
    expect(rendered.code).toContain('style="--fx-marble-slot: 3" aria-hidden="true">x</span>');
    expect(rendered.code).toContain('aria-label="B timeline: slot 3 start, slot 4 b1, slot 6 b2, slot 7 complete"');
  });

  it("shows every public operator represented by a shared semantic diagram", async () => {
    const rendered = await renderMarkdown(`\`\`\`fx-marble
title: filter keeps values which satisfy a predicate
covers: filter, filterEffect
input: 1 . 2 . 3 . 4 |
operator: filter / filterEffect
output: . . 2 . . . 4 |
\`\`\``);

    expect(rendered.code).toContain('data-fx-operators="filter filterEffect"');
    expect(rendered.code).toContain('class="fx-marble__coverage"');
    expect(rendered.code).toContain('aria-label="Operators represented: filter, filterEffect"');
    expect(rendered.code).toContain('<code>filter</code><code>filterEffect</code>');
  });

  it("rejects malformed Fx diagrams before publication", async () => {
    await expect(renderMarkdown("```fx-marble\nnot a diagram\n```")).rejects.toThrow("Invalid Fx marble diagram");
  });
});
