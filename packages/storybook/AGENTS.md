# @typed/storybook

## Intent

`@typed/storybook` is the first-party Storybook framework integration for Typed apps. It should act as a Storybook framework package, not only a renderer adapter.

## Constraints

- Preserve Typed's virtual-module-first architecture.
- Install Typed app virtual module support through `@typed/vite-plugin`; do not add local `typed:*` module shims.
- Keep the renderer focused on canvas/browser lifecycle. Server-aware behavior belongs in explicit runtime harness helpers.
- Public helper types should favor inference and avoid broad public `unknown` service/error channels where practical.

## Pointers

- Spec: `.docs/specs/storybook-framework-integration/spec.md`
- Testing strategy: `.docs/specs/storybook-framework-integration/testing-strategy.md`
- ADR: `.docs/adrs/20260522-2058-storybook-runtime-harness-first.md`
- Workflow: `.docs/workflows/20260522-2049-storybook-framework-integration/`
