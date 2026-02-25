## Problem Statement

Virtual modules (e.g. `router:./routes`, `api:./endpoints`) can generate source that imports other virtual modules. Today, when virtual module A imports virtual module B, resolution breaks in three places:

1. **LanguageServiceAdapter**: TS passes A's virtual file path as `containingFile`. The adapter does not recognize it; plugins receive a virtual path as `importer`, breaking `baseDir` and TypeInfoApi.
2. **CompilerHostAdapter**: Same gap.
3. **Vite plugin**: Vite passes the encoded virtual ID as `importer`; the plugin forwards it verbatim, so the resolver receives invalid input.

## Desired Outcomes

- Virtual module A can import virtual module B (and deeper chains A→B→C).
- Plugins always receive a real file path as `importer`.
- Eviction and dependency tracking remain correct.
- No changes to the plugin contract.

## Constraints and Assumptions

- Plugin `build()` is sync-only; no re-entrancy during build.
- `recordsByVirtualFile` maps virtual file path → record with `importer`.
- Vite encode/decode format is `\0virtual:base64(id):base64(importer)`.
- Real-file importer is the canonical context for eviction (script file names).

## Known Unknowns and Risks

- Circular virtual imports (A imports B imports A): handled defensively by cycle detection in chain-walk.
- Orphan records when a virtual module stops importing another: acceptable; eviction already keyed by root importer.

## Candidate Approaches

| Approach | Pros | Cons |
|---------|------|------|
| Walk importer chain to root real file | Plugins get real importer; eviction stays correct; minimal API change | Need cycle detection |
| Pass virtual path as importer and teach plugins | No adapter changes | Breaks TypeInfoApi, baseDir, routing |
| New "importer context" API for plugins | Explicit | Larger plugin contract change |

## Recommendation

Walk the `recordsByVirtualFile` chain to resolve the effective (root real-file) importer when the containing file is a virtual file. Add `resolveEffectiveImporter` to VirtualRecordStore; update LS adapter, CH adapter, and Vite plugin to use it.

## Source Grounding

- consulted_specs: N/A
- consulted_adrs: N/A
- consulted_workflows: 20260220-2209-virtual-modules (virtual-modules package design)

## Initial Memory Strategy

Capture: effective-importer chain-walk pattern for virtual-to-virtual resolution. Promote to `.docs/_meta/memory/` if proven in production.
