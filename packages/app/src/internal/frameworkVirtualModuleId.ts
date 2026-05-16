import { extname } from "node:path";
import { validateNonEmptyString, validatePathSegment } from "./validation.js";
export { createFrameworkDiagnostic } from "./frameworkDiagnostics.js";

type ParseFail = { readonly ok: false; readonly code: string; readonly reason: string };

export type TypedVirtualModuleId =
  | { readonly ok: true; readonly kind: "env" }
  | { readonly ok: true; readonly kind: "config" }
  | { readonly ok: true; readonly kind: "html"; readonly path: string; readonly outlet: string }
  | {
      readonly ok: true;
      readonly kind: "server";
      readonly apis: readonly string[];
      readonly routes: readonly string[];
      readonly html: string | undefined;
      readonly client: string | undefined;
      readonly pages: readonly TypedServerPage[];
      readonly base: string | undefined;
      readonly name: string | undefined;
    }
  | {
      readonly ok: true;
      readonly kind: "browser";
      readonly routes: readonly string[];
      readonly root: string;
      readonly base: string;
      readonly mode: BrowserMode;
      readonly name: string | undefined;
    };

export type ParseTypedVirtualModuleIdResult = TypedVirtualModuleId | ParseFail;

export type BrowserMode = "hydrate" | "mount" | "mpa";

export interface TypedServerPage {
  readonly name: string;
  readonly html: string;
  readonly client: string;
}

const TYPED_PREFIX = "typed:";
const DEFAULT_HTML_OUTLET = "<!--typed-ssr-outlet-->";
const BROWSER_MODES = new Set<BrowserMode>(["hydrate", "mount", "mpa"]);

export function parseTypedVirtualModuleId(id: string): ParseTypedVirtualModuleIdResult {
  const idResult = validateNonEmptyString(id, "id");
  if (!idResult.ok) return fail("TVM-ID-001", idResult.reason);
  if (!idResult.value.startsWith(TYPED_PREFIX)) {
    return fail("TVM-ID-001", 'typed virtual module id must start with "typed:"');
  }

  const { kind, params } = splitTypedId(idResult.value);
  switch (kind) {
    case "env":
      return parseEnv(params);
    case "config":
      return parseConfig(params);
    case "html":
      return parseHtml(params);
    case "server":
      return parseServer(params);
    case "browser":
      return parseBrowser(params);
    default:
      return fail("TVM-ID-001", `unsupported typed virtual module "${kind}"`);
  }
}

function splitTypedId(id: string): { readonly kind: string; readonly params: URLSearchParams } {
  const afterPrefix = id.slice(TYPED_PREFIX.length);
  const queryIndex = afterPrefix.indexOf("?");
  if (queryIndex === -1) return { kind: afterPrefix, params: new URLSearchParams() };
  return {
    kind: afterPrefix.slice(0, queryIndex),
    params: new URLSearchParams(afterPrefix.slice(queryIndex + 1)),
  };
}

function parseEnv(params: URLSearchParams): ParseTypedVirtualModuleIdResult {
  const unsupported = firstUnsupportedOption(params, []);
  if (unsupported) {
    return fail("TVM-ENV-002", `typed:env does not support query option "${unsupported}"`);
  }
  return { ok: true, kind: "env" };
}

function parseConfig(params: URLSearchParams): ParseTypedVirtualModuleIdResult {
  const unsupported = firstUnsupportedOption(params, []);
  if (unsupported) {
    return fail("TVM-CONFIG-003", `typed:config does not support query option "${unsupported}"`);
  }
  return { ok: true, kind: "config" };
}

function parseHtml(params: URLSearchParams): ParseTypedVirtualModuleIdResult {
  const unsupported = firstUnsupportedOption(params, ["path", "outlet"]);
  if (unsupported) {
    return fail("TVM-HTML-005", `typed:html does not support query option "${unsupported}"`);
  }
  const path = singleParam(params, "path");
  if (!path.ok) return fail(path.values.length === 0 ? "TVM-HTML-001" : "TVM-HTML-002", path.reason);
  const validPath = validateTarget(path.value, "typed:html path");
  if (!validPath.ok) return fail("TVM-HTML-003", validPath.reason);
  if (extname(validPath.value) !== ".html") {
    return fail("TVM-HTML-003", 'typed:html path must end with ".html"');
  }
  return {
    ok: true,
    kind: "html",
    path: validPath.value,
    outlet: params.get("outlet") ?? DEFAULT_HTML_OUTLET,
  };
}

function parseServer(params: URLSearchParams): ParseTypedVirtualModuleIdResult {
  const unsupported = firstUnsupportedOption(params, serverOptions);
  if (unsupported) {
    return fail("TVM-SERVER-003", `typed:server does not support query option "${unsupported}"`);
  }
  const apis = validateTargets(params.getAll("api"), "typed:server api");
  if (!apis.ok) return fail("TVM-SERVER-002", apis.reason);
  const routes = validateTargets(params.getAll("routes"), "typed:server routes");
  if (!routes.ok) return fail("TVM-SERVER-002", routes.reason);
  const pages = parseServerPages(params.getAll("page"));
  if (!pages.ok) return pages;

  const html = optionalTarget(params, "html", "typed:server html");
  if (!html.ok) return html;
  const client = optionalTarget(params, "client", "typed:server client");
  if (!client.ok) return client;
  if (pages.pages.length > 0 && (html.value || client.value)) return ambiguousServerPairing();
  if (apis.values.length + routes.values.length === 0 && !html.value && pages.pages.length === 0) {
    return fail("TVM-SERVER-001", "typed:server requires at least one api, routes, html, or page option");
  }
  return serverOk(params, apis.values, routes.values, html.value, client.value, pages.pages);
}

function parseBrowser(params: URLSearchParams): ParseTypedVirtualModuleIdResult {
  const unsupported = firstUnsupportedOption(params, browserOptions);
  if (unsupported) {
    return fail("TVM-BROWSER-003", `typed:browser does not support query option "${unsupported}"`);
  }
  const routes = validateTargets(params.getAll("routes"), "typed:browser routes");
  if (!routes.ok) return fail("TVM-BROWSER-001", "typed:browser requires at least one routes option");
  if (routes.values.length === 0) {
    return fail("TVM-BROWSER-001", "typed:browser requires at least one routes option");
  }
  const mode = params.get("mode") ?? "hydrate";
  if (!BROWSER_MODES.has(mode as BrowserMode)) {
    return fail("TVM-BROWSER-002", 'typed:browser mode must be one of "hydrate", "mount", or "mpa"');
  }
  return browserOk(params, routes.values, mode as BrowserMode);
}

const serverOptions = ["api", "routes", "html", "client", "page", "base", "name"] as const;
const browserOptions = ["routes", "root", "base", "mode", "name"] as const;

function firstUnsupportedOption(
  params: URLSearchParams,
  allowed: readonly string[],
): string | undefined {
  const allowedSet = new Set(allowed);
  for (const key of params.keys()) if (!allowedSet.has(key)) return key;
  return undefined;
}

function singleParam(
  params: URLSearchParams,
  key: string,
): { readonly ok: true; readonly value: string } | { readonly ok: false; readonly reason: string; readonly values: readonly string[] } {
  const values = params.getAll(key);
  if (values.length === 1) return { ok: true, value: values[0] };
  return { ok: false, reason: `typed:html requires exactly one ${key} option`, values };
}

function validateTarget(value: string, label: string) {
  return validatePathSegment(value, label);
}

function validateTargets(values: readonly string[], label: string) {
  const out: string[] = [];
  for (const value of values) {
    const validated = validateTarget(value, label);
    if (!validated.ok) return { ok: false as const, reason: validated.reason };
    out.push(validated.value);
  }
  return { ok: true as const, values: out };
}

function optionalTarget(
  params: URLSearchParams,
  key: string,
  label: string,
): { readonly ok: true; readonly value: string | undefined } | ParseFail {
  const values = params.getAll(key);
  if (values.length > 1) return fail("TVM-SERVER-002", `typed:server ${key} must appear once`);
  if (values.length === 0) return { ok: true, value: undefined };
  const validated = validateTarget(values[0], label);
  if (!validated.ok) return fail("TVM-SERVER-002", validated.reason);
  return { ok: true, value: validated.value };
}

function parseServerPages(
  values: readonly string[],
): { readonly ok: true; readonly pages: readonly TypedServerPage[] } | ParseFail {
  const pages: TypedServerPage[] = [];
  for (const value of values) {
    const parts = value.split(":");
    if (parts.length !== 3) return fail("TVM-SERVER-002", 'typed:server page must use "name:html:client"');
    const page = validatePageParts(parts);
    if (!page.ok) return page;
    pages.push(page.page);
  }
  return { ok: true, pages };
}

function validatePageParts(
  parts: readonly string[],
): { readonly ok: true; readonly page: TypedServerPage } | ParseFail {
  const [name, html, client] = parts;
  const nameResult = validateNonEmptyString(name, "typed:server page name");
  if (!nameResult.ok) return fail("TVM-SERVER-002", nameResult.reason);
  const htmlResult = validateTarget(html, "typed:server page html");
  if (!htmlResult.ok) return fail("TVM-SERVER-002", htmlResult.reason);
  const clientResult = validateTarget(client, "typed:server page client");
  if (!clientResult.ok) return fail("TVM-SERVER-002", clientResult.reason);
  return { ok: true, page: { name: nameResult.value, html: htmlResult.value, client: clientResult.value } };
}

function ambiguousServerPairing(): ParseFail {
  return fail(
    "TVM-SERVER-005",
    "typed:server cannot combine page pairings with top-level html or client options",
  );
}

function serverOk(
  params: URLSearchParams,
  apis: readonly string[],
  routes: readonly string[],
  html: string | undefined,
  client: string | undefined,
  pages: readonly TypedServerPage[],
): TypedVirtualModuleId {
  return {
    ok: true,
    kind: "server",
    apis,
    routes,
    html,
    client,
    pages,
    base: params.get("base") ?? undefined,
    name: params.get("name") ?? undefined,
  };
}

function browserOk(
  params: URLSearchParams,
  routes: readonly string[],
  mode: BrowserMode,
): TypedVirtualModuleId {
  return {
    ok: true,
    kind: "browser",
    routes,
    root: params.get("root") ?? "#app",
    base: params.get("base") ?? "/",
    mode,
    name: params.get("name") ?? undefined,
  };
}

function fail(code: string, reason: string): ParseFail {
  return { ok: false, code, reason };
}
