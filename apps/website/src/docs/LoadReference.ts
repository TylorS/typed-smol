import { Effect } from "effect";
import type { ExposurePayload, ReferenceModule, ReferencePackage } from "./Model.js";
import { referenceIdFromRouteSlug, referenceSlug } from "./Reference.js";

const browserPath = (pathname: string, basePath: string): string => {
  const base = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return `${base.endsWith("/") ? base : `${base}/`}${pathname.replace(/^\//u, "")}`;
};

const loadJson = <A>(pathname: string, basePath = "/"): Effect.Effect<A, Error> =>
  Effect.tryPromise({
    try: async () => {
      if (import.meta.env.SSR) {
        const { readFile } = await import("node:fs/promises");
        const { fileURLToPath } = await import("node:url");
        const staticRoot = import.meta.env.PROD ? "../client/" : "../../public/";
        const root = new URL(staticRoot, import.meta.url);
        return JSON.parse(
          await readFile(fileURLToPath(new URL(`.${pathname}`, root)), "utf8"),
        ) as A;
      }
      const response = await fetch(browserPath(pathname, basePath));
      if (!response.ok)
        throw new Error(`Reference document request failed with ${response.status}`);
      return (await response.json()) as A;
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error))),
  });

export const loadPackage = (
  packageName: string,
  basePath = "/",
): Effect.Effect<ReferencePackage, Error> =>
  loadJson<{ readonly id: string; readonly package: ReferencePackage }>(
    `/docs/reference/packages/${referenceSlug(`package:${packageName}`)}.json`,
    basePath,
  ).pipe(Effect.map((payload) => payload.package));

export const loadModule = (
  consumerSpecifier: string,
  basePath = "/",
): Effect.Effect<ReferenceModule, Error> =>
  loadJson<{ readonly id: string; readonly module: ReferenceModule }>(
    `/docs/reference/modules/${referenceSlug(`module:${consumerSpecifier}`)}.json`,
    basePath,
  ).pipe(Effect.map((payload) => payload.module));

export const loadExposure = (id: string, basePath = "/"): Effect.Effect<ExposurePayload, Error> =>
  loadJson(`/docs/reference/exposures/${referenceSlug(id)}.json`, basePath);

export const loadExposureBySlug = (
  slug: string,
  basePath = "/",
): Effect.Effect<ExposurePayload, Error> => {
  const id = referenceIdFromRouteSlug(slug);
  return id === undefined
    ? Effect.fail(new Error(`Invalid reference slug: ${slug}`))
    : loadExposure(id, basePath);
};
