import { describe, expect, it } from "vitest";
import { renderMarkdown, safeTextPreview, stripUnsafeHtml } from "../../domain/Markdown.js";

const hasRawElement = (value: string): boolean =>
  /<(script|iframe|object|embed|img|svg|math)\b/i.test(value);

const hasEventHandlerAttribute = (value: string): boolean => /<[^>]+\son[a-z]+\s*=/i.test(value);

describe("Markdown and preview sanitization", () => {
  it("renders Markdown while escaping raw HTML nodes", () => {
    const html = renderMarkdown("# Hello\n\n<script>alert(1)</script>");

    expect(html).toContain("<h1>Hello</h1>");
    expect(hasRawElement(html)).toBe(false);
    expect(html).not.toContain("<script");
  });

  it("removes JavaScript URL and event-handler execution hooks", () => {
    const html = renderMarkdown("[click](javascript:alert(1))\n\n<img src=x onerror=alert(1)>");

    expect(html).not.toContain("javascript:");
    expect(hasEventHandlerAttribute(html)).toBe(false);
    expect(hasRawElement(html)).toBe(false);
  });

  it("strips unsafe attributes from already-rendered HTML", () => {
    const sanitized = stripUnsafeHtml(
      '<p><a href="javascript:alert(1)" onclick="alert(1)">x</a></p>',
    );

    expect(sanitized).toBe('<p><a href="">x</a></p>');
  });

  it("escapes plain-text previews used by descriptions", () => {
    const preview = safeTextPreview('<img src=x onerror=alert(1)> javascript:alert(1)');

    expect(preview).not.toContain("<img");
    expect(preview).not.toContain("javascript:");
    expect(preview).toContain("&lt;img");
  });
});
