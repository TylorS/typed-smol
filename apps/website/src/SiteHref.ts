const baseUrl =
  import.meta.env?.BASE_URL ??
  (typeof process === "undefined" ? "/typed-smol/" : (process.env.SITE_BASE ?? "/typed-smol/"));
const basePath = baseUrl.replace(/\/$/u, "");

/** Builds a same-site URL that also works when the documentation is deployed below a subpath. */
export const siteHref = (path: string): string => `${basePath}${path}`;
