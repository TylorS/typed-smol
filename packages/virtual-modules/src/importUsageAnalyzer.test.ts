import { describe, expect, it } from "vitest";
import { analyzeRequestedExports } from "./importUsageAnalyzer.js";

const moduleId = "typed:api?dir=./api";

const names = (sourceText: string) => analyzeRequestedExports(sourceText, moduleId);

describe("analyzeRequestedExports", () => {
  it("returns exact names for named imports", () => {
    expect(names('import { Client, makeClient as make } from "typed:api?dir=./api";')).toEqual({
      kind: "names",
      names: new Set(["Client", "makeClient"]),
      typeOnlyNames: new Set(),
    });
  });

  it("tracks type-only named imports separately", () => {
    expect(names('import type { Api } from "typed:api?dir=./api";')).toEqual({
      kind: "names",
      names: new Set(),
      typeOnlyNames: new Set(["Api"]),
    });
  });

  it("returns exact names for named re-exports", () => {
    expect(names('export { Client as ApiClient } from "typed:api?dir=./api";')).toEqual({
      kind: "names",
      names: new Set(["Client"]),
      typeOnlyNames: new Set(),
    });
  });

  it("finds static namespace property reads", () => {
    expect(
      names('import * as Api from "typed:api?dir=./api";\nexport const Client = Api.Client;'),
    ).toEqual({
      kind: "names",
      names: new Set(["Client"]),
      typeOnlyNames: new Set(),
    });
  });

  it("finds namespace destructuring", () => {
    expect(
      names('import * as Api from "typed:api?dir=./api";\nconst { Client, makeClient } = Api;'),
    ).toEqual({
      kind: "names",
      names: new Set(["Client", "makeClient"]),
      typeOnlyNames: new Set(),
    });
  });

  it("falls back to all for computed namespace access", () => {
    expect(names('import * as Api from "typed:api?dir=./api";\nApi["Client"];')).toEqual({
      kind: "all",
      reason: "computed namespace access",
    });
  });

  it("falls back to all for escaped namespace usage", () => {
    expect(names('import * as Api from "typed:api?dir=./api";\nuse(Api);')).toEqual({
      kind: "all",
      reason: "escaped namespace import",
    });
  });

  it("falls back to all for export star", () => {
    expect(names('export * from "typed:api?dir=./api";')).toEqual({
      kind: "all",
      reason: "export star",
    });
  });
});
