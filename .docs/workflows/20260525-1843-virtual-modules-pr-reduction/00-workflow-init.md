## Workflow Init

- objective: Rein in the current broad PR into a coherent, testable virtual-module/compiler/tooling release slice that works across dev mode, build, preview, RealWorld, and DevTools without retaining the generated `TypedClient` abstraction.
- started_at: 2026-05-25T18:43:43-04:00
- started_by: Codex, with human-selected `strict + pr`
- source_context_reviewed:
  - `AGENTS.md`
  - `.cursor/rules/modes/strict.mdc`
  - `.cursor/rules/stages/brainstorming.mdc`
  - `.cursor/rules/docs-architecture.mdc`
  - `.cursor/rules/agent-collaboration.mdc`
  - `.cursor/rules/effect-skill-loading.mdc`
  - `.cursor/skills/effect-skill-router/SKILL.md`
  - `.cursor/skills/effect-facet-unstable-httpapi-httpapiclient/SKILL.md`
  - `.cursor/skills/effect-facet-unstable-http-httpclient/SKILL.md`
  - `.cursor/skills/effect-module-effect/SKILL.md`
  - `.cursor/skills/effect-module-layer/SKILL.md`
  - `.docs/adrs/20260521-2320-runtime-template-compiler-boundaries.md`
  - `.docs/adrs/20260524-runtime-cohesion-ownership-boundaries.md`
  - `.docs/specs/virtual-modules/spec.md`
  - `.docs/specs/typed-devtools/spec.md`
  - `.docs/workflows/20260524-1047-cohesion-remediation-plan/intent.md`
  - `.docs/workflows/20260524-1047-cohesion-remediation-plan/scope.md`
  - `.docs/workflows/20260524-1047-cohesion-remediation-plan/requirements.md`
- explicit_reuse_override: false

## Notes

  - initial constraints:
  - Strict stage order is `brainstorming -> research -> requirements -> specification -> planning -> execution -> finalization`.
  - Finalization strategy is PR.
  - Treat existing workflow folders as reference-only.
  - Do not edit implementation before the human approves the current phase documents.
  - `TypedClient`, `TypedClientInput`, and typed wrapper mappings are not acceptable release surfaces; use the raw HttpApi-derived `Client` / `HttpApiClient.ForApi` surface instead.
  - Preserve virtual-modules-only architecture and avoid filesystem routing or local typed-module shims.
  - Treat Storybook as a stable framework surface, not a fixture-only demo.
  - Research configuration DRYness across Typed config, Vite config, `vmc`, and TypeScript before adding more per-surface options.
  - Treat end-to-end type safety as a release requirement, including generated virtual-module output.
  - Require production plugin builds to output only imports actually consumed by user code and their dependency closure.
- initial risks:
  - Current branch is already broad and dirty across app, compiler, template, devtools, virtual modules, vite-plugin, ui, router, fx, and RealWorld.
  - Existing remediation docs still contain `TypedClient` compatibility language that conflicts with the updated human constraint.
  - The requested outcome spans at least four specialist streams: host-surface consistency, compiler/HMR correctness, DevTools inspectability, and generated HttpApi client cleanup.
