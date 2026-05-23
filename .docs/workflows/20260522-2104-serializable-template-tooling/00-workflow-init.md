# Workflow Init

## Objective

Design and implement the next Typed compiler/tooling tranche:

- a framework API that makes runtime-visible values serializable where the compiler needs resumability, HMR, or build/runtime transfer;
- type-directed Effect Schema generation where explicit schemas are not present but the compiler can safely derive enough structure;
- a template Vite plugin that gets `@typed/compiler` template work into runtime applications during build mode;
- integration of that template plugin into `@typed/vite-plugin` as part of the core framework surface;
- template TypeScript plugin and VS Code extension behavior that provide editor diagnostics for `html` templates with stronger prop/attribute/event constraints than the generic `@typed/template` public types.

## Started At

2026-05-22 21:04 America/New_York

## Started By

Codex, from user request in strict + merge mode.

## Source Context Reviewed

- Root `AGENTS.md` strict workflow instructions supplied in-thread.
- `.cursor/rules/modes/strict.mdc`
- `.cursor/rules/agent-collaboration.mdc`
- `packages/compiler/AGENTS.md`
- `packages/template/AGENTS.md`
- `packages/virtual-modules-ts-plugin/AGENTS.md`
- `packages/virtual-modules-vscode/AGENTS.md`
- `packages/vite-plugin/src/index.ts`
- `packages/vite-plugin/src/index.test.ts`
- `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
- Existing workflow: `.docs/workflows/20260522-1908-runtime-compiler-simplification/`
- Current docs checked through Context7:
  - Vite plugin hooks and virtual modules
  - TypeScript language service plugins
  - VS Code diagnostics, code actions, and TypeScript plugin configuration

## Explicit Reuse Override

false

## Routing Decision

Direct for Phase 1 only. The repo policy would normally route broad requirements/spec work to specialist agents, but the available multi-agent tool currently allows spawning only when the user explicitly asks for subagents. Record this as a tool-policy constraint and revisit if the user asks for delegated work.

