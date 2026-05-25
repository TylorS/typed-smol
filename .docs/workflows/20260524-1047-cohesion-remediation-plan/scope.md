# Scope

## In Scope

- Pass a `DomTemplateRuntime` through `@typed/app/runtime.mount` into compiled DOM templates.
- Compose route resume, action resume, and optional DOM devtools observers in an app-owned browser runtime helper.
- Emit or invoke action-resume bootstrapping for compiled templates with action descriptors.
- Install the browser-side `__TYPED_DEVTOOLS__` bridge when devtools are enabled.
- Update browser virtual-module source generation and tests so generated apps use the same runtime handoff.
- Add Storybook/RealWorld smoke coverage for the generated runtime path.
- Make `examples/realworld` pass its local functional gates: check, build, unit, integration, SSR, local API acceptance, local browser E2E acceptance, local HMR, and Storybook build.
- Treat browser externalization warnings or null-byte virtual-id warnings as blockers if they prevent RealWorld from being 100% functional/compliant/resumable.
- Add and enforce a durable architecture ownership ADR before further remediation work continues.
- Update `packages/ui/AGENTS.md` to match the current headless component-library scope.
- Track developer-tooling workflow overlap explicitly.

## Out Of Scope Without Handoff

- `vmc` extension architecture changes.
- TS plugin or VS Code virtual-module diagnostic changes.
- Vite null-byte virtual-id cleanup.
- Compiler CLI workflow changes.
- Broad Storybook feature additions beyond proving the runtime handoff.

## Acceptance

- Focused package tests pass for `@typed/app`, `@typed/compiler`, `@typed/template`, `@typed/devtools-runtime`, `@typed/devtools-chrome`, `@typed/storybook`, and `@typed/ui`.
- `pnpm --filter typed-realworld storybook:build` passes.
- `pnpm --filter typed-realworld check` passes.
- `pnpm --filter typed-realworld build` passes.
- `pnpm --filter typed-realworld test` passes.
- `pnpm --filter typed-realworld test:acceptance:local` passes, including upstream Hurl API acceptance and Playwright browser E2E acceptance.
- `pnpm --filter typed-realworld test:hmr:local` passes.
- RealWorld route/action resumability is proven from server-rendered DOM through browser hydration, not only package-level unit tests.
- `pnpm build` passes.
- Browser-runtime source snapshots show the app runtime helper rather than ad hoc route-only mounting.
- Devtools browser bridge tests prove selected DOM node resolution is bound when enabled and unbound when disabled.
- Every implementation task documents which ADR-owned boundary it touches and does not introduce duplicate ownership.
- Workflow notes record whether developer-tooling handoff happened before any tooling-owned changes.
