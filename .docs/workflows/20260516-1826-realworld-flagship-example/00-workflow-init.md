## Workflow Init

- objective: Design and implement the flagship `@typed/app` RealWorld example application, using Typed virtual modules, Effect, Schema, RefSubject, SSR, and CSR as first-class surfaces.
- started_at: 2026-05-16T18:26:46-0400
- started_by: Codex, with human-selected `strict` mode and `pr` finalization strategy
- source_context_reviewed:
  - `AGENTS.md`
  - `.cursor/rules/modes/strict.mdc`
  - `.cursor/rules/stages/brainstorming.mdc`
  - `.cursor/rules/docs-architecture.mdc`
  - `.cursor/rules/agent-collaboration.mdc`
  - `.cursor/rules/effect-skill-loading.mdc`
  - `.cursor/skills/effect-skill-router/SKILL.md`
  - `packages/app/AGENTS.md`
  - `packages/fx/AGENTS.md`
  - `packages/app/README.md`
  - `packages/app/src/*VirtualModulePlugin.ts`
  - `packages/app/src/internal/emit*Source.ts`
  - `packages/app/src/httpapi/defineApiHandler.ts`
  - `examples/counter/`
  - `examples/todomvc/`
  - `.docs/specs/typed-framework-starter/spec.md`
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/specs/httpapi-virtual-module-plugin/spec.md`
  - `https://docs.realworld.show/`
  - `https://docs.realworld.show/implementation-creation/features/`
  - `https://docs.realworld.show/specifications/frontend/routing/`
  - `https://docs.realworld.show/specifications/frontend/api/`
  - `https://docs.realworld.show/specifications/backend/endpoints/`
  - `.temp/references/realworld/specs/` from `realworld-apps/realworld@273d37a959e0583d0c70e26e68f1086294b64489`
- explicit_reuse_override: false

## Notes

- initial constraints:
  - Strict stage order is `brainstorming -> research -> requirements -> specification -> planning -> execution -> finalization`.
  - Existing `.docs/workflows/` directories are reference-only unless the human explicitly asks to continue one.
  - All data should be modeled with Effect Schema.
  - State should use RefSubject where client or cross-boundary reactivity is useful.
  - The application should demonstrate SSR, CSR/hydration, Typed virtual modules, Effect service/layer composition, and RealWorld API compatibility.
  - The application must be full-stack; `api:` endpoint modules and Typed/Effect server-side contracts are central to the scope.
  - Backend persistence should use SQLite through `effect/unstable/sql`, starting from the simplest local setup that still proves real persistence.
  - Any runtime dependency not already used by the repo requires explicit human approval before use.
  - Finalization target is a pull request.
- initial risks:
  - RealWorld scope is broad enough to tempt overbuilding; this workflow needs explicit scope and acceptance criteria before implementation.
  - Effect unstable HttpApi APIs can shift; implementation should isolate unstable client/server details behind local adapters.
  - Current `@typed/app` SSR/browser helpers are intentionally composable and may require example-owned runtime wiring rather than assuming a hidden framework runtime.
  - The checkout is already dirty; unrelated user changes must be preserved.
