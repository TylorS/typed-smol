import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { Guide } from "../../pages/Guide.js";
import { guides } from "../Content.js";

const orderedGuides = guides.toSorted((left, right) => (left.order ?? 0) - (right.order ?? 0));

const renderGuide = (index: number) =>
  Effect.runPromise(
    Effect.scoped(
      renderToHtmlString(Guide(orderedGuides[index]!)).pipe(Effect.provide(HtmlRenderTemplate)),
    ),
  );

const expectPaginationLink = (html: string, direction: "previous" | "next", href: string) => {
  const link = new RegExp(
    `<a(?=[^>]*class="guide-pagination__link guide-pagination__link--${direction}")(?=[^>]*href="${href}")`,
  );
  expect(html).toMatch(link);
};

describe("Explore guide pagination", () => {
  it("follows curriculum order and connects its boundaries to the surrounding sections", async () => {
    const first = await renderGuide(0);
    const middleIndex = Math.floor(orderedGuides.length / 2);
    const middle = await renderGuide(middleIndex);
    const last = await renderGuide(orderedGuides.length - 1);

    expect(first).toContain('<nav class="guide-pagination" aria-label="Explore curriculum">');
    expectPaginationLink(first, "previous", "/explore");
    expectPaginationLink(first, "next", `/explore/${orderedGuides[1]!.slug}`);

    expectPaginationLink(middle, "previous", `/explore/${orderedGuides[middleIndex - 1]!.slug}`);
    expectPaginationLink(middle, "next", `/explore/${orderedGuides[middleIndex + 1]!.slug}`);

    expectPaginationLink(last, "previous", `/explore/${orderedGuides.at(-2)!.slug}`);
    expectPaginationLink(last, "next", "/integrate");
  });
});
