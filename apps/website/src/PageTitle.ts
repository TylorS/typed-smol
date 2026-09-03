import { guides } from "./docs/Content.js";
import { recipes } from "./docs/Recipes.js";
import { generatedManifest } from "./generated/manifest.js";
import { tutorialSteps } from "./tutorial/Content.js";
import { referencePath } from "./docs/Reference.js";

const fixedTitles = new Map<string, string>([
  ["/", "Typed — Cooperative by design"],
  ["/explore/quick-start", "Quick Start — Typed"],
  ["/explore/tutorial", "TodoMVC tutorial — Typed"],
  ["/explore", "Explore — Typed"],
  ["/integrate", "Integration recipes — Typed"],
  ["/reference", "API reference — Typed"],
  ["/glossary", "Glossary — Typed"],
  ...guides.map((guide) => [`/explore/${guide.slug}`, `${guide.title} — Typed`] as const),
  ...recipes.map((recipe) => [`/integrate/${recipe.slug}`, `${recipe.title} — Typed`] as const),
  ...tutorialSteps.map(
    (step) =>
      [`/explore/tutorial/${step.slug}`, `${step.title} — TodoMVC tutorial — Typed`] as const,
  ),
]);

const referenceTitles = new Map(
  generatedManifest.routes.flatMap((route) => {
    if (route.kind !== "exposure") return [];
    const separator = route.id.lastIndexOf("#");
    if (separator < 0) return [];
    return [
      [
        referencePath(route.id),
        `${route.id.slice(separator + 1)} — ${route.id.slice(0, separator)} — Typed`,
      ] as const,
    ];
  }),
);

const decode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const normalizePath = (pathname: string, base = "/"): string => {
  const withoutQuery = pathname.split(/[?#]/u, 1)[0] || "/";
  const normalizedBase = base === "/" ? "" : `/${base.split("/").filter(Boolean).join("/")}`;
  const withoutBase =
    normalizedBase !== "" &&
    (withoutQuery === normalizedBase || withoutQuery.startsWith(`${normalizedBase}/`))
      ? withoutQuery.slice(normalizedBase.length) || "/"
      : withoutQuery;
  return withoutBase.length > 1 ? withoutBase.replace(/\/+$/u, "") : withoutBase;
};

/** Returns the route-specific document title used by SSR, static output, and browser navigation. */
export const pageTitle = (pathname: string, base = "/"): string => {
  const path = normalizePath(pathname, base);
  const fixed = fixedTitles.get(path);
  if (fixed !== undefined) return fixed;
  const referenceTitle = referenceTitles.get(path);
  if (referenceTitle !== undefined) return referenceTitle;

  const packagePrefix = "/reference/packages/";
  if (path.startsWith(packagePrefix)) {
    return `${decode(path.slice(packagePrefix.length))} package — Typed`;
  }

  const modulePrefix = "/reference/modules/";
  if (path.startsWith(modulePrefix)) {
    return `${decode(path.slice(modulePrefix.length))} module — Typed`;
  }

  const symbolPrefix = "/reference/";
  if (path.startsWith(symbolPrefix)) {
    const id = decode(path.slice(symbolPrefix.length));
    const separator = id.lastIndexOf("#");
    if (separator > 0) return `${id.slice(separator + 1)} — ${id.slice(0, separator)} — Typed`;
  }

  return "Page not found — Typed";
};
