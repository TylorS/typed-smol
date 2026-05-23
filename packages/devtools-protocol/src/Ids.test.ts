import { describe, expect, it } from "vitest";
import {
  DEVTOOLS_PROTOCOL_VERSION,
  IdPrefixes,
  getDevtoolsIdParts,
  makeComponentId,
  makeDevtoolsClientId,
  makeDevtoolsSessionId,
  makeDomBindingId,
  makeFxNodeId,
  makeHmrBoundaryId,
  makeNavigationEventId,
  makeRefSubjectId,
  makeSourceLocationId,
  makeTemplateHash,
  makeTemplatePartId,
  parseComponentId,
  parseDevtoolsSessionId,
} from "./Ids.js";

describe("DevTools protocol ids", () => {
  it("creates deterministic branded ids with stable prefixes", () => {
    const cases = [
      [IdPrefixes.ComponentId, makeComponentId, "app/root", "cmp:app/root"],
      [IdPrefixes.TemplateHash, makeTemplateHash, "sha256:abc123", "tpl:sha256:abc123"],
      [IdPrefixes.TemplatePartId, makeTemplatePartId, "sha256:abc123#0.1", "part:sha256:abc123#0.1"],
      [IdPrefixes.DomBindingId, makeDomBindingId, "button:submit", "dom:button:submit"],
      [IdPrefixes.FxNodeId, makeFxNodeId, "root/effect", "fx:root/effect"],
      [IdPrefixes.RefSubjectId, makeRefSubjectId, "state/user", "ref:state/user"],
      [IdPrefixes.HmrBoundaryId, makeHmrBoundaryId, "module:counter", "hmr:module:counter"],
      [IdPrefixes.NavigationEventId, makeNavigationEventId, "transition:1", "nav:transition:1"],
      [IdPrefixes.SourceLocationId, makeSourceLocationId, "src/App.ts:1:1", "src:src/App.ts:1:1"],
      [IdPrefixes.DevtoolsSessionId, makeDevtoolsSessionId, "session-1", "session:session-1"],
      [IdPrefixes.DevtoolsClientId, makeDevtoolsClientId, "panel-1", "client:panel-1"],
    ] as const;

    for (const [prefix, makeId, value, expected] of cases) {
      expect(makeId(value)).toBe(expected);
      expect(getDevtoolsIdParts(makeId(value))).toEqual({ prefix, value });
    }
  });

  it("keeps already-prefixed values stable", () => {
    expect(makeComponentId("cmp:app/root")).toBe("cmp:app/root");
    expect(makeDevtoolsSessionId("session:active")).toBe("session:active");
  });

  it("parses only ids that match the expected prefix", () => {
    expect(parseComponentId("cmp:app/root")).toBe("cmp:app/root");
    expect(() => parseComponentId("dom:app/root")).toThrow("Expected cmp id");
    expect(() => parseDevtoolsSessionId("session:")).toThrow("Expected session id");
  });

  it("exposes id metadata without allocating protocol wrappers", () => {
    const componentId = makeComponentId("app/root");

    expect(typeof componentId).toBe("string");
    expect(getDevtoolsIdParts(componentId)).toEqual({
      prefix: IdPrefixes.ComponentId,
      value: "app/root",
    });
  });

  it("rejects empty id values", () => {
    expect(() => makeComponentId("")).toThrow("Cannot create cmp id from an empty value");
    expect(() => makeComponentId("   ")).toThrow("Cannot create cmp id from an empty value");
  });

  it("rejects non-canonical id values", () => {
    expect(() => makeComponentId(" app/root")).toThrow(
      "Cannot create cmp id from a value with boundary whitespace",
    );
    expect(() => makeComponentId("app/root ")).toThrow(
      "Cannot create cmp id from a value with boundary whitespace",
    );
    expect(() => makeComponentId("app\nroot")).toThrow(
      "Cannot create cmp id from a value with control characters",
    );
    expect(() => parseComponentId("cmp:   ")).toThrow(
      "Cannot create cmp id from an empty value",
    );
  });

  it("publishes the negotiated protocol version literal", () => {
    expect(DEVTOOLS_PROTOCOL_VERSION).toBe("0.1.0");
  });
});
