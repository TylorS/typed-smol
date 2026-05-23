declare const DevtoolsIdBrand: unique symbol;

export const DEVTOOLS_PROTOCOL_VERSION = "0.1.0" as const;

export const IdPrefixes = {
  ComponentId: "cmp",
  TemplateHash: "tpl",
  TemplatePartId: "part",
  DomBindingId: "dom",
  FxNodeId: "fx",
  RefSubjectId: "ref",
  HmrBoundaryId: "hmr",
  NavigationEventId: "nav",
  SourceLocationId: "src",
  DevtoolsSessionId: "session",
  DevtoolsClientId: "client",
} as const;

export type DevtoolsProtocolVersion = typeof DEVTOOLS_PROTOCOL_VERSION;
export type DevtoolsIdPrefix = (typeof IdPrefixes)[keyof typeof IdPrefixes];
export type DevtoolsId<Tag extends string> = string & {
  readonly [DevtoolsIdBrand]: Tag;
};

export type ComponentId = DevtoolsId<"ComponentId">;
export type TemplateHash = DevtoolsId<"TemplateHash">;
export type TemplatePartId = DevtoolsId<"TemplatePartId">;
export type DomBindingId = DevtoolsId<"DomBindingId">;
export type FxNodeId = DevtoolsId<"FxNodeId">;
export type RefSubjectId = DevtoolsId<"RefSubjectId">;
export type HmrBoundaryId = DevtoolsId<"HmrBoundaryId">;
export type NavigationEventId = DevtoolsId<"NavigationEventId">;
export type SourceLocationId = DevtoolsId<"SourceLocationId">;
export type DevtoolsSessionId = DevtoolsId<"DevtoolsSessionId">;
export type DevtoolsClientId = DevtoolsId<"DevtoolsClientId">;

export type AnyDevtoolsId =
  | ComponentId
  | TemplateHash
  | TemplatePartId
  | DomBindingId
  | FxNodeId
  | RefSubjectId
  | HmrBoundaryId
  | NavigationEventId
  | SourceLocationId
  | DevtoolsSessionId
  | DevtoolsClientId;

export type DevtoolsIdParts = {
  readonly prefix: DevtoolsIdPrefix;
  readonly value: string;
};

const prefixValues: ReadonlySet<string> = new Set(Object.values(IdPrefixes));

export const makeComponentId = (value: string): ComponentId =>
  makeId(IdPrefixes.ComponentId, value);

export const makeTemplateHash = (value: string): TemplateHash =>
  makeId(IdPrefixes.TemplateHash, value);

export const makeTemplatePartId = (value: string): TemplatePartId =>
  makeId(IdPrefixes.TemplatePartId, value);

export const makeDomBindingId = (value: string): DomBindingId =>
  makeId(IdPrefixes.DomBindingId, value);

export const makeFxNodeId = (value: string): FxNodeId => makeId(IdPrefixes.FxNodeId, value);

export const makeRefSubjectId = (value: string): RefSubjectId =>
  makeId(IdPrefixes.RefSubjectId, value);

export const makeHmrBoundaryId = (value: string): HmrBoundaryId =>
  makeId(IdPrefixes.HmrBoundaryId, value);

export const makeNavigationEventId = (value: string): NavigationEventId =>
  makeId(IdPrefixes.NavigationEventId, value);

export const makeSourceLocationId = (value: string): SourceLocationId =>
  makeId(IdPrefixes.SourceLocationId, value);

export const makeDevtoolsSessionId = (value: string): DevtoolsSessionId =>
  makeId(IdPrefixes.DevtoolsSessionId, value);

export const makeDevtoolsClientId = (value: string): DevtoolsClientId =>
  makeId(IdPrefixes.DevtoolsClientId, value);

export const parseComponentId = (value: string): ComponentId =>
  parseId(IdPrefixes.ComponentId, value);

export const parseTemplateHash = (value: string): TemplateHash =>
  parseId(IdPrefixes.TemplateHash, value);

export const parseTemplatePartId = (value: string): TemplatePartId =>
  parseId(IdPrefixes.TemplatePartId, value);

export const parseDomBindingId = (value: string): DomBindingId =>
  parseId(IdPrefixes.DomBindingId, value);

export const parseFxNodeId = (value: string): FxNodeId => parseId(IdPrefixes.FxNodeId, value);

export const parseRefSubjectId = (value: string): RefSubjectId =>
  parseId(IdPrefixes.RefSubjectId, value);

export const parseHmrBoundaryId = (value: string): HmrBoundaryId =>
  parseId(IdPrefixes.HmrBoundaryId, value);

export const parseNavigationEventId = (value: string): NavigationEventId =>
  parseId(IdPrefixes.NavigationEventId, value);

export const parseSourceLocationId = (value: string): SourceLocationId =>
  parseId(IdPrefixes.SourceLocationId, value);

export const parseDevtoolsSessionId = (value: string): DevtoolsSessionId =>
  parseId(IdPrefixes.DevtoolsSessionId, value);

export const parseDevtoolsClientId = (value: string): DevtoolsClientId =>
  parseId(IdPrefixes.DevtoolsClientId, value);

export function getDevtoolsIdParts(id: AnyDevtoolsId): DevtoolsIdParts {
  const separator = id.indexOf(":");
  const prefix = id.slice(0, separator);
  const value = id.slice(separator + 1);

  if (separator <= 0 || value.length === 0 || !isDevtoolsIdPrefix(prefix)) {
    throw new Error(`Invalid Typed DevTools id: ${id}`);
  }

  return { prefix, value };
}

function makeId<Id extends AnyDevtoolsId>(prefix: DevtoolsIdPrefix, value: string): Id {
  assertCanonicalValue(prefix, value);

  return parseId(prefix, value.startsWith(`${prefix}:`) ? value : `${prefix}:${value}`);
}

function parseId<Id extends AnyDevtoolsId>(prefix: DevtoolsIdPrefix, value: string): Id {
  const prefixToken = `${prefix}:`;

  if (!value.startsWith(prefixToken) || value.length === prefixToken.length) {
    throw new Error(`Expected ${prefix} id`);
  }

  assertCanonicalValue(prefix, value.slice(prefixToken.length));

  return value as Id;
}

function isDevtoolsIdPrefix(value: string): value is DevtoolsIdPrefix {
  return prefixValues.has(value);
}

function assertCanonicalValue(prefix: DevtoolsIdPrefix, value: string): void {
  if (value.length === 0 || value.trim().length === 0) {
    throw new Error(`Cannot create ${prefix} id from an empty value`);
  }

  if (value !== value.trim()) {
    throw new Error(`Cannot create ${prefix} id from a value with boundary whitespace`);
  }

  if (/[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error(`Cannot create ${prefix} id from a value with control characters`);
  }
}
