import { getNonReusableFingerprintReasons } from "@typed/virtual-modules";
import { describe, expect, it } from "vitest";
import { createTemplateOutputFingerprints } from "./fingerprints.js";

describe("createTemplateOutputFingerprints", () => {
  it("creates stable source, plugin, and compiler fingerprints for template output", () => {
    const first = createTemplateOutputFingerprints({
      compilerVersion: "1.0.0-beta.4",
      options: { minify: true, preserveWhitespace: false },
      sourceModuleId: "/src/routes/counter.tsx",
      target: "dom",
      templateHash: "template:counter",
    });
    const next = createTemplateOutputFingerprints({
      compilerVersion: "1.0.0-beta.4",
      options: { preserveWhitespace: false, minify: true },
      sourceModuleId: "/src/routes/counter.tsx",
      target: "dom",
      templateHash: "template:counter",
    });

    expect(next).toEqual(first);
    expect(first.sourceInputFingerprints).toEqual([
      expect.objectContaining({ kind: "source", name: "/src/routes/counter.tsx" }),
    ]);
    expect(first.pluginFingerprints).toEqual([
      expect.objectContaining({ kind: "config", name: "@typed/compiler:template-output" }),
    ]);
    expect(first.compilerFingerprints).toEqual([
      expect.objectContaining({
        kind: "package",
        name: "@typed/compiler",
        packageVersion: "1.0.0-beta.4",
      }),
    ]);
  });

  it("changes hashes when source, target, or compiler version changes", () => {
    const baseline = createTemplateOutputFingerprints(baseInput());
    const sourceChanged = createTemplateOutputFingerprints({
      ...baseInput(),
      templateHash: "template:profile",
    });
    const targetChanged = createTemplateOutputFingerprints({ ...baseInput(), target: "server" });
    const compilerChanged = createTemplateOutputFingerprints({
      ...baseInput(),
      compilerVersion: "1.0.0-beta.5",
    });

    expect(sourceChanged.sourceInputFingerprints).not.toEqual(baseline.sourceInputFingerprints);
    expect(targetChanged.pluginFingerprints).not.toEqual(baseline.pluginFingerprints);
    expect(compilerChanged.compilerFingerprints).not.toEqual(baseline.compilerFingerprints);
  });

  it("fails closed when compiler version or options cannot be fingerprinted", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const fingerprints = createTemplateOutputFingerprints({
      ...baseInput(),
      compilerVersion: "",
      options: circular,
    });

    const reasons = getNonReusableFingerprintReasons([
      ...fingerprints.pluginFingerprints,
      ...fingerprints.compilerFingerprints,
    ]);

    expect(reasons).toEqual([
      expect.stringContaining("Unable to hash template compiler options"),
      "Template compiler package version is unavailable",
    ]);
  });
});

function baseInput() {
  return {
    compilerVersion: "1.0.0-beta.4",
    options: { minify: true },
    sourceModuleId: "/src/routes/counter.tsx",
    target: "dom" as const,
    templateHash: "template:counter",
  };
}
