# Testing Strategy - Typed Framework Starter

Status: approved on 2026-05-16 by human.

## Test Type Taxonomy

- unit:
  - `typed:env`, `typed:config`, `typed:server`, `typed:browser`, and `typed:html` virtual module generation.
  - server entry discovery.
  - `TypedHttpServer.layer(...)` mode selection and SSL option parsing.
  - `typed create` template copy/substitution helpers.
- integration:
  - `@typed/vite-plugin` automatic vavite installation when a server entry is discovered.
  - generated `api:` modules delegating to `TypedHttpServer.layer(...)`.
  - starter workspace build/test/lint commands.
  - non-dev static serving without Vite middleware.
- e2e:
  - scaffold a workspace with `typed create`, install dependencies, run dev/build/test flow, and verify SSR + hydration + HttpApi responses.

## Critical-Path Test Scenarios

| scenario_id | scenario                                                                                                                     | requirement_links                                   | acceptance_links | blocking |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------- | -------- |
| TS-1        | `typed create <name>` creates the minimal multi-package workspace.                                                           | FR-1, FR-2, NFR-6                                   | AC-1             | yes      |
| TS-2        | Generated starter installs, tests, builds, and runs the SSR + hydrated app.                                                  | FR-4, FR-5, FR-34                                   | AC-2             | yes      |
| TS-3        | Framework config surface covers SSR, CSR, and MPA with minimal required config.                                              | FR-3, FR-4, NFR-9                                   | AC-3             | yes      |
| TS-4        | Starter imports router, HttpApi, generated exports from `typed:env`, and `typed:config`.                                     | FR-5, FR-7, FR-8, FR-9, FR-10                       | AC-4             | yes      |
| TS-5        | No actual filesystem routing is introduced in the framework starter path.                                                    | FR-6, NFR-1                                         | AC-5             | yes      |
| TS-6        | `typed:server?api=./api&routes=./routes1&routes=./routes2` generates a `run` helper that composes multiple APIs and routers. | FR-11, FR-12, FR-13, NFR-1                          | AC-6             | yes      |
| TS-7        | `typed:server` companion files affect server assembly deterministically.                                                     | FR-14, NFR-7                                        | AC-7             | yes      |
| TS-8        | `typed:browser?routes=*` generates browser entrypoint helpers from route conventions.                                        | FR-15, FR-16, NFR-1                                 | AC-8             | yes      |
| TS-9        | `typed:browser` companion files affect browser assembly deterministically.                                                   | FR-17, NFR-7                                        | AC-9             | yes      |
| TS-10       | `typed:html?path=./path` follows Vite HTML transforms for dev and production SSR references.                                 | FR-18, FR-19, NFR-3                                 | AC-10            | yes      |
| TS-11       | `typedVitePlugin()` automatically installs vavite when it discovers a server entry.                                          | FR-20, FR-21, FR-22, NFR-2                          | AC-11            | yes      |
| TS-12       | Server mode split selects vavite-backed dev server under `import.meta.env.DEV` and `http.createServer()` otherwise.          | FR-23, FR-24                                        | AC-12            | yes      |
| TS-13       | Non-dev server serves built static assets without Vite middleware or explicit static config.                                 | FR-25, FR-28, NFR-3, NFR-5                          | AC-13            | yes      |
| TS-14       | `TypedHttpServer.layer(...)` replaces direct app wiring of `NodeHttpServer.layer(createServer, ...)`.                        | FR-26, FR-27, FR-28, NFR-4                          | AC-14            | yes      |
| TS-15       | `ssl: true` generates certs under `node_modules/.typed/certs/`.                                                              | FR-30, NFR-5                                        | AC-15            | yes      |
| TS-16       | `ssl: { key, cert }` validates and uses provided certificate paths.                                                          | FR-29, FR-31, NFR-5                                 | AC-16            | yes      |
| TS-17       | Generated `api:` helpers delegate server choice to Typed server helpers.                                                     | FR-32, NFR-4                                        | AC-17            | yes      |
| TS-18       | Env/config/server/browser/html virtual plugin invalid inputs produce clear diagnostics.                                      | FR-7, FR-8, FR-9, FR-10, FR-11, FR-15, FR-18, NFR-7 | AC-18            | yes      |
| TS-19       | Spec preserves future SSG and incremental SSG extension points without implementation.                                       | FR-33, NFR-9                                        | AC-19            | yes      |
| TS-20       | Plan task IDs map back to FR/NFR/AC before execution.                                                                        | NFR-8                                               | AC-20            | yes      |

## Coverage Targets

- Critical-path scenarios: 100% of blocking `TS-*` scenarios must pass before finalization.
- Package tests:
  - affected package unit/integration tests must pass.
  - starter fixture tests must pass.
- Final verification target:
  - `pnpm -r run test`
  - `pnpm -r build`
  - `pnpm build`
  - `git diff --check`

## Dependency Readiness Matrix

| dependency                      | needed_for                                          | status                     | unblock_action                                                                 |
| ------------------------------- | --------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| Vite 8 / current workspace Vite | vavite integration, dev server                      | ready in workspace catalog | verify vavite compatibility during execution                                   |
| `vavite`                        | one-server SSR/HttpApi dev path                     | new dependency             | add and pin through workspace/catalog if implementation confirms compatibility |
| Effect HttpServer/HttpApi       | `TypedHttpServer.layer(...)`, generated API helpers | ready but unstable         | isolate behind `@typed/app` helpers                                            |
| virtual artifact store          | env/config virtual modules                          | ready                      | ensure new plugins use shared resolver/artifact path                           |
| certificate generation helper   | generated dev SSL certs                             | missing                    | choose implementation during planning/execution                                |

## Acceptance Failure Policy

- A blocking `TS-*` failure loops back to implementation for the mapped requirement before finalization.
- A dependency marked missing must be unblocked before executing dependent tasks.
- If vavite compatibility fails, loop back to specification with evidence and revise ADR/spec before implementing a custom server path.
- If SSL generation cannot be implemented safely in v1, loop back to requirements because `ssl: true` is currently must-have.
