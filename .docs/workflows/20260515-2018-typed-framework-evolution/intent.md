# Intent — Typed Framework Evolution

Status: draft, not approved.

## Problem

Typed is currently a set of strong libraries and virtual-module integrations. The next evolution is to make it a full framework: opinionated like SvelteKit, but centered on Typed's modular compiler architecture and extensible virtual module surfaces.

## Desired Outcome

Create a multi-week, strict-mode roadmap that turns Typed into a production framework by hardening the shared virtual module compiler layer first, then building framework features on top of that stable substrate.

The intended end state is:

- `@typed/virtual-modules` and `vmc` provide a production-grade generated artifact system.
- Virtual module outputs are persisted to disk by default so Vite, vmc, the TS plugin, and VS Code can share generated work instead of recomputing independently.
- `@typed/app` has production-ready router and HTTP API plugin surfaces.
- Typed includes first-party app plugins for type-safe environment variables and configuration re-exposure.
- Typed offers a create-app template that starts users with the full framework experience.

## Product Thesis

Typed should feel less like manually assembling libraries and more like using a coherent framework. Compiler plugins should be easier to author and compose than Vite plugins, while still working across editor, CLI, dev server, and build workflows.

## Priority Biases

- Reliability before feature breadth.
- Shared generated artifacts before new framework capabilities.
- Explicit file contracts over hidden in-memory behavior.
- Framework conventions where they remove repeated setup.
- Modular compiler/plugin boundaries where extensibility matters.

## Open Questions

- Whether the first implementation tranche should stop at compiler substrate productionization or include router/HTTP API hardening in the same tranche.
- Whether disk-backed virtual modules should replace `typed-virtual://` identity everywhere or become the default materialization layer while preserving URI identity for some editor/debug paths.
- How opinionated the first create-app template should be: minimal framework starter vs fully loaded reference app.

## Decisions

- Use subagents for large tasks and broad multi-stream research/planning. The human explicitly approved this on 2026-05-15.
- Core compiler substrate work comes first so higher-level framework code does not have to absorb later core interface changes.
- Preserve `typed-virtual://` as the stable logical virtual module identity for portability; disk files are the shared materialized backing, not necessarily the public identity.
- Use `node_modules/.typed/virtual` as the default physical artifact root for materialized virtual modules.
- The generated artifact store must include manifest/cache semantics from the first compiler-substrate tranche; deterministic write-through files alone are insufficient for the stated goals.
- Cache validity must be based on source hashes plus relevant config, plugin, and compiler inputs, not timestamp-only invalidation.
- Concurrent writers should use atomic writes with last-valid-writer-wins semantics for v1 rather than a strict single-builder lock protocol.
- Generated artifacts are persistent cache files by default and should remain on disk unless explicitly cleaned.
