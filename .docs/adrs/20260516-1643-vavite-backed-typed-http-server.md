# ADR: Use Vavite Behind Typed HTTP Server Development

Status: accepted

## Context

Typed needs one development server for client assets, SSR, and HttpApi handlers. Running a separate API server beside Vite would create extra local complexity and split HMR/module invalidation behavior.

Vite supports custom SSR and middleware-mode development. `cyco130/vavite` packages the server-side Vite lifecycle for server applications, including handler entries mounted into Vite's dev server, server HMR cleanup, and production builds.

Existing generated `api:` modules currently emit helpers that directly choose `NodeHttpServer.layer(http.createServer, ...)`. That proves the generated HttpApi server can run, but it is not the desired framework abstraction.

## Decision

Typed shall introduce `TypedHttpServer.layer(...)` from `@typed/app` as the public server-layer boundary and integrate `vavite` through `@typed/vite-plugin`.

- In dev, `import.meta.env.DEV` selects the vavite-backed Vite dev server.
- In non-dev, the server path uses `http.createServer()` through `TypedHttpServer.layer(...)`.
- Vite dev middleware/static behavior must have non-dev replacements inferred from Typed config, app mode, and build conventions.
- `typedVitePlugin()` shall enable vavite automatically when it discovers a server entry.
- Generated `api:` modules shall consume the Typed server helper rather than hard-coding a concrete server layer.

## Consequences

- Framework apps get one dev server with Vite-backed client and server transforms.
- Server selection is centralized and testable.
- `@typed/vite-plugin` gains framework-server responsibility and must keep the vavite dependency isolated behind a clear option/config boundary.
- Non-dev static serving and SSL behavior must be implemented explicitly rather than relying on Vite middleware.

## Alternatives Considered

- Hand-written middleware mode in `@typed/cli`: rejected for v1 because vavite already handles much of the server-side Vite lifecycle.
- Explicit user opt-in for vavite: rejected because the approved requirement is automatic activation when a server entry is discovered.
- Separate API server in dev: rejected because it violates the one-server requirement.

## References

- `.docs/workflows/20260516-1600-typed-framework-starter/requirements.md`
- `packages/cli/src/commands/serve.ts`
- `packages/app/src/internal/emitHttpApiSource.ts`
- `packages/vite-plugin/src/index.ts`
- `cyco130/vavite` README
- Vite SSR/framework API docs
