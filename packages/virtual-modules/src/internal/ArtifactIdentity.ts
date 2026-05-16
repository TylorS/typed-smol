import { basename, dirname, join, resolve } from "node:path";
import {
  stableHash,
  toPosixPath,
  VIRTUAL_MODULE_URI_SCHEME,
  VIRTUAL_NODE_MODULES_RELATIVE,
} from "./path.js";

export type VirtualLogicalIdentity = `${typeof VIRTUAL_MODULE_URI_SCHEME}://${string}`;

export interface CreateVirtualLogicalIdentityParams {
  readonly id: string;
  readonly importer: string;
}

export interface VirtualArtifactPaths {
  readonly logicalIdentity: VirtualLogicalIdentity;
  readonly sourcePath: string;
  readonly manifestPath: string;
}

const sanitizeSegment = (value: string): string => {
  const segment = value.replaceAll(/[^a-zA-Z0-9._-]/g, "-");
  return segment.length > 0 && segment !== "." && segment !== ".." ? segment : "virtual";
};

export function createVirtualLogicalIdentity(
  pluginName: string,
  virtualKey: string,
  params: CreateVirtualLogicalIdentityParams,
): VirtualLogicalIdentity {
  const safePluginName = sanitizeSegment(pluginName);
  const hash = stableHash(
    JSON.stringify({
      pluginName,
      virtualKey,
      id: params.id,
      importer: params.importer,
    }),
  );
  return `${VIRTUAL_MODULE_URI_SCHEME}://0/${safePluginName}/${hash}.ts`;
}

export function isVirtualLogicalIdentity(value: unknown): value is VirtualLogicalIdentity {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === `${VIRTUAL_MODULE_URI_SCHEME}:` &&
      parsed.hostname === "0" &&
      /^\/[a-zA-Z0-9._-]+\/[a-f0-9]{16}\.ts$/.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

export function createArtifactPaths(
  projectRoot: string,
  logicalIdentity: VirtualLogicalIdentity,
): VirtualArtifactPaths {
  if (!isVirtualLogicalIdentity(logicalIdentity)) {
    throw new TypeError(`Expected ${VIRTUAL_MODULE_URI_SCHEME} logical identity`);
  }

  const parsed = new URL(logicalIdentity);
  const sourcePath = toPosixPath(
    join(
      resolve(projectRoot),
      VIRTUAL_NODE_MODULES_RELATIVE,
      dirname(parsed.pathname),
      basename(parsed.pathname),
    ),
  );

  return {
    logicalIdentity,
    sourcePath,
    manifestPath: sourcePath.replace(/\.ts$/, ".manifest.json"),
  };
}
