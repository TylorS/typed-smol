---
name: effect-skill-router
description: Routes Effect-related requests to the exact owning module or facet skill using manifest ownership mappings. Load this first whenever tasks mention Effect APIs, modules, facets, runtimes, or `effect`/`@effect` imports, then escalate to the selected `effect-module-*` or `effect-facet-*` skill for implementation, research, or review details.
---

# Effect Skill Router

## Owned scope

- Owns routing only across the Effect skill collection.
- Owns manifest/facet ownership metadata and navigation guidance.

## What it is for

- Resolve a requested module/facet to a single owning skill with zero ambiguity.
- Keep cross-module tasks bounded by explicit ownership and escalation paths.

## API quick reference

- `references/public-module-manifest.json`
- `references/facet-classification.json`
- `references/skill-ownership-map.md`
- `references/content-completeness-report.md`

## How to use it

- Start with `references/public-module-manifest.md` for primary module owners.
- Use `references/facet-classification.md` to locate submodule and thematic facet owners.
- Confirm ownership in `references/skill-ownership-map.md` before editing or implementing.
- Use `references/content-completeness-report.md` to verify reference coverage quality.

## Common pitfalls

- Skipping ownership lookup causes cross-module blur; always route first.
- The router is not a module API reference; escalate to the owning module/facet skill for implementation details.

## Not covered here

- Module-specific implementation guidance belongs to module/facet owners.
- API semantics and runtime behavior are documented in each skill references folder.

## Escalate to

- `effect-module-*` skills for primary module guidance.
- `effect-facet-*` skills for focused submodule/thematic guidance.

## Reference anchors

- `references/public-module-manifest.json`
- `references/public-module-manifest.md`
- `references/facet-classification.json`
- `references/facet-classification.md`
- `references/skill-ownership-rules.md`
- `references/skill-ownership-map.md`
- `references/coverage-report.md`
- `references/content-completeness-report.md`
