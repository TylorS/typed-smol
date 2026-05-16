import { describe, expect, it } from "vitest";
import {
  createVirtualArtifactIndex,
  createVirtualLogicalIdentity,
  parseVirtualArtifactIndex,
  parseVirtualArtifactManifest,
  VIRTUAL_ARTIFACT_MANIFEST_VERSION,
  type VirtualArtifactIndexEntry,
  type VirtualArtifactManifest,
} from "../index.js";

const logicalIdentity = createVirtualLogicalIdentity("typed/app", "routes-key", {
  id: "virtual:routes",
  importer: "/workspace/app/src/root.ts",
});

const manifestFixture = (): VirtualArtifactManifest => ({
  schemaVersion: VIRTUAL_ARTIFACT_MANIFEST_VERSION,
  logicalIdentity,
  virtualId: "virtual:routes",
  effectiveImporter: "/workspace/app/src/root.ts",
  pluginName: "typed/app",
  generatedSourcePath: "/workspace/app/node_modules/.typed/virtual/typed-app/abcd.ts",
  generatedSourceHash: "sha256:generated",
  sourceInputFingerprints: [
    {
      kind: "file",
      name: "/workspace/app/src/root.ts",
      hash: "sha256:source",
    },
  ],
  pluginFingerprints: [
    {
      kind: "module",
      name: "typed-app-plugin",
      hash: "sha256:plugin",
      packageName: "@typed/app",
      packageVersion: "1.2.3",
    },
  ],
  compilerFingerprints: [
    {
      kind: "typescript",
      name: "typescript",
      hash: "sha256:compiler",
      version: "5.9.0",
    },
  ],
  dependencyDescriptors: [
    {
      type: "file",
      path: "/workspace/app/src/routes.ts",
    },
    {
      type: "glob",
      baseDir: "/workspace/app/src/pages",
      relativeGlobs: ["**/*.tsx"],
      recursive: true,
    },
  ],
  diagnostics: [
    {
      severity: "error",
      message: "Route export is missing",
      code: "typed-routes/missing-export",
      source: "typed/app",
    },
  ],
  warnings: [
    {
      severity: "warning",
      message: "Route metadata is incomplete",
      source: "typed/app",
    },
  ],
  debug: {
    createdAt: "2026-05-15T20:25:00.000Z",
    updatedAt: "2026-05-15T20:26:00.000Z",
    metadata: {
      surface: "vmc",
      cacheDecision: "miss",
    },
  },
});

describe("ArtifactManifest", () => {
  it("parses a JSON-serialized manifest with all cache-validity fields intact", () => {
    const serialized = JSON.stringify(manifestFixture());
    const result = parseVirtualArtifactManifest(JSON.parse(serialized));

    expect(result).toEqual({
      ok: true,
      manifest: manifestFixture(),
    });
  });

  it("rejects manifests with an unsupported schema version", () => {
    const result = parseVirtualArtifactManifest({
      ...manifestFixture(),
      schemaVersion: VIRTUAL_ARTIFACT_MANIFEST_VERSION + 1,
    });

    expect(result).toEqual({
      ok: false,
      reason: `Unsupported virtual artifact manifest schema version: ${
        VIRTUAL_ARTIFACT_MANIFEST_VERSION + 1
      }`,
    });
  });

  it("stores diagnostics and warnings in the manifest instead of sidecars", () => {
    const result = parseVirtualArtifactManifest(manifestFixture());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.manifest.diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        message: "Route export is missing",
      }),
    ]);
    expect(result.manifest.warnings).toEqual([
      expect.objectContaining({
        severity: "warning",
        message: "Route metadata is incomplete",
      }),
    ]);
  });

  it("rejects malformed nested manifest collections", () => {
    expect(
      parseVirtualArtifactManifest({
        ...manifestFixture(),
        sourceInputFingerprints: [{ kind: "nonsense", name: "bad" }],
      }),
    ).toEqual({
      ok: false,
      reason: "manifest.sourceInputFingerprints[0].kind is unsupported",
    });

    expect(
      parseVirtualArtifactManifest({
        ...manifestFixture(),
        dependencyDescriptors: [
          { type: "glob", baseDir: "/tmp", relativeGlobs: [1], recursive: true },
        ],
      }),
    ).toEqual({
      ok: false,
      reason: "manifest.dependencyDescriptors[0].relativeGlobs[0] must be a non-empty string",
    });

    expect(
      parseVirtualArtifactManifest({
        ...manifestFixture(),
        diagnostics: [{ severity: "fatal", message: 1 }],
      }),
    ).toEqual({
      ok: false,
      reason: "manifest.diagnostics[0].severity is unsupported",
    });

    expect(
      parseVirtualArtifactManifest({
        ...manifestFixture(),
        debug: { createdAt: 1, updatedAt: false, metadata: "bad" },
      }),
    ).toEqual({
      ok: false,
      reason: "manifest.debug.createdAt must be a string when present",
    });
  });

  it("rejects non-json debug metadata objects without throwing", () => {
    expect(
      parseVirtualArtifactManifest({
        ...manifestFixture(),
        debug: { metadata: new Date("2026-05-15T20:25:00.000Z") },
      }),
    ).toEqual({
      ok: false,
      reason: "manifest.debug.metadata must be a JSON object when present",
    });

    expect(
      parseVirtualArtifactManifest({
        ...manifestFixture(),
        debug: { metadata: new Map([["surface", "vmc"]]) },
      }),
    ).toEqual({
      ok: false,
      reason: "manifest.debug.metadata must be a JSON object when present",
    });

    const cyclicMetadata: Record<string, unknown> = {};
    cyclicMetadata.self = cyclicMetadata;

    expect(
      parseVirtualArtifactManifest({
        ...manifestFixture(),
        debug: { metadata: cyclicMetadata },
      }),
    ).toEqual({
      ok: false,
      reason: "manifest.debug.metadata must be a JSON object when present",
    });
  });
});

describe("ArtifactIndex", () => {
  const entryFixture = (): VirtualArtifactIndexEntry => ({
    logicalIdentity,
    manifestPath: "/workspace/app/node_modules/.typed/virtual/typed-app/abcd.manifest.json",
    generatedSourcePath: "/workspace/app/node_modules/.typed/virtual/typed-app/abcd.ts",
    virtualId: "virtual:routes",
    effectiveImporter: "/workspace/app/src/root.ts",
    pluginName: "typed/app",
    generatedSourceHash: "sha256:generated",
    diagnosticsCount: 1,
    warningsCount: 1,
    updatedAt: "2026-05-15T20:26:00.000Z",
  });

  it("creates a project index keyed by logical identity for manifest lookup", () => {
    const index = createVirtualArtifactIndex([entryFixture()]);
    const parsed = parseVirtualArtifactIndex(JSON.parse(JSON.stringify(index)));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.index.artifacts[logicalIdentity]).toEqual(entryFixture());
    expect(parsed.index.artifacts[logicalIdentity]?.manifestPath).toMatch(/\.manifest\.json$/);
  });

  it("rejects project indexes with an unsupported schema version", () => {
    const result = parseVirtualArtifactIndex({
      ...createVirtualArtifactIndex([entryFixture()]),
      schemaVersion: VIRTUAL_ARTIFACT_MANIFEST_VERSION + 1,
    });

    expect(result).toEqual({
      ok: false,
      reason: `Unsupported virtual artifact index schema version: ${
        VIRTUAL_ARTIFACT_MANIFEST_VERSION + 1
      }`,
    });
  });

  it("rejects project indexes with malformed optional fields", () => {
    const result = parseVirtualArtifactIndex({
      ...createVirtualArtifactIndex([
        {
          ...entryFixture(),
          diagnosticsCount: -1,
        },
      ]),
    });

    expect(result).toEqual({
      ok: false,
      reason: `index.artifacts.${logicalIdentity}.diagnosticsCount must be a non-negative integer`,
    });
  });
});
