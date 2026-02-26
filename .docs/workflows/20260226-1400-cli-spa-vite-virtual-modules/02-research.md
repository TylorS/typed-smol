# Research — CLI SPA + Vite Virtual Modules

## Research Questions

1. How does Vite expose `transformIndexHtml` and when is it available?
2. What is the vavite pattern for exposing the Vite dev server as a module?
3. How does Vite handle multiple `*.html` files / multi-page apps?
4. What dependencies does @typed/ui's ssrForHttp have that @typed/app must satisfy?

## Source Table

| source                                        | year | type | confidence | notes                                         |
| --------------------------------------------- | ---- | ---- | ---------- | --------------------------------------------- |
| Vite 7 API — createServer, transformIndexHtml | 2025 | docs | high       | ViteDevServer.transformIndexHtml(url, html)   |
| Codebase: packages/ui/src/HttpRouter.ts       | —    | code | high       | ssrForHttp implementation, renderToHtmlString |
| Codebase: packages/app                        | —    | code | high       | TypedConfig, virtual module plugins           |
| Codebase: packages/vite-plugin                | —    | code | high       | typedVitePlugin, createTypedViteResolver      |

## Key Findings

- **transformIndexHtml**: `ViteDevServer.transformIndexHtml(url, html)` runs Vite's HTML transform pipeline (inject HMR client, etc.). Only available when a Vite dev server exists.
- **vavite pattern**: Expose the dev server via a virtual module that resolves to a reference stored in plugin state during `configureServer`. Our implementation will mirror this without vavite.
- **Multi-page / \*.html**: Vite's `build.rollupOptions.input` can be an object of entry points; `root` + multiple HTML files under subdirs works via `input: ["dir1/index.html", "dir2/index.html"]`.
- **ssrForHttp dependencies**: Uses `@typed/router`, `@typed/template`, `@typed/navigation`, `@typed/fx`, `effect/unstable/http`. @typed/app already depends on router; adding fx, template, navigation for SSR is a new dependency surface.

## Open Risks and Unknowns

- **@typed/app dependency bloat**: Moving ssrForHttp adds `@typed/fx`, `@typed/template`, `@typed/navigation` as @typed/app deps. May need to keep a thin re-export in @typed/ui if we want lazy loading.
- **Production vs dev**: `typed:vite-dev-server` is `undefined` in production; callers must guard.

## Implications for Requirements and Specification

- FR: `clients` config drives HTML discovery; default to `["."]` or `["./"]` for root.
- FR: `typed:config` must be serializable (no functions).
- FR: `ssrForHttp` with Vite integration must accept optional `ViteDevServer` and `transformIndexHtml` when available.
- NFR: @typed/app package.json gains new peer/dev dependencies for SSR.

## Alignment Notes

- specs_alignment: No conflicting specs.
- adrs_alignment: None.
- workflows_alignment: Brainstorming 01 captured refinements.

## Memory Promotion Candidates

- Virtual module naming: `typed:` prefix for typed-smol runtime modules (procedural).
