import type { ArtifactStoreFingerprints, VirtualArtifactFingerprint } from "@typed/virtual-modules";
import { hashVirtualArtifactJson } from "@typed/virtual-modules";

export type TemplateOutputTarget = "dom" | "server";

export interface TemplateOutputFingerprintInput {
  readonly compilerVersion: string;
  readonly options?: unknown;
  readonly pluginName?: string;
  readonly sourceModuleId: string;
  readonly target: TemplateOutputTarget;
  readonly templateHash: string;
}

type HashResult =
  | { readonly ok: true; readonly hash: string }
  | { readonly ok: false; readonly reason: string };

const defaultPluginName = "@typed/compiler:template-output";

export function createTemplateOutputFingerprints(
  input: TemplateOutputFingerprintInput,
): ArtifactStoreFingerprints {
  return {
    sourceInputFingerprints: [sourceFingerprint(input)],
    pluginFingerprints: [optionsFingerprint(input)],
    compilerFingerprints: [compilerFingerprint(input.compilerVersion)],
  };
}

function sourceFingerprint(input: TemplateOutputFingerprintInput): VirtualArtifactFingerprint {
  return {
    kind: "source",
    name: input.sourceModuleId,
    hash: hashVirtualArtifactJson({
      sourceModuleId: input.sourceModuleId,
      templateHash: input.templateHash,
    }),
  };
}

function optionsFingerprint(input: TemplateOutputFingerprintInput): VirtualArtifactFingerprint {
  const name = input.pluginName ?? defaultPluginName;
  const hash = tryHash({
    options: input.options ?? null,
    target: input.target,
  });

  return hash.ok
    ? { kind: "config", name, hash: hash.hash }
    : { kind: "config", name, unavailableReason: hash.reason };
}

function compilerFingerprint(compilerVersion: string): VirtualArtifactFingerprint {
  if (compilerVersion.length === 0) {
    return {
      kind: "package",
      name: "@typed/compiler",
      packageName: "@typed/compiler",
      unavailableReason: "Template compiler package version is unavailable",
    };
  }

  return {
    kind: "package",
    name: "@typed/compiler",
    packageName: "@typed/compiler",
    packageVersion: compilerVersion,
    hash: hashVirtualArtifactJson({
      packageName: "@typed/compiler",
      packageVersion: compilerVersion,
    }),
  };
}

function tryHash(value: unknown): HashResult {
  try {
    return { ok: true, hash: hashVirtualArtifactJson(value) };
  } catch (error) {
    return {
      ok: false,
      reason: `Unable to hash template compiler options: ${errorMessage(error)}`,
    };
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
