# Requirements - Typed Framework Starter

Status: approved on 2026-05-16 by human after specification-stage revisions.

## Functional Requirements

- FR-1: `@typed/cli` shall expose `typed create` to scaffold a new Typed pnpm workspace from a maintained starter template.
- FR-2: The starter workspace shall be minimal but multi-package.
- FR-3: Typed shall make SSR, CSR, and multi-page application modes easy to configure and manage with minimal out-of-the-box configuration.
- FR-4: The starter shall include exactly one primary SSR + hydrated application path while leaving the framework configuration shape ready for CSR and multi-page apps.
- FR-5: The starter shall exercise `typed.config.ts`, `@typed/vite-plugin`, router virtual modules, HttpApi virtual modules, Environment virtual modules, config virtual modules, tests, lint, format, and build scripts.
- FR-6: All framework code generation shall remain virtual-module based; this tranche shall not add actual filesystem routing or a framework-owned route tree.
- FR-7: `@typed/app` shall provide a global Environment virtual module plugin for `typed:env`.
- FR-8: The `typed:env` virtual module shall generate named exports from environment entries, equivalent in shape to mapping `Object.entries(process.env)` into `export const <key> = <json value>` declarations.
- FR-9: `@typed/app` shall provide a global config virtual module plugin for `typed:config`.
- FR-10: The `typed:config` virtual module shall expose the computed config loaded from `typed.config.ts`.
- FR-11: `@typed/app` shall provide a `typed:server` virtual module plugin that generates server entrypoint helpers.
- FR-12: `typed:server` shall accept query parameters for multiple HttpApi modules and multiple router modules, for example `typed:server?api=./api&routes=./routes1&routes=./routes2`.
- FR-13: `typed:server` shall export a `run` helper that automates construction of multiple HttpApis and multiple router modules into one server build.
- FR-14: `typed:server` shall support companion files, analogous to router and HttpApi companion conventions, to automate server entrypoint assembly.
- FR-15: `@typed/app` shall provide a `typed:browser` virtual module plugin that generates browser entrypoint helpers.
- FR-16: `typed:browser` shall accept route query parameters, including convention-based selection such as `typed:browser?routes=*`.
- FR-17: `typed:browser` shall support companion files, analogous to router and HttpApi companion conventions, to automate browser entrypoint assembly.
- FR-18: `@typed/app` shall provide a `typed:html` virtual module plugin.
- FR-19: `typed:html?path=./path` shall reference the same HTML files and transformations that Vite uses for dev servers, but make them available for server-side rendering during production builds.
- FR-20: `@typed/vite-plugin` shall integrate `vavite` automatically whenever it discovers a server entry, unless research finds a concrete incompatibility.
- FR-21: The framework dev server shall use one Vite-backed server for client assets, SSR rendering, and HttpApi handlers.
- FR-22: The framework dev server shall not require a separate API server beside Vite.
- FR-23: The Vite-backed dev server path shall use the `import.meta.env.DEV` branch to select the vavite-backed Vite dev server.
- FR-24: The non-dev server path shall use `http.createServer()` through Typed's server-layer abstraction.
- FR-25: Any dev-only static or middleware behavior supplied by Vite shall have explicit non-dev replacements, including static asset serving inferred from Typed configuration and conventions.
- FR-26: `@typed/app` shall expose `TypedHttpServer.layer(...)` as the clean public server-layer API for framework apps.
- FR-27: `TypedHttpServer.layer(...)` shall feel analogous to `NodeHttpServer.layer(createServer, ...)` while hiding dev/local/production server selection.
- FR-28: `TypedHttpServer.layer(...)` shall support Vite/vavite-backed dev mode, non-dev Node HTTP mode, and production static asset serving inferred from `typed.config.ts`, app mode, build output conventions, and starter conventions.
- FR-29: `TypedHttpServer.layer(...)` shall support provided SSL certificate/key material.
- FR-30: `TypedHttpServer.layer(...)` shall support `ssl: true` for generated development certificates under `node_modules/.typed/certs/`.
- FR-31: `TypedHttpServer.layer(...)` shall support explicit `ssl: { key, cert }` paths for provided certificate material.
- FR-32: Generated `api:` modules shall consume `TypedHttpServer.layer(...)` or a thin helper built on it instead of directly choosing `NodeHttpServer.layer(http.createServer, ...)` in final framework paths.
- FR-33: The initial design shall leave a clear future extension path for SSG and incremental SSG without implementing those modes in this tranche.
- FR-34: The starter shall use `typed create` output as a regression fixture where practical.

## Non-Functional Requirements

- NFR-1: Framework behavior must remain composable; users should be able to import generated virtual modules explicitly without surrendering control to a filesystem router.
- NFR-2: Dev server behavior must preserve Vite HMR/module invalidation for client code and server-side app code where `vavite` supports it.
- NFR-3: Non-dev serving must not depend on Vite dev middleware being present.
- NFR-4: Server-layer APIs should isolate unstable Effect HTTP/HttpApi details behind thin Typed helpers.
- NFR-5: Configuration must be inspectable and declarative, especially for server mode, static assets, SSL, env, and generated config surfaces.
- NFR-6: The starter must stay small enough to be understandable as a starting point, not a full reference application.
- NFR-7: New virtual plugins must participate in the shared virtual-module artifact model and fail clearly on invalid source/config inputs.
- NFR-8: Requirements and later plan tasks must maintain traceability from acceptance criteria to implementation tasks.
- NFR-9: App-mode configuration should minimize required user config while keeping SSR, CSR, MPA, and future SSG behavior explicit and inspectable.

## Acceptance Criteria

- AC-1: Running `typed create <name>` creates a pnpm workspace with multiple packages and no unrelated template variants. Maps to FR-1, FR-2, NFR-6.
- AC-2: The generated workspace can install, test, build, and run the single SSR + hydrated application through documented scripts. Maps to FR-4, FR-5, FR-34.
- AC-3: The framework config surface documents or tests SSR, CSR, and MPA mode selection with minimal required config. Maps to FR-3, FR-4, NFR-9.
- AC-4: The starter app imports and uses router, HttpApi, generated exports from `typed:env`, and `typed:config` virtual modules. Maps to FR-5, FR-7, FR-8, FR-9, FR-10.
- AC-5: No implementation task introduces actual filesystem routing as the app-routing mechanism. Maps to FR-6, NFR-1.
- AC-6: `typed:server?api=./api&routes=./routes1&routes=./routes2` generates a `run` helper that composes multiple APIs and routers. Maps to FR-11, FR-12, FR-13, NFR-1.
- AC-7: `typed:server` companion files affect generated server assembly deterministically. Maps to FR-14, NFR-7.
- AC-8: `typed:browser?routes=*` generates browser entrypoint helpers from route conventions. Maps to FR-15, FR-16, NFR-1.
- AC-9: `typed:browser` companion files affect generated browser assembly deterministically. Maps to FR-17, NFR-7.
- AC-10: `typed:html?path=./path` produces an SSR-usable HTML reference that follows Vite dev transformations and production build equivalents. Maps to FR-18, FR-19, NFR-3.
- AC-11: A project with a discovered server entry serves client assets, SSR output, and HttpApi responses through one Vite/vavite-backed process without a manual vavite opt-in flag. Maps to FR-20, FR-21, FR-22, NFR-2.
- AC-12: Server code contains a tested mode split equivalent to `import.meta.env.DEV ? vavite-backed-vite-dev-server : http.createServer()`. Maps to FR-23, FR-24.
- AC-13: Non-dev mode serves built static assets without Vite dev middleware and without requiring an explicit static-file config block. Maps to FR-25, FR-28, NFR-3, NFR-5.
- AC-14: `TypedHttpServer.layer(...)` can be used by app/server code in place of directly wiring `NodeHttpServer.layer(createServer, ...)`. Maps to FR-26, FR-27, FR-28, NFR-4.
- AC-15: `TypedHttpServer.layer(...)` accepts `ssl: true` and generates development certs under `node_modules/.typed/certs/`. Maps to FR-30, NFR-5.
- AC-16: `TypedHttpServer.layer(...)` accepts explicit `ssl: { key, cert }` paths for provided certificates. Maps to FR-29, FR-31, NFR-5.
- AC-17: Generated `api:` server helpers no longer hard-code the final server-layer choice. Maps to FR-32, NFR-4.
- AC-18: Env/config/server/browser/html virtual plugin invalid inputs produce clear diagnostics. Maps to FR-7, FR-8, FR-9, FR-10, FR-11, FR-15, FR-18, NFR-7.
- AC-19: The spec identifies SSG and incremental SSG as future extension modes without requiring implementation in this tranche. Maps to FR-33, NFR-9.
- AC-20: Requirements remain traceable into specification and plan task IDs before execution starts. Maps to NFR-8.

## Prioritization

- must_have:
  - FR-1 through FR-33
  - NFR-1 through NFR-9
  - AC-1 through AC-20
- should_have:
  - FR-34
- could_have:
  - Future `create-typed` / `pnpm create typed` package compatibility.

## Open Questions

- None.
