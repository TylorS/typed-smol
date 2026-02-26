# Requirements — CLI SPA + Vite Virtual Modules

## Functional Requirements

- **FR-1**: `typed serve` runs without a server entry file — starts Vite SPA dev server only when no server entry exists.
- **FR-2**: `TypedConfig` includes `clients?: string | readonly string[]` — directories where `*.html` frontend files are located (e.g. `.`, `./src`, `./apps/web`).
- **FR-3**: A `typed:config` virtual module exposes the resolved `typed.config.ts` at runtime (serializable; no functions).
- **FR-4**: A `typed:vite-dev-server` virtual module exposes the Vite dev server instance when available (dev only; undefined in production).
- **FR-5**: `ssrForHttp` lives in `@typed/app` and integrates optionally with `transformIndexHtml` when a Vite dev server is provided.
- **FR-6**: The typed runtime Vite plugin (`typed:config`, `typed:vite-dev-server`) is implemented in `@typed/app` and used by `@typed/vite-plugin`.
- **FR-7**: `@typed/ui` re-exports `ssrForHttp` from `@typed/app` for backward compatibility.

## Non-Functional Requirements

- **NFR-1**: No new external dependencies beyond existing monorepo packages.
- **NFR-2**: SPA fallback must not break existing server-entry mode.
- **NFR-3**: Virtual modules use the `typed:` prefix for consistency.

## Acceptance Criteria

- **AC-1**: Running `typed serve` in a project with no `server.ts` starts the Vite dev server and serves the SPA (FR-1).
- **AC-2**: `clients` in typed.config.ts correctly locates `*.html` files for Vite input (FR-2).
- **AC-3**: `import config from "typed:config"` returns the resolved config (FR-3).
- **AC-4**: `import { getViteDevServer } from "typed:vite-dev-server"` (or equivalent) returns the server in dev, undefined in prod (FR-4).
- **AC-5**: `ssrForHttp` in @typed/app accepts optional Vite integration and applies `transformIndexHtml` when provided (FR-5).
- **AC-6**: `@typed/ui` continues to export `ssrForHttp`; callers can use either package (FR-7).

## Prioritization

- must_have: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7
- should_have: —
- could_have: —
