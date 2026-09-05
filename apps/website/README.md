# Typed documentation

An Astro static site, published by the existing GitHub Pages workflow at
`https://tylors.github.io/typed-smol/`. The build output is `dist/site`.

```sh
pnpm install --frozen-lockfile
pnpm --filter typed-website dev
```

`dev` builds workspace dependencies and generates documentation before starting Astro.
Open the printed address under `/typed-smol/`. Use `SITE_BASE=/` for a root-hosted local build.

## Authoring

- `content/guides`: explanations and focused application/library guides.
- `content/learn`: the Quick Start, including SSR and hydration.
- `content/tutorial`: cumulative TodoMVC chapters with client-only examples.
- `content/recipes`: host and framework integrations.
- `content/glossary`: shared terminology.
- Package source JSDoc and exports: generated API reference, signatures, and examples.

The site uses Astro content collections and Shiki. The Markdown plugin links known Typed
identifiers, renders accessible Fx diagrams, and applies the deployment base to local links.
Generated files are build artifacts; edit the source content or package documentation instead.
Run `pnpm --filter typed-website format:astro` after editing Astro templates; the workspace's
Oxfmt command handles the TypeScript, CSS, JSON, and Markdown files.

`src/site` contains layouts, routes, static document/search endpoints, and Typed islands.
`src/docs` contains extraction and content validation. `src/tutorial` contains shared executable
examples and the build-time curriculum reader. Tailwind and DaisyUI themes in
`src/site/styles.css` retain the Matrix Green palette in dark and light modes.

The site emits HTML, direct Markdown, a search index, a documentation manifest, a sitemap,
`llms.txt`, and `llms-full.txt`. All are static files served by GitHub Pages.

## Validation

```sh
pnpm --filter typed-website docs:generate
pnpm --filter typed-website test:docs
pnpm --filter typed-website typecheck
pnpm --filter typed-website exec playwright install chromium
pnpm --filter typed-website test:production
pnpm --filter @typed/astro test
pnpm --filter @typed/astro test:integration
```

`test:docs` checks source coverage, authored examples, cumulative tutorial snapshots, Markdown,
and search behavior. `test:production` regenerates and builds the site, then checks every local
HTML link and reference route and exercises hydration, search, themes, and mobile layouts in
Chromium. `test:static` runs those output checks against an existing build.

The extractor and Astro checker use TypeScript 6's compiler API. Library builds retain the
workspace TypeScript version; the website's compiler dependencies are intentionally local.

## GitHub Pages

`.github/workflows/deploy-pages.yml` installs with the frozen lockfile, generates and validates
the documentation, builds with `SITE_BASE=/typed-smol/`, checks the static output, and uploads
`dist/site` including discovery files. Astro's `site`, `base`, and trailing-slash settings live
in `astro.config.ts`. No application server is needed.
