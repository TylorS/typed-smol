# @typed/router

## Intent

Type-safe routing for Effect apps: Route, Matcher, CurrentRoute, and Router with path/query params via Effect Schema. Compose matchers that produce Fx streams and react to path changes.

## Purpose

The router provides **typed routing** for client and server Effect apps: path and query parameters are derived from route path strings and decoded via Effect Schema. Define routes, build a **Matcher** (pattern matching on routes), then `run(matcher)` to get an Fx that switches content as the path changes. Use it for SPAs, SSR, tests, and file-based routing via `@typed/app`.

## Capabilities

| Area                 | APIs                                                                                             | Notes                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Route definition** | `Route.Parse`, `Route.Join`, `Route.Param`, `Route.Number`, `Route.Int`, `Route.ParamWithSchema` | Parse paths like `/todos/:id?filter=`; path/query types from route string; Effect Schema for params.           |
| **Matcher**          | `match`, `empty`, `prefix`, `provide`, `layout`, `catch`, `catchCause`, `catchTag`               | Pattern match routes → Fx; each case yields handler; nest with `prefix`; guards from `@typed/guard`.           |
| **Runtime**          | `BrowserRouter`, `ServerRouter`, `TestRouter`                                                    | Layers providing `Router` (`Navigation` + `CurrentRoute`); browser, in-memory, or test with deterministic IDs. |
| **Integration**      | `@typed/app` router VM plugin, `find-my-way-ts`                                                  | File-based routing: `import { Matcher } from "router:./routes"`; radix-tree matching.                          |

## Key exports / surfaces

- `Route`, `Matcher`, `CurrentRoute`, `Router`, `BrowserRouter`, `ServerRouter`, `TestRouter`
- Dependencies: `@typed/fx`, `@typed/guard`, `@typed/id`, `@typed/navigation`, `effect`, `find-my-way-ts`, `hkt-core`

## Testing

- **Node (default):** `pnpm --filter @typed/router run test` — `Matcher.test.ts`, `Route.test.ts`, `Path.test.ts` via [`vitest.config.ts`](vitest.config.ts).
- **Browser (Chromium):** `pnpm --filter @typed/router run test:browser` — [`Matcher.browser.test.ts`](src/Matcher.browser.test.ts) via [`vitest.browser.config.ts`](vitest.browser.config.ts) and `@vitest/browser-playwright`. One-time (or CI) browser binaries: `pnpm exec playwright install chromium`.

## Constraints

- Effect skill loading: `.cursor/rules/effect-skill-loading.mdc`
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`
- Effect unstable/httpapi skill for HttpRouter integration when applicable

## Pointers

- README for full API reference
- `@typed/app` router VM plugin for file-based Matcher generation (`router:./routes`)
- Siblings: `@typed/navigation`, `@typed/guard`, `@typed/ui`
- Root AGENTS.md for bootup/modes
