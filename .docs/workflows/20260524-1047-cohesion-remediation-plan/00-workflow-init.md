# Workflow Init

- objective: Plan the remediation work for the UI/component-library, compiler/resumability, Storybook virtual-module, and Chrome DevTools cohesion gaps found in the branch review.
- started_at: 2026-05-24 10:47 America/New_York
- started_by: Codex
- mode: planning
- finalization_strategy: PR
- explicit_reuse_override: false

## Source Context Reviewed

- `.docs/workflows/20260524-0937-ui-compiler-storybook-devtools-cohesion-review/01-review.md`
- `.docs/workflows/20260524-0937-ui-compiler-storybook-devtools-cohesion-review/02-finalization.md`
- `.docs/workflows/20260522-2104-serializable-template-tooling/plan.md`
- `.docs/workflows/20260521-2320-runtime-template-compiler/plan.md`
- `.docs/workflows/20260522-2049-storybook-framework-integration/plan.md`
- `packages/app/src/runtime/mount.ts`
- `packages/app/src/runtime/RuntimeTemplate.ts`
- `packages/app/src/internal/emitBrowserSource.ts`
- `packages/app/src/resumability.ts`
- `packages/template/src/compiler-runtime/dom.ts`
- `packages/template/src/compiler-runtime/renderable.ts`
- `packages/devtools-runtime/src/DomRegistry.ts`
- `packages/devtools-runtime/src/Layer.ts`
- `packages/devtools-chrome/src/transport/inspectedWindow.ts`
- `packages/compiler/src/template/transformTemplateModule.ts`
- `packages/ui/AGENTS.md`
- `packages/ui/README.md`

## Coordination Note

Another agent is still working through the developer tooling workflow. This remediation plan must not take ownership of compiler CLI, Vite/TS plugin, VS Code diagnostics, virtual-module host hooks, or null-byte virtual-id cleanup until that agent hands off or confirms the relevant surface is free.
