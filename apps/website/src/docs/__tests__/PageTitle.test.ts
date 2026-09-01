import { describe, expect, it } from "vitest";
import { manifest } from "../../agent/Artifacts.js";
import { pageTitle } from "../../PageTitle.js";

describe("pageTitle", () => {
  it.each([
    ["/", "Typed — Cooperative by design"],
    ["/explore", "Explore — Typed"],
    ["/explore/building-fx", "Building Fx values — Typed"],
    ["/integrate/react", "Use React and Typed together — Typed"],
    ["/reference/packages/%40typed%2Fui", "@typed/ui package — Typed"],
    [
      "/reference/modules/%40typed%2Ftemplate%2FRenderEvent",
      "@typed/template/RenderEvent module — Typed",
    ],
    ["/reference/%40typed%2Ftemplate%2Fmany%23many", "many — @typed/template/many — Typed"],
  ])("describes %s", (pathname, expected) => {
    expect(pageTitle(pathname)).toBe(expected);
  });

  it("normalizes a deployed base path, query, and trailing slash", () => {
    expect(pageTitle("/typed-smol/explore/building-fx/?preview=1", "/typed-smol/")).toBe(
      "Building Fx values — Typed",
    );
  });

  it("gives every published HTML route a unique descriptive title", () => {
    const paths = [...new Set(manifest.routes.map(({ canonicalPath }) => canonicalPath))];
    const titles = paths.map((path) => pageTitle(path));

    expect(titles).not.toContain("Page not found — Typed");
    expect(new Set(titles).size).toBe(paths.length);
  });
});
