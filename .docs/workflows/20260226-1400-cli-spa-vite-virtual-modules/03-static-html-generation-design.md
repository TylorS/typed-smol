# Static HTML Generation Design — `typed build`

## Objective

When running `typed build`, discover router modules (or directories) that declare **static paths** via `getStaticPaths` or `_staticPaths.ts` / `.staticPaths.ts`, run their Effect-based iterables of URLs, and pre-render those URLs to static HTML using the server render pipeline.

## Scope

- **In scope**: Convention for declaring static paths; discovery from router VM target dirs; type contract (Effect → iterable of URLs); build-step integration (after server build); rendering each URL via existing SSR pipeline and writing HTML to disk.
- **Out of scope (for this design)**: ISR, on-demand revalidation, hybrid per-route static vs dynamic; exact CLI flags and config schema (captured as open points).

## Conventions (proposed)

Align with existing router companion patterns:

| Convention                 | Location                                                                         | Export                                            | Meaning                                                                             |
| -------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Directory static paths** | `_staticPaths.ts` in a route directory                                           | `export default` or `export const getStaticPaths` | Effect that yields an iterable of URLs (or path+query) for that directory subtree.  |
| **Route companion**        | `*.staticPaths.ts` next to a route file (e.g. `blog.ts` → `blog.staticPaths.ts`) | `export default` or `export const getStaticPaths` | Effect that yields an iterable of URLs for that single route (e.g. all blog slugs). |

- **Route module inline**: A route file may also export `getStaticPaths` directly (same type as above). Discovery then treats that file as both a route and a static-path source.
- **Precedence**: For a given route leaf, static paths can come from (1) its own `*.staticPaths.ts` or in-file `getStaticPaths`, or (2) an ancestor `_staticPaths.ts`. Design should define merge/dedupe behavior (e.g. union of URL sets per route).

## Type contract

- **`getStaticPaths` / default**: Must be an **Effect** that succeeds with a value that is (or can be normalized to) an **iterable of URL-like strings**.
  - Preferred: `Effect.Effect<Iterable<string>, E, R>` or `Effect.Effect<AsyncIterable<string>, E, R>`.
  - URL strings: absolute path + optional query, e.g. `/blog`, `/blog/hello-world`, `/users?page=1`. Base path from app (e.g. Vite `base`) applied at render time.
- **Validation**: At build/generation time we need to either (a) type-check that the export is assignable to something like `Effect<Iterable<string>, any, any>`, or (b) run the Effect and assert the result is iterable. TypeInfo-based validation (like router contract) is ideal for early failure.

## Discovery

- **Where**: Same target directories already used by the router virtual module plugin for `router:./<directory>`.
- **How**:
  1. **Directory-level**: When building route descriptors for a directory, include `_staticPaths.ts` in the list of files to consider. If present, require `default` or `getStaticPaths` and validate type (Effect → iterable).
  2. **Companion**: For each route leaf, check for sibling `*.staticPaths.ts` (e.g. `about.ts` → `about.staticPaths.ts`). If present, validate same export contract.
  3. **In-file**: When validating a route file, if it exports `getStaticPaths`, validate type and attach to that route’s static-path sources.
- **Output of discovery**: A list of **static path sources**: each source is (module path, scope) where scope is either “directory” (applies to all leaves under that dir) or “route” (applies to one leaf). The router VM can emit this as metadata (e.g. in the generated router module or a separate generated manifest) so the build step knows which modules to load and run.

## Build-time flow (high level)

1. **Build client and server** as today (`typed build` → client bundle, server bundle).
2. **Resolve static path sources** from the same router target dirs (either by parsing emitted manifest or re-running discovery against built output). Get a list of (moduleId, scope) for `_staticPaths.ts`, `*.staticPaths.ts`, and in-file `getStaticPaths`.
3. **Run each static-path Effect** in an environment that provides the same services the app uses (Scope, Router, and any R from the Effect). This may require loading the server entry or a thin “bootstrap” that provides the app Layer and then imports/runs each getStaticPaths. Collect all URLs (with dedupe/merge by route if needed).
4. **Render each URL** using the existing SSR pipeline (same as `ssrForHttp`): for each URL, simulate a GET request, run the matcher, render the matched Fx to HTML via `renderToHtmlString`, capture the response body.
5. **Write static files**: For each URL, map to a file path (e.g. `/about` → `dist/client/about/index.html` or `dist/static/about.html`), ensure directory exists, write HTML. Query strings may map to file names or be ignored (design choice).
6. **Optional**: Emit a manifest of pre-rendered paths so the server can serve static files for those routes when available (or so a static host can serve them).

## Integration points

- **Router VM plugin** (`packages/app`): Extend `buildRouteDescriptors` or the plugin’s `build()` to discover `_staticPaths.ts` and `*.staticPaths.ts`; optionally validate export type via TypeInfoApi; emit static-path metadata (e.g. list of module paths and scopes) in the generated output or a sidecar.
- **CLI build** (`packages/cli`): After `runViteBuild` for server (and client), add a step: load static-path metadata, run Effects (with server runtime), collect URLs, then for each URL run the render pipeline and write HTML. This implies the build has access to a way to “run” the server render path (in-process or subprocess).
- **Server / ssrForHttp** (`packages/ui` or `@typed/app`): The render path is already “given a URL, return HTML”. Build step can call the same logic (e.g. a function that takes URL and returns `Effect<string>`) without starting an HTTP server; alternatively, start a temporary server and GET each URL.

## Open questions and risks

| Topic                   | Question / risk                                                                                 | Options                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Runtime for Effects** | How does the build provide the R (Layer) when running getStaticPaths?                           | Use server entry’s Layer; or a dedicated “static build” entry that only provides Scope + Router + minimal deps. |
| **URL → file path**     | How to map URL (and query) to output file?                                                      | Path-only: `/about` → `about/index.html`. Query: ignore, or encode in filename (e.g. `users_page_1.html`).      |
| **Parallelism**         | Render URLs in parallel or sequentially?                                                        | Parallel with a concurrency limit to avoid OOM; order not required.                                             |
| **Incremental**         | Re-render only when route or staticPaths change?                                                | Phase 2; first version can do full static pass every build.                                                     |
| **Base path**           | Vite `base` (e.g. `/app/`) must be applied to URLs and to output paths.                         | Resolve from TypedConfig/Vite config during build.                                                              |
| **Validation**          | TypeInfo check for “Effect returning Iterable<string>” may need a new type target or heuristic. | Reuse Effect/Iterable type targets; or validate at runtime when we run the Effect.                              |

## Recommendation

1. **Convention**: Adopt `_staticPaths.ts` (dir) and `*.staticPaths.ts` (route companion) with `export default` or `export const getStaticPaths`; support in-file `getStaticPaths` on route modules.
2. **Contract**: Effect that returns `Iterable<string>` or `AsyncIterable<string>` (URL path + optional query).
3. **Discovery**: Extend router VM plugin to discover and validate these files and emit a static-path manifest (module paths + scope). Keep discovery synchronous and TypeInfo-based where possible.
4. **Build**: Add a post-server-build step in `typed build` that: loads manifest, runs each Effect under app runtime, collects URLs, then for each URL runs the existing SSR render pipeline and writes HTML to a well-defined output dir (e.g. `dist/client` with path-based filenames, or `dist/static`).
5. **Risks**: Resolve “runtime for Effects” and “URL → file path” in the next iteration (requirements or implementation plan).

## References

- Router VM spec: `.docs/specs/router-virtual-module-plugin/spec.md`
- Router VM discovery: `packages/app/src/internal/buildRouteDescriptors.ts`, `RouterVirtualModulePlugin.ts`
- SSR pipeline: `packages/ui/src/HttpRouter.ts` (`ssrForHttp`, `renderToHtmlString`)
- Build command: `packages/cli/src/commands/build.ts`
- Workflow: `.docs/workflows/20260226-1400-cli-spa-vite-virtual-modules/` (00-init, 01-brainstorming, 02-research)
