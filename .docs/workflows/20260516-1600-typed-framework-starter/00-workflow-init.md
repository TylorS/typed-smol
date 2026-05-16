## Workflow Init

- objective: Expand `@typed/app` and `@typed/cli` toward a SvelteKit/Next.js-style Typed framework, including a starter app for quickly scaffolding a typed pnpm workspace with framework defaults.
- started_at: 2026-05-16T16:00:53-04:00
- started_by: human
- source_context_reviewed:
  - `AGENTS.md`
  - `.cursor/rules/modes/strict.mdc`
  - `.cursor/rules/stages/brainstorming.mdc`
  - `.cursor/rules/agent-collaboration.mdc`
  - `.docs/workflows/20260515-2018-typed-framework-evolution/{intent.md,scope.md,requirements.md,plan.md}`
  - `.docs/specs/typed-config/spec.md`
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/specs/httpapi-virtual-module-plugin/spec.md`
  - `packages/app/README.md`
  - `packages/app/src/config/{TypedConfig.ts,defineConfig.ts,loadTypedConfig.ts}`
  - `packages/vite-plugin/src/index.ts`
  - `packages/virtual-modules-vite/src/vitePlugin.ts`
  - `packages/cli/src/commands/typed.ts`
  - `packages/cli/src/shared/{loadConfig.ts,resolveConfig.ts}`
  - `examples/counter/{typed.config.ts,vite.config.ts,package.json,src/main.ts}`
  - Current official SvelteKit routing/project docs: https://svelte.dev/docs/kit/routing, https://svelte.dev/docs/kit/creating-a-project, https://svelte.dev/docs/kit/project-structure
  - Current official Next.js App Router/create-app docs: https://nextjs.org/docs/app/getting-started/project-structure, https://nextjs.org/docs/app/getting-started/route-handlers-and-middleware, https://nextjs.org/docs/14/app/api-reference/create-next-app
  - Current Vite 8 SSR/framework docs via Context7.
  - `cyco130/vavite` README: https://github.com/cyco130/vavite
- explicit_reuse_override: false

## Notes

- initial constraints:
  - Mode: strict.
  - Finalization strategy: PR.
  - This workflow is new; earlier workflow folders are reference-only.
  - Stage order remains `brainstorming -> research -> requirements -> specification -> planning -> execution -> finalization`.
  - Phase 1 artifacts must be explicitly approved before commit and Phase 2.
- initial risks:
  - The requested framework scope spans app conventions, CLI scaffolding, Vite integration, virtual-module behavior, examples, docs, and generated type surfaces.
  - Existing `@typed/app` already owns router and HttpApi virtual module plugins; this work should avoid duplicating canonical specs.
  - Starter-template scope needs clarification before requirements: minimal framework starter vs fully loaded reference workspace.
  - `vavite` v7 is current as of 2026-05-16 and documents Node 22+ / Vite v7+ expectations; repo runtime policy must confirm this matches Typed's supported baseline before implementation.
