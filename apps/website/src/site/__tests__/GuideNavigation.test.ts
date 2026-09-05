import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { guideNavigation } from "../Guides.js";

const directory = new URL("../../../content/guides/", import.meta.url);
const guides = readdirSync(directory).filter((name) => name.endsWith(".md")).map((name) => ({
  id: name.slice(0, -3),
  data: { title: readFileSync(new URL(name, directory), "utf8").match(/^title: (.+)$/m)![1]!.replace(/^"|"$/g, "") },
}));

describe("intentional guide continuation", () => {
  it("takes application and library readers into their respective first decisions", () => {
    expect(guideNavigation("application-developers", guides).next?.href).toBe("/explore/refsubject-renderer-independent-state");
    expect(guideNavigation("library-developers", guides).next?.href).toBe("/explore/shared-state-contracts");
  });

  it("teaches state ownership before hydration and URL inputs before live routing", () => {
    expect(guideNavigation("refsubject-renderer-independent-state", guides).next?.href).toBe("/explore/refsubject-sources-equality-and-lifetime");
    expect(guideNavigation("route-typed-url-inputs", guides).next?.href).toBe("/explore/router-navigation-live-selection");
  });

  it("continues across catalog sections and offers a choice after a specialized UI family", () => {
    expect(guideNavigation("template-text-only-contexts", guides).next?.href).toBe("/explore/mounting-dom-output");
    expect(guideNavigation("ui-hovercard", guides).next?.href).toBe("/explore/choosing-ui-components");
  });

  it("keeps continuation stable when the catalog is reordered and uses updated lesson titles", () => {
    const renamed = guides.toReversed().map((guide) => guide.id === "shared-state-contracts"
      ? { ...guide, data: { title: "A revised lesson title" } }
      : guide);
    expect(guideNavigation("library-developers", renamed).next).toEqual({
      href: "/explore/shared-state-contracts", title: "A revised lesson title",
    });
  });

  it("resolves every current lesson's continuation to an existing destination and live title", () => {
    const byId = new Map(guides.map((guide) => [guide.id, guide]));
    const otherPages = new Set(["/explore", "/explore/quick-start", "/explore/tutorial", "/integrate", "/reference"]);
    for (const guide of guides) {
      const navigation = guideNavigation(guide.id, guides);
      expect(navigation.next, guide.id).toBeDefined();
      for (const link of [navigation.previous, navigation.next]) {
        if (!link) continue;
        expect(link.href, guide.id).not.toBe(`/explore/${guide.id}`);
        if (otherPages.has(link.href)) continue;
        const destination = byId.get(link.href.replace("/explore/", ""));
        expect(destination, `${guide.id} -> ${link.href}`).toBeDefined();
        expect(link.title).toBe(destination!.data.title);
      }
    }
  });
});
