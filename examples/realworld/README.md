# Typed RealWorld

This package will become the full-stack RealWorld/Conduit flagship example for
`@typed/app`. The current slice only establishes the approved package boundary,
virtual-module configuration, and empty browser/server entries. Later tasks add
the domain model, SQLite infrastructure, HttpApi endpoints, SSR routes, and
manual local acceptance automation.

## Scripts

- `pnpm --filter typed-realworld dev` starts the local Vite dev server.
- `pnpm --filter typed-realworld build` type-checks and builds the package.
- `pnpm --filter typed-realworld test:unit` runs package-skeleton/domain tests.
- `pnpm --filter typed-realworld test:integration` runs infrastructure,
  application, and API tests.
- `pnpm --filter typed-realworld test:ssr` runs presentation and SSR tests.

The database and local acceptance scripts intentionally fail until their owning
tasks wire the real SQLite, Hurl, and Playwright implementations.
