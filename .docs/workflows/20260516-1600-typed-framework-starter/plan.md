# Typed Framework Starter Implementation Plan

Status: completed and published to PR #3 on 2026-05-16.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` when the human explicitly authorizes subagents, otherwise execute task-by-task in this session with `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Typed framework slice: virtual-module-first SSR/CSR/MPA app surfaces, one Vite/vavite-backed dev server, production Node HTTP/static serving, SSL support, and a `typed create` starter workspace.

**Architecture:** Each framework virtual module owns a separate behavior contract, parser, generator, and test slice. `@typed/app` owns virtual modules plus `TypedHttpServer.layer(...)`; `@typed/vite-plugin` registers every app VM and automatically installs vavite for discovered server entries; `@typed/cli` owns `typed create` and uses the starter as an executable regression fixture. Dev uses vavite `runnable-handler` so Vite owns the single process; non-dev starts a Node `http.createServer()` and serves built static assets without Vite middleware.

**Tech Stack:** TypeScript, Effect unstable HttpApi/HttpServer, Vite 8 workspace APIs, vavite 7, pnpm, Vitest, virtual-module artifact plugins.

## Routing Decision

| decision                  | result                                      | rationale                                                                                         |
| ------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| task shape                | multi-stream framework implementation       | each virtual module, Vite integration, CLI scaffold, and e2e validation are separable workstreams |
| subagent policy           | deferred until explicit human authorization | current tool policy only permits spawning subagents when the user explicitly asks for delegation  |
| execution mode until then | direct sequential execution                 | preserves the strict stage gate and avoids unapproved parallel mutation                           |

## External References

- vavite 7 currently exposes handler entries and server entries; handler entries mount a Node-compatible handler into Vite dev, while server entries start another server and proxy to it. Typed will use handler entries.
- vavite 7 peer requirements are `vite ~7.3 || 8` and Node `22 || 24 || 25 || 26`, matching the current workspace direction.
- Vite SSR guidance says production must move Vite dev-server usage behind dev-only branches and serve `dist/client` assets with static middleware.

## Virtual Module Contracts

### Existing `router:` Contract

| field            | contract                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| owned_by         | existing `createRouterVirtualModulePlugin`                                                                                              |
| accepted_id      | `router:<relative-directory>`                                                                                                           |
| current_behavior | discovers route modules from the referenced explicit directory and emits a typed Matcher                                                |
| planning_scope   | no route tree or filesystem router inversion; only integration tests that `typed:server` and `typed:browser` can consume router outputs |
| options          | existing plugin prefix option remains owned by router VM config                                                                         |
| diagnostics      | preserve existing `RVM-*` diagnostics                                                                                                   |

### Existing `api:` Contract

| field            | contract                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| owned_by         | existing `createHttpApiVirtualModulePlugin`                                                                                |
| accepted_id      | `api:<relative-directory>`                                                                                                 |
| current_behavior | discovers endpoint modules from the referenced explicit directory and emits Api, Client, OpenAPI, and server helper source |
| planning_scope   | update generated final server helper to delegate to `TypedHttpServer.layer(...)`                                           |
| options          | existing plugin prefix and `pathPrefix` options remain owned by HttpApi VM config                                          |
| diagnostics      | preserve existing HttpApi diagnostics                                                                                      |

### New `typed:env` Contract

| field             | contract                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------- |
| accepted_id       | exactly `typed:env`                                                                          |
| query_options     | none in this tranche                                                                         |
| source_of_truth   | `process.env` entries observed by the virtual module build                                   |
| generated_exports | one named `export const <ENV_KEY> = <JSON value>;` per environment entry                     |
| invalid_keys      | fail clearly; do not normalize names in this tranche                                         |
| valid_key_rule    | key must be a valid JavaScript binding identifier and not a reserved word                    |
| value_rule        | values are JSON stringified exactly as provided by `process.env`                             |
| diagnostics       | `TVM-ENV-001` invalid export name, `TVM-ENV-002` unsupported query option                    |
| tests             | source emission, reserved word rejection, punctuation rejection, unsupported query rejection |

### New `typed:config` Contract

| field              | contract                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| accepted_id        | exactly `typed:config`                                                                                                                                                   |
| query_options      | none in this tranche                                                                                                                                                     |
| source_of_truth    | existing shared `loadTypedConfig({ projectRoot, ts })` behavior                                                                                                          |
| generated_exports  | `Object.entries(config).map(toExportString).join("\n")`; one named `export const <CONFIG_KEY> = <JSON value>;` per top-level computed config entry and no default export |
| serialization_rule | computed config must be JSON-serializable; non-serializable values fail clearly                                                                                          |
| invalid_keys       | fail clearly; do not normalize names in this tranche                                                                                                                     |
| valid_key_rule     | key must be a valid JavaScript binding identifier and not a reserved word                                                                                                |
| diagnostics        | `TVM-CONFIG-001` config load failed, `TVM-CONFIG-002` config cannot be serialized, `TVM-CONFIG-003` unsupported query option, `TVM-CONFIG-004` invalid export name       |
| tests              | named export emission, empty computed config behavior, load failure diagnostic, invalid key rejection, unsupported query rejection                                       |

### New `typed:html` Contract

| field             | contract                                                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accepted_id       | `typed:html?path=<relative-html-path>`                                                                                                                                 |
| required_options  | `path` exactly once                                                                                                                                                    |
| optional_options  | `outlet`, default `<!--typed-ssr-outlet-->`                                                                                                                            |
| generated_exports | `html`, `loadHtml`, and `renderHtml`                                                                                                                                   |
| dev_behavior      | read the source HTML and apply Vite-compatible HTML transforms through the dev server path                                                                             |
| non_dev_behavior  | read the built client HTML from inferred build output; never require Vite dev middleware                                                                               |
| render_behavior   | replace the configured outlet when present; if missing, insert SSR markup immediately after `<body>`; if `<body>` is missing, append SSR markup to the end of the file |
| mpa_behavior      | reusable per page; each page entry owns its own HTML path and client entry relationship                                                                                |
| diagnostics       | `TVM-HTML-001` missing path, `TVM-HTML-002` duplicate path, `TVM-HTML-003` invalid extension, `TVM-HTML-005` unsupported query option                                  |
| tests             | path parsing, outlet option, dev transform delegation, production asset reference, outlet replacement, body insertion fallback, end-of-file insertion fallback         |

### New `typed:server` Contract

| field              | contract                                                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accepted_id        | `typed:server?<query>`                                                                                                                                                                                          |
| required_options   | at least one `api` or `routes` parameter                                                                                                                                                                        |
| repeatable_options | `api`, `routes`                                                                                                                                                                                                 |
| optional_options   | `html`, `client`, `page`, `base`, `name`                                                                                                                                                                        |
| generated_exports  | `run`, `handler`, and `ServerLayer`; `run` returns an `Effect` for user composition                                                                                                                             |
| api_behavior       | imports each `api` target through the configured HttpApi VM prefix and composes all APIs into one server path                                                                                                   |
| routes_behavior    | imports each `routes` target through the configured router VM prefix and composes all routers after API handling                                                                                                |
| html_behavior      | if one `html` is provided, imports `typed:html?path=<html>` for the default SSR fallback rendering                                                                                                              |
| mpa_behavior       | repeated `page` parameters declare multiple HTML/client pairings; each `page` value uses `name:html:client` and creates a separate SSR fallback entry                                                           |
| client_behavior    | `client` identifies the browser entry paired with the default `html`; when `page` is used, `client` is disallowed to avoid ambiguous pairing                                                                    |
| order_rule         | repeated query parameters are processed in source order; generated imports use stable deterministic names                                                                                                       |
| companion_files    | optional named companion modules next to the importer, not inside route/API directories                                                                                                                         |
| companion_names    | `.layout.ts`, `.dependencies.ts`, `.middleware.ts`, `.html.ts`, `.server.ts`, `.config.ts`, `.errors.ts`                                                                                                        |
| companion_behavior | companion files layer environment-specific dependencies, layouts, middleware, HTML/page configuration, server options, config, and error handling over the explicit virtual module query                        |
| companion_rule     | companion files are optional, deterministic, and entry-scoped; invalid shapes fail clearly                                                                                                                      |
| diagnostics        | `TVM-SERVER-001` no api/routes/html/pages, `TVM-SERVER-002` invalid target, `TVM-SERVER-003` unsupported option, `TVM-SERVER-004` invalid companion export, `TVM-SERVER-005` ambiguous html/client/page pairing |
| tests              | multi-api/multi-route source, default html/client pairing, repeated page pairings, query order, named companion imports, ambiguous pairing diagnostic                                                           |

### New `typed:browser` Contract

| field              | contract                                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accepted_id        | `typed:browser?<query>`                                                                                                                                  |
| required_options   | at least one `routes` parameter                                                                                                                          |
| repeatable_options | `routes`                                                                                                                                                 |
| optional_options   | `root`, `base`, `mode`, `name`                                                                                                                           |
| option_defaults    | `root="#app"`, `base="/"`, `mode="hydrate"`                                                                                                              |
| generated_exports  | `run`, `hydrate`, and `BrowserRuntime`; `run` and `hydrate` return `Effect`s for user composition                                                        |
| routes_behavior    | `routes=*` resolves by convention from the importing entry; explicit `routes=./dir` imports that router VM target                                        |
| mode_behavior      | `hydrate` hydrates SSR markup; `mount` performs CSR mount; `mpa` prepares per-entry bootstrap without changing router ownership                          |
| mpa_behavior       | a browser entry may be paired with exactly one HTML page by `typed:server`; multiple pages use multiple browser entries                                  |
| companion_files    | optional named companion modules next to the importer, not inside route directories                                                                      |
| companion_names    | `.layout.ts`, `.dependencies.ts`, `.browser.ts`, `.navigation.ts`, `.config.ts`, `.errors.ts`                                                            |
| companion_behavior | companion files layer browser-specific layout, dependencies, runtime config, navigation hooks, and error handling over the explicit virtual module query |
| companion_rule     | companion files are optional, deterministic, and entry-scoped; invalid shapes fail clearly                                                               |
| diagnostics        | `TVM-BROWSER-001` no routes, `TVM-BROWSER-002` invalid mode, `TVM-BROWSER-003` unsupported option, `TVM-BROWSER-004` invalid companion export            |
| tests              | wildcard route convention, explicit routes, mode defaults, named companion imports, invalid mode diagnostic                                              |

## File Structure

| path                                                            | responsibility                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `packages/app/src/internal/frameworkVirtualModuleId.ts`         | parse `typed:*` virtual module IDs and strict query parameters                 |
| `packages/app/src/internal/frameworkDiagnostics.ts`             | shared diagnostic constructors for env/config/server/browser/html VMs          |
| `packages/app/src/internal/emitEnvSource.ts`                    | emit `typed:env` source from validated `process.env` keys                      |
| `packages/app/src/internal/emitConfigSource.ts`                 | emit `typed:config` source from resolved `TypedConfig`                         |
| `packages/app/src/internal/emitHtmlSource.ts`                   | emit `typed:html` source for dev transform and production artifact references  |
| `packages/app/src/internal/emitServerSource.ts`                 | emit `typed:server` `run`, `handler`, and `ServerLayer` helper source          |
| `packages/app/src/internal/emitBrowserSource.ts`                | emit `typed:browser` `run`, `hydrate`, and `BrowserRuntime` helper source      |
| `packages/app/src/internal/serverCompanions.ts`                 | discover and validate entry-adjacent server companion modules                  |
| `packages/app/src/internal/browserCompanions.ts`                | discover and validate entry-adjacent browser companion modules                 |
| `packages/app/src/EnvVirtualModulePlugin.ts`                    | `typed:env` plugin                                                             |
| `packages/app/src/ConfigVirtualModulePlugin.ts`                 | `typed:config` plugin                                                          |
| `packages/app/src/HtmlVirtualModulePlugin.ts`                   | `typed:html` plugin                                                            |
| `packages/app/src/ServerVirtualModulePlugin.ts`                 | `typed:server` plugin                                                          |
| `packages/app/src/BrowserVirtualModulePlugin.ts`                | `typed:browser` plugin                                                         |
| `packages/app/src/TypedHttpServer.ts`                           | public `TypedHttpServer.layer(...)`, handler construction, static serving, SSL |
| `packages/app/src/index.ts`                                     | exports new plugins and server helper                                          |
| `packages/vite-plugin/src/index.ts`                             | register all app VMs and append vavite when server entry exists                |
| `packages/vite-plugin/src/vaviteIntegration.ts`                 | isolate vavite import/options/discovery logic                                  |
| `packages/cli/src/commands/create.ts`                           | `typed create <name>` command                                                  |
| `packages/cli/src/create/scaffold.ts`                           | copy template and substitute package names                                     |
| `packages/cli/templates/starter/`                               | maintained pnpm starter workspace                                              |
| `.docs/workflows/20260516-1600-typed-framework-starter/memory/` | short-term execution notes for follow-on tasks                                 |

## Subgoal DAG

| subgoal_id | objective                                        | prerequisites          | risk   | requirement_links                        | success_check                                                                                 |
| ---------- | ------------------------------------------------ | ---------------------- | ------ | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| SG-1       | shared framework VM parser/diagnostic foundation | approved spec          | medium | FR-6, NFR-1, NFR-7, AC-5, AC-18          | parser tests fail then pass for all `typed:*` IDs and option contracts                        |
| SG-2       | `typed:env` virtual module                       | SG-1                   | medium | FR-7, FR-8, AC-4, AC-18                  | generated env source and invalid key diagnostics pass                                         |
| SG-3       | `typed:config` virtual module                    | SG-1                   | medium | FR-9, FR-10, AC-4, AC-18                 | generated config source uses shared computed config loader                                    |
| SG-4       | `typed:html` virtual module                      | SG-1                   | high   | FR-18, FR-19, AC-10, AC-18               | dev transform, non-dev built HTML references, and outlet insertion fallbacks pass             |
| SG-5       | `typed:server` virtual module                    | SG-1, SG-2, SG-3, SG-4 | high   | FR-11-FR-14, AC-6, AC-7, AC-18           | multi-api/multi-route source, MPA page pairings, and entry-adjacent companion tests pass      |
| SG-6       | `typed:browser` virtual module                   | SG-1, SG-2, SG-3       | high   | FR-15-FR-17, AC-8, AC-9, AC-18           | wildcard/explicit routes, MPA browser entry behavior, and entry-adjacent companion tests pass |
| SG-7       | `TypedHttpServer.layer(...)`                     | SG-4, SG-5             | high   | FR-23-FR-31, AC-12-AC-16                 | mode split, static serving, and SSL tests pass                                                |
| SG-8       | vavite integration in `@typed/vite-plugin`       | SG-2-SG-7              | high   | FR-20-FR-22, NFR-2, AC-11                | discovered server entry adds vavite runnable handler and preserves VM order                   |
| SG-9       | generated `api:` server helper delegation        | SG-7                   | high   | FR-32, NFR-4, AC-17                      | generated API source no longer hard-codes `NodeHttpServer.layer(http.createServer, ...)`      |
| SG-10      | `typed create` starter workspace                 | SG-2-SG-9              | high   | FR-1-FR-5, FR-33-FR-34, AC-1-AC-4, AC-19 | scaffolded workspace installs, tests, builds, and runs SSR/hydration/HttpApi smoke            |
| SG-11      | final docs, memory, verification, PR readiness   | SG-10                  | medium | NFR-8, AC-20                             | traceability table complete and final verification commands pass or have documented blockers  |

## Ordered Tasks

| task_id | owner                        | prerequisites | validation                                                                  | safeguards                                                                                        | rollback                                        |
| ------- | ---------------------------- | ------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| T1      | framework VM foundation      | approved plan | `pnpm --filter @typed/app test -- frameworkVirtualModuleId`                 | only add internal helpers and tests                                                               | revert helper/test files                        |
| T2      | `typed:env` VM               | T1            | `pnpm --filter @typed/app test -- EnvVirtualModulePlugin`                   | no key normalization; fail on invalid export names                                                | revert env VM files and export                  |
| T3      | `typed:config` VM            | T1            | `pnpm --filter @typed/app test -- ConfigVirtualModulePlugin`                | use shared config loader; no second config semantics                                              | revert config VM files and export               |
| T4      | `typed:html` VM              | T1            | `pnpm --filter @typed/app test -- HtmlVirtualModulePlugin`                  | non-dev never depends on Vite middleware                                                          | revert html VM files and export                 |
| T5      | `typed:server` VM            | T1-T4         | `pnpm --filter @typed/app test -- ServerVirtualModulePlugin`                | page pairings explicit; query order deterministic; no filesystem routing                          | revert server VM files and companion helper     |
| T6      | `typed:browser` VM           | T1-T3         | `pnpm --filter @typed/app test -- BrowserVirtualModulePlugin`               | browser entries stay pairable by server pages; wildcard conventions do not create route ownership | revert browser VM files and companion helper    |
| T7      | `TypedHttpServer.layer(...)` | T4, T5        | `pnpm --filter @typed/app test -- TypedHttpServer`                          | generated certs stay under `node_modules/.typed/certs/`                                           | revert server helper and tests                  |
| T8      | vavite plugin integration    | T2-T7         | `pnpm --filter @typed/vite-plugin test`                                     | choose `runnable-handler`; keep `vavite` isolated                                                 | revert vavite integration and package metadata  |
| T9      | `api:` helper delegation     | T7            | `pnpm --filter @typed/app test -- HttpApiVirtualModulePlugin`               | preserve existing Api/Client/OpenAPI exports                                                      | revert focused `emitHttpApiSource.ts` changes   |
| T10     | `typed create` command       | T2-T9         | `pnpm --filter @typed/cli test -- create`                                   | template copy ignores generated install artifacts                                                 | revert create command/template files            |
| T11     | starter e2e fixture          | T10           | scaffold temp workspace, then run `pnpm install`, `pnpm test`, `pnpm build` | run in temp dir; do not mutate repository root                                                    | delete temp fixture and revert template updates |
| T12     | docs/memory/final gates      | T11           | `pnpm -r run test`, `pnpm -r build`, `pnpm build`, `git diff --check`       | record environment failures separately from code failures                                         | revert docs-only updates if inaccurate          |

## Detailed Task Steps

### T1: Framework VM Foundation

**Files:**

- Create: `packages/app/src/internal/frameworkVirtualModuleId.ts`
- Create: `packages/app/src/internal/frameworkVirtualModuleId.test.ts`
- Create: `packages/app/src/internal/frameworkDiagnostics.ts`

- [ ] Write failing parser tests for `typed:env`, `typed:config`, `typed:html`, `typed:server`, and `typed:browser`.
- [ ] Write failing parser tests for every option contract listed in "Virtual Module Contracts".
- [ ] Run: `pnpm --filter @typed/app test -- frameworkVirtualModuleId`
  - Expected before implementation: FAIL with missing module or missing parser exports.
- [ ] Implement `parseTypedVirtualModuleId(id)` and dedicated typed result variants.
- [ ] Run: `pnpm --filter @typed/app test -- frameworkVirtualModuleId`
  - Expected after implementation: PASS.
- [ ] Commit: `feat(app): add typed framework virtual module parsing`

### T2: `typed:env`

**Files:**

- Create: `packages/app/src/EnvVirtualModulePlugin.ts`
- Create: `packages/app/src/EnvVirtualModulePlugin.test.ts`
- Create: `packages/app/src/internal/emitEnvSource.ts`
- Modify: `packages/app/src/index.ts`

- [ ] Write failing tests for generated named exports from injected env records.
- [ ] Write failing tests that invalid env keys, such as `BAD-NAME` and `default`, return `TVM-ENV-*` diagnostics.
- [ ] Write failing tests that `typed:env?prefix=PUBLIC_` is rejected in this tranche.
- [ ] Run: `pnpm --filter @typed/app test -- EnvVirtualModulePlugin`
  - Expected before implementation: FAIL with missing plugin.
- [ ] Implement source emission from `process.env` with no normalization.
- [ ] Export `createEnvVirtualModulePlugin` from `packages/app/src/index.ts`.
- [ ] Run: `pnpm --filter @typed/app test -- EnvVirtualModulePlugin`
  - Expected after implementation: PASS.
- [ ] Commit: `feat(app): add typed env virtual module`

### T3: `typed:config`

**Files:**

- Create: `packages/app/src/ConfigVirtualModulePlugin.ts`
- Create: `packages/app/src/ConfigVirtualModulePlugin.test.ts`
- Create: `packages/app/src/internal/emitConfigSource.ts`
- Modify: `packages/app/src/index.ts`

- [ ] Write failing tests for named exports from a computed `TypedConfig`.
- [ ] Write failing tests that config load failures return `TVM-CONFIG-*` diagnostics.
- [ ] Write failing tests that invalid config keys, such as `bad-name` and `default`, return `TVM-CONFIG-*` diagnostics.
- [ ] Write failing tests that unsupported query options are rejected.
- [ ] Run: `pnpm --filter @typed/app test -- ConfigVirtualModulePlugin`
  - Expected before implementation: FAIL with missing plugin.
- [ ] Implement source emission by reusing existing config resolution.
- [ ] Export `createConfigVirtualModulePlugin` from `packages/app/src/index.ts`.
- [ ] Run: `pnpm --filter @typed/app test -- ConfigVirtualModulePlugin`
  - Expected after implementation: PASS.
- [ ] Commit: `feat(app): add typed config virtual module`

### T4: `typed:html`

**Files:**

- Create: `packages/app/src/HtmlVirtualModulePlugin.ts`
- Create: `packages/app/src/HtmlVirtualModulePlugin.test.ts`
- Create: `packages/app/src/internal/emitHtmlSource.ts`
- Modify: `packages/app/src/index.ts`

- [ ] Write failing tests for required `path` parsing and optional `outlet`.
- [ ] Write failing tests for `html`, `loadHtml`, and `renderHtml` generated exports.
- [ ] Write failing tests for replacing an existing outlet.
- [ ] Write failing tests for inserting SSR markup immediately after `<body>` when the outlet is missing.
- [ ] Write failing tests for appending SSR markup to the end of the file when both the outlet and `<body>` are missing.
- [ ] Write failing tests that production source references built client HTML instead of Vite dev middleware.
- [ ] Run: `pnpm --filter @typed/app test -- HtmlVirtualModulePlugin`
  - Expected before implementation: FAIL with missing plugin.
- [ ] Implement HTML source emission and diagnostics.
- [ ] Export `createHtmlVirtualModulePlugin` from `packages/app/src/index.ts`.
- [ ] Run: `pnpm --filter @typed/app test -- HtmlVirtualModulePlugin`
  - Expected after implementation: PASS.
- [ ] Commit: `feat(app): add typed html virtual module`

### T5: `typed:server`

**Files:**

- Create: `packages/app/src/ServerVirtualModulePlugin.ts`
- Create: `packages/app/src/ServerVirtualModulePlugin.test.ts`
- Create: `packages/app/src/internal/emitServerSource.ts`
- Create: `packages/app/src/internal/serverCompanions.ts`
- Modify: `packages/app/src/index.ts`

- [ ] Write failing tests for `typed:server?api=./api&routes=./routes1&routes=./routes2` exporting `run`, `handler`, and `ServerLayer`.
- [ ] Write failing tests for repeated `api` and `routes` preserving query order.
- [ ] Write failing tests for default `html` plus `client` pairing.
- [ ] Write failing tests for repeated `page=name:html:client` pairings for MPA.
- [ ] Write failing tests that combining repeated `page` with top-level `html` or `client` returns `TVM-SERVER-005`.
- [ ] Write failing tests for optional `base` and `name` options.
- [ ] Write failing tests for deterministic entry-adjacent server companion discovery and invalid companion diagnostics.
- [ ] Run: `pnpm --filter @typed/app test -- ServerVirtualModulePlugin`
  - Expected before implementation: FAIL with missing plugin.
- [ ] Implement generated source using explicit `api:`, `router:`, and `typed:html` imports.
- [ ] Export `createServerVirtualModulePlugin` from `packages/app/src/index.ts`.
- [ ] Run: `pnpm --filter @typed/app test -- ServerVirtualModulePlugin`
  - Expected after implementation: PASS.
- [ ] Commit: `feat(app): add typed server virtual module`

### T6: `typed:browser`

**Files:**

- Create: `packages/app/src/BrowserVirtualModulePlugin.ts`
- Create: `packages/app/src/BrowserVirtualModulePlugin.test.ts`
- Create: `packages/app/src/internal/emitBrowserSource.ts`
- Create: `packages/app/src/internal/browserCompanions.ts`
- Modify: `packages/app/src/index.ts`

- [ ] Write failing tests for `typed:browser?routes=*` exporting `run`, `hydrate`, and `BrowserRuntime`.
- [ ] Write failing tests for explicit repeated `routes=./dir` options.
- [ ] Write failing tests for `root`, `base`, `mode`, and `name` defaults/options.
- [ ] Write failing tests that `mode=mpa` emits a browser entry suitable for one server page pairing.
- [ ] Write failing tests for deterministic entry-adjacent browser companion discovery and invalid companion diagnostics.
- [ ] Run: `pnpm --filter @typed/app test -- BrowserVirtualModulePlugin`
  - Expected before implementation: FAIL with missing plugin.
- [ ] Implement generated source using explicit `router:` imports.
- [ ] Export `createBrowserVirtualModulePlugin` from `packages/app/src/index.ts`.
- [ ] Run: `pnpm --filter @typed/app test -- BrowserVirtualModulePlugin`
  - Expected after implementation: PASS.
- [ ] Commit: `feat(app): add typed browser virtual module`

### T7: Typed HTTP Server Layer

**Files:**

- Create: `packages/app/src/TypedHttpServer.ts`
- Create: `packages/app/src/TypedHttpServer.test.ts`
- Create: `packages/app/src/internal/staticAssets.ts`
- Create: `packages/app/src/internal/ssl.ts`
- Modify: `packages/app/src/config/TypedConfig.ts`
- Modify: `packages/app/src/index.ts`

- [ ] Write failing tests for dev selection equivalent to `import.meta.env.DEV ? vaviteHandler : http.createServer()`.
- [ ] Write failing tests for non-dev static serving inferred from `dist/client`.
- [ ] Write failing tests for `ssl: true` writing under `node_modules/.typed/certs/`.
- [ ] Write failing tests for `ssl: { key, cert }` validating provided paths.
- [ ] Run: `pnpm --filter @typed/app test -- TypedHttpServer`
  - Expected before implementation: FAIL with missing `TypedHttpServer`.
- [ ] Implement `TypedHttpServer.layer(...)` as a thin public helper around Effect platform server layers.
- [ ] Keep Effect unstable API imports isolated to `TypedHttpServer.ts` and generated API source.
- [ ] Run: `pnpm --filter @typed/app test -- TypedHttpServer`
  - Expected after implementation: PASS.
- [ ] Commit: `feat(app): add typed http server layer`

### T8: Vavite Integration

**Files:**

- Create: `packages/vite-plugin/src/vaviteIntegration.ts`
- Modify: `packages/vite-plugin/src/index.ts`
- Modify: `packages/vite-plugin/src/index.test.ts`
- Modify: `packages/vite-plugin/package.json`
- Modify: `pnpm-lock.yaml`

- [ ] Write failing tests that `createTypedViteResolver()` registers router, HttpApi, env, config, html, server, and browser plugins in stable order.
- [ ] Write failing tests that `typedVitePlugin()` appends vavite when `TypedConfig.entry` resolves to a server entry.
- [ ] Write failing tests that no vavite plugin is added without a server entry.
- [ ] Run: `pnpm --filter @typed/vite-plugin test`
  - Expected before implementation: FAIL because new plugins and vavite integration are missing.
- [ ] Implement lazy vavite integration using `runnable-handler` entries and `appType: "custom"` defaults.
- [ ] Pin `vavite` in the workspace dependency graph after confirming the package manager resolves vavite 7 for Vite 8.
- [ ] Run: `pnpm --filter @typed/vite-plugin test`
  - Expected after implementation: PASS.
- [ ] Commit: `feat(vite-plugin): add vavite backed server entries`

### T9: Generated `api:` Server Delegation

**Files:**

- Modify: `packages/app/src/internal/emitHttpApiSource.ts`
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.test.ts`

- [ ] Write a failing assertion that generated API server helpers import `TypedHttpServer` instead of hard-coding `NodeHttpServer.layer(http.createServer, ...)`.
- [ ] Run: `pnpm --filter @typed/app test -- HttpApiVirtualModulePlugin`
  - Expected before implementation: FAIL on the generated source assertion.
- [ ] Replace final server-layer emission with `TypedHttpServer.layer(...)` while preserving `Api`, `Client`, OpenAPI, Swagger, and Scalar exports.
- [ ] Run: `pnpm --filter @typed/app test -- HttpApiVirtualModulePlugin`
  - Expected after implementation: PASS.
- [ ] Commit: `feat(app): delegate generated api server wiring`

### T10: `typed create` Command And Template

**Files:**

- Create: `packages/cli/src/commands/create.ts`
- Create: `packages/cli/src/commands/create.integration.test.ts`
- Create: `packages/cli/src/create/scaffold.ts`
- Create: `packages/cli/templates/starter/package.json`
- Create: `packages/cli/templates/starter/pnpm-workspace.yaml`
- Create: `packages/cli/templates/starter/packages/app/package.json`
- Create: `packages/cli/templates/starter/packages/app/src/entry.server.ts`
- Create: `packages/cli/templates/starter/packages/app/src/entry.browser.ts`
- Create: `packages/cli/templates/starter/packages/app/src/index.html`
- Create: `packages/cli/templates/starter/packages/app/src/api/index.ts`
- Create: `packages/cli/templates/starter/packages/app/src/routes/index.ts`
- Create: `packages/cli/templates/starter/packages/app/src/_server.ts`
- Create: `packages/cli/templates/starter/packages/app/src/_browser.ts`
- Create: `packages/cli/templates/starter/packages/shared/package.json`
- Create: `packages/cli/templates/starter/packages/shared/src/index.ts`
- Modify: `packages/cli/src/commands/typed.ts`
- Modify: `packages/cli/src/commands/index.ts`

- [ ] Write failing scaffold tests for `typed create my-app` producing a multi-package pnpm workspace.
- [ ] Write failing scaffold tests for package-name substitution and no generated `node_modules` or lockfile artifacts in the template copy.
- [ ] Run: `pnpm --filter @typed/cli test -- create`
  - Expected before implementation: FAIL with missing create command.
- [ ] Implement `create` command with Effect CLI and pure scaffold helpers.
- [ ] Add starter files that import `typed:server`, `typed:browser`, `typed:html`, `typed:env`, `typed:config`, `router:`, and `api:`.
- [ ] Run: `pnpm --filter @typed/cli test -- create`
  - Expected after implementation: PASS.
- [ ] Commit: `feat(cli): add typed create starter`

### T11: Starter E2E Fixture

**Files:**

- Create: `packages/cli/src/commands/create.e2e.test.ts`
- Modify: `packages/cli/templates/starter/packages/app/src/entry.server.ts`
- Modify: `packages/cli/templates/starter/packages/app/src/entry.browser.ts`
- Modify: `packages/cli/templates/starter/packages/app/src/index.html`
- Modify: `packages/cli/templates/starter/packages/app/src/api/index.ts`
- Modify: `packages/cli/templates/starter/packages/app/src/routes/index.ts`

- [ ] Write an e2e test that scaffolds into a temp directory using the built or source CLI command.
- [ ] Write e2e assertions for workspace shape, app test script, app build script, SSR HTML, hydration root, one explicit HTML/client pairing, and HttpApi response through the same server path.
- [ ] Run: `pnpm --filter @typed/cli test -- create.e2e`
  - Expected before template/server completion: FAIL on missing executable behavior.
- [ ] Update the listed starter template files so the e2e assertions exercise the same SSR, hydration, and HttpApi path.
- [ ] Run: `pnpm --filter @typed/cli test -- create.e2e`
  - Expected after implementation: PASS.
- [ ] Commit: `test(cli): verify typed create starter e2e`

### T12: Documentation, Memory, And Final Gates

**Files:**

- Create: `.docs/workflows/20260516-1600-typed-framework-starter/memory/execution-notes.md`
- Modify: `.docs/specs/typed-framework-starter/spec.md`
- Modify: `.docs/specs/typed-framework-starter/testing-strategy.md`
- Modify: `packages/app/README.md`
- Modify: `packages/vite-plugin/README.md`
- Modify: `packages/cli/AGENTS.md`

- [ ] Record implementation decisions that differ from the approved plan in workflow memory.
- [ ] Update spec/testing-strategy only for proven implementation details, not speculative future work.
- [ ] Run: `pnpm -r run test`
  - Expected: PASS.
- [ ] Run: `pnpm -r build`
  - Expected: PASS.
- [ ] Run: `pnpm build`
  - Expected: PASS.
- [ ] Run: `git diff --check`
  - Expected: no whitespace errors.
- [ ] Commit: `docs: finalize typed framework starter implementation`

## Tactical Replanning Triggers

- If any virtual module option needs behavior not listed in "Virtual Module Contracts", pause and revise this plan before implementation.
- If MPA needs implicit HTML/client discovery beyond explicit `page=name:html:client` pairings, loop back to requirements because implicit discovery risks recreating filesystem routing.
- If vavite 7 cannot run with the workspace Vite/Node matrix, pause T8 and revise the vavite ADR/spec with concrete install or test output before custom server work.
- If Effect unstable HttpApi server APIs changed underneath generated `api:` helpers, pause T7/T9 and update only the `TypedHttpServer` adapter surface first.
- If `typed:env` invalid key failure blocks common local environments, loop back to requirements before switching to normalization because that changes the export contract.
- If starter e2e needs more than one app package or more than one starter variant, loop back to scope because minimal starter size is a requirement.
- If a test failure is environmental, capture the command, exit code, and relevant output in workflow memory before changing code.

## Mutating-Action Safeguards

- Commit after each task only after the mapped tests pass.
- Stage only task-owned files; ignore unrelated dirty files such as pre-existing lockfile drift unless the task owns package resolution.
- Run `git diff --check` before every commit.
- Do not introduce actual filesystem routing as an implementation shortcut.
- Keep vavite imports isolated so non-server projects do not need runtime vavite wiring.

## Memory Plan

- capture:
  - `.docs/workflows/20260516-1600-typed-framework-starter/memory/execution-notes.md`
  - task-level command results, failures, and decisions that affect later tasks
- promotion_criteria:
  - promote only durable decisions that affect future Typed framework work, such as env export policy, companion names, vavite entry type, and starter layout
- recall_targets:
  - current workflow requirements/spec/testing strategy
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/specs/httpapi-virtual-module-plugin/spec.md`
  - package `AGENTS.md` files for `@typed/app`, `@typed/vite-plugin`, and `@typed/cli`

## Traceability

| task_id | requirement_links                    | acceptance_links                  |
| ------- | ------------------------------------ | --------------------------------- |
| T1      | FR-6, NFR-1, NFR-7                   | AC-5, AC-18, AC-20                |
| T2      | FR-7, FR-8                           | AC-4, AC-18                       |
| T3      | FR-9, FR-10                          | AC-4, AC-18                       |
| T4      | FR-18, FR-19                         | AC-10, AC-18                      |
| T5      | FR-11-FR-14                          | AC-6, AC-7, AC-18                 |
| T6      | FR-15-FR-17                          | AC-8, AC-9, AC-18                 |
| T7      | FR-23-FR-31, NFR-3, NFR-4, NFR-5     | AC-12, AC-13, AC-14, AC-15, AC-16 |
| T8      | FR-20-FR-22, NFR-2                   | AC-11                             |
| T9      | FR-32, NFR-4                         | AC-17                             |
| T10     | FR-1-FR-5, FR-33-FR-34, NFR-6, NFR-9 | AC-1, AC-2, AC-3, AC-4, AC-19     |
| T11     | FR-1-FR-5, FR-20-FR-32, FR-34        | AC-1-AC-18                        |
| T12     | NFR-8                                | AC-20                             |

## Approval Gate

Does `plan.md` look good?

- LGTM
- Needs sequencing/ownership revisions
- Needs validation/safeguard/rollback revisions
- Other: share custom feedback
