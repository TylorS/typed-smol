import { describe, expect, it, vi } from "vitest";
import type { SearchArtifact } from "../Search.js";
import { createOnDemandSearch } from "../../search/OnDemandSearch.js";

const artifact: SearchArtifact = {
  schemaVersion: 1,
  entries: [
    {
      id: "guide:fx",
      title: "Fx: work arrives",
      kind: "guide",
      text: "push based reactivity",
      href: "/explore/fx-push-reactivity",
    },
  ],
  prefixes: { fx: [0] },
  trigrams: { " fx": [0], "fx ": [0] },
};

describe("createOnDemandSearch", () => {
  it("does not load the generated corpus until the first query", async () => {
    const load = vi.fn(async () => artifact);
    const search = createOnDemandSearch(load);

    expect(load).not.toHaveBeenCalled();
    expect(await search("Fx")).toMatchObject([{ id: "guide:fx" }]);
    expect(load).toHaveBeenCalledOnce();
  });

  it("reuses one lazy artifact load across subsequent queries", async () => {
    const load = vi.fn(async () => artifact);
    const search = createOnDemandSearch(load);

    await search("Fx");
    await search("reactivity");

    expect(load).toHaveBeenCalledOnce();
  });

  it("retries a lazy artifact load after a transient failure", async () => {
    const load = vi
      .fn<() => Promise<SearchArtifact>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(artifact);
    const search = createOnDemandSearch(load);

    await expect(search("Fx")).rejects.toThrow("offline");
    await expect(search("Fx")).resolves.toMatchObject([{ id: "guide:fx" }]);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
