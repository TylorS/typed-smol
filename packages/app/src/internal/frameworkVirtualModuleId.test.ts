import { describe, expect, it } from "vitest";
import {
  createFrameworkDiagnostic,
  parseTypedVirtualModuleId,
} from "./frameworkVirtualModuleId.js";

describe("parseTypedVirtualModuleId", () => {
  it("parses typed:env with no query options", () => {
    expect(parseTypedVirtualModuleId("typed:env")).toEqual({ ok: true, kind: "env" });
  });

  it("rejects typed:env query options", () => {
    expect(parseTypedVirtualModuleId("typed:env?prefix=PUBLIC_")).toEqual({
      ok: false,
      code: "TVM-ENV-002",
      reason: 'typed:env does not support query option "prefix"',
    });
  });

  it("parses typed:config with no query options", () => {
    expect(parseTypedVirtualModuleId("typed:config")).toEqual({ ok: true, kind: "config" });
  });

  it("rejects typed:config query options", () => {
    expect(parseTypedVirtualModuleId("typed:config?raw=true")).toEqual({
      ok: false,
      code: "TVM-CONFIG-003",
      reason: 'typed:config does not support query option "raw"',
    });
  });

  it("parses typed:html required path and default outlet", () => {
    expect(parseTypedVirtualModuleId("typed:html?path=./index.html")).toEqual({
      ok: true,
      kind: "html",
      path: "./index.html",
      outlet: "<!--typed-ssr-outlet-->",
    });
  });

  it("parses typed:html custom outlet", () => {
    expect(
      parseTypedVirtualModuleId("typed:html?path=./index.html&outlet=%3C%21--app-outlet--%3E"),
    ).toEqual({
      ok: true,
      kind: "html",
      path: "./index.html",
      outlet: "<!--app-outlet-->",
    });
  });

  it("rejects typed:html without path", () => {
    expect(parseTypedVirtualModuleId("typed:html")).toEqual({
      ok: false,
      code: "TVM-HTML-001",
      reason: "typed:html requires exactly one path option",
    });
  });

  it("rejects typed:html duplicate path", () => {
    expect(parseTypedVirtualModuleId("typed:html?path=./a.html&path=./b.html")).toEqual({
      ok: false,
      code: "TVM-HTML-002",
      reason: "typed:html requires exactly one path option",
    });
  });

  it("rejects typed:html non-html path", () => {
    expect(parseTypedVirtualModuleId("typed:html?path=./index.txt")).toEqual({
      ok: false,
      code: "TVM-HTML-003",
      reason: 'typed:html path must end with ".html"',
    });
  });

  it("rejects unsupported typed:html options", () => {
    expect(parseTypedVirtualModuleId("typed:html?path=./index.html&client=./entry.ts")).toEqual({
      ok: false,
      code: "TVM-HTML-005",
      reason: 'typed:html does not support query option "client"',
    });
  });

  it("parses typed:server api and route targets in source order", () => {
    expect(
      parseTypedVirtualModuleId("typed:server?api=./api&routes=./routes1&routes=./routes2"),
    ).toEqual({
      ok: true,
      kind: "server",
      apis: ["./api"],
      routes: ["./routes1", "./routes2"],
      html: undefined,
      client: undefined,
      pages: [],
      base: undefined,
      name: undefined,
    });
  });

  it("parses typed:server default html and client pairing", () => {
    expect(
      parseTypedVirtualModuleId(
        "typed:server?routes=./routes&html=./index.html&client=./client.ts",
      ),
    ).toEqual({
      ok: true,
      kind: "server",
      apis: [],
      routes: ["./routes"],
      html: "./index.html",
      client: "./client.ts",
      pages: [],
      base: undefined,
      name: undefined,
    });
  });

  it("parses typed:server repeated page pairings", () => {
    expect(
      parseTypedVirtualModuleId(
        "typed:server?routes=./routes&page=home:./home.html:./home.ts&page=admin:./admin.html:./admin.ts",
      ),
    ).toEqual({
      ok: true,
      kind: "server",
      apis: [],
      routes: ["./routes"],
      html: undefined,
      client: undefined,
      pages: [
        { name: "home", html: "./home.html", client: "./home.ts" },
        { name: "admin", html: "./admin.html", client: "./admin.ts" },
      ],
      base: undefined,
      name: undefined,
    });
  });

  it("rejects typed:server with no api, routes, html, or pages", () => {
    expect(parseTypedVirtualModuleId("typed:server?name=app")).toEqual({
      ok: false,
      code: "TVM-SERVER-001",
      reason: "typed:server requires at least one api, routes, html, or page option",
    });
  });

  it("rejects typed:server unsupported options", () => {
    expect(parseTypedVirtualModuleId("typed:server?routes=./routes&root=%23app")).toEqual({
      ok: false,
      code: "TVM-SERVER-003",
      reason: 'typed:server does not support query option "root"',
    });
  });

  it("rejects typed:server ambiguous html and page pairing", () => {
    expect(
      parseTypedVirtualModuleId(
        "typed:server?routes=./routes&html=./index.html&page=home:./home.html:./home.ts",
      ),
    ).toEqual({
      ok: false,
      code: "TVM-SERVER-005",
      reason: "typed:server cannot combine page pairings with top-level html or client options",
    });
  });

  it("rejects typed:server malformed page pairings", () => {
    expect(parseTypedVirtualModuleId("typed:server?routes=./routes&page=home:./home.html")).toEqual(
      {
        ok: false,
        code: "TVM-SERVER-002",
        reason: 'typed:server page must use "name:html:client"',
      },
    );
  });

  it("parses typed:browser route defaults", () => {
    expect(parseTypedVirtualModuleId("typed:browser?routes=*")).toEqual({
      ok: true,
      kind: "browser",
      routes: ["*"],
      root: "#typed-root",
      base: "/",
      mode: undefined,
      name: undefined,
    });
  });

  it("parses typed:browser repeated explicit routes and options", () => {
    expect(
      parseTypedVirtualModuleId(
        "typed:browser?routes=./main&routes=./admin&root=%23shell&base=/admin&mode=mpa&name=admin",
      ),
    ).toEqual({
      ok: true,
      kind: "browser",
      routes: ["./main", "./admin"],
      root: "#shell",
      base: "/admin",
      mode: "mpa",
      name: "admin",
    });
  });

  it("rejects typed:browser hydrate mode because hydration is the default behavior", () => {
    expect(parseTypedVirtualModuleId("typed:browser?routes=*&mode=hydrate")).toEqual({
      ok: false,
      code: "TVM-BROWSER-002",
      reason: 'typed:browser mode must be one of "mount" or "mpa"',
    });
  });

  it("rejects typed:browser with no routes", () => {
    expect(parseTypedVirtualModuleId("typed:browser?mode=hydrate")).toEqual({
      ok: false,
      code: "TVM-BROWSER-001",
      reason: "typed:browser requires at least one routes option",
    });
  });

  it("rejects typed:browser invalid mode", () => {
    expect(parseTypedVirtualModuleId("typed:browser?routes=*&mode=server")).toEqual({
      ok: false,
      code: "TVM-BROWSER-002",
      reason: 'typed:browser mode must be one of "mount" or "mpa"',
    });
  });

  it("rejects typed:browser unsupported options", () => {
    expect(parseTypedVirtualModuleId("typed:browser?routes=*&html=./index.html")).toEqual({
      ok: false,
      code: "TVM-BROWSER-003",
      reason: 'typed:browser does not support query option "html"',
    });
  });

  it("rejects unknown typed virtual modules", () => {
    expect(parseTypedVirtualModuleId("typed:assets?path=./public")).toEqual({
      ok: false,
      code: "TVM-ID-001",
      reason: 'unsupported typed virtual module "assets"',
    });
  });
});

describe("createFrameworkDiagnostic", () => {
  it("creates virtual module diagnostics with the framework plugin name", () => {
    expect(createFrameworkDiagnostic("TVM-SERVER-003", "bad option")).toEqual({
      code: "TVM-SERVER-003",
      message: "bad option",
      pluginName: "typed-framework-virtual-module",
    });
  });
});
