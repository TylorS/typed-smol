## Research Questions

1. How does LanguageServiceAdapter currently derive `importerForVirtual` when resolving imports?
2. How does Vite's resolveId receive the importer when resolving imports from virtual modules?
3. Does VirtualRecordStore have sufficient data to walk from virtual file path back to root real importer?

## Source Table

| source | year | type | confidence | notes |
| ------ | ---- | ---- | ---------- | ----- |
| packages/virtual-modules/src/LanguageServiceAdapter.ts | 2026 | code | high | resolveModuleNames, parsePreviewUri, importerForVirtual logic |
| packages/virtual-modules/src/CompilerHostAdapter.ts | 2026 | code | high | resolveModuleNames, resolveModuleNameLiterals |
| packages/virtual-modules-vite/src/vitePlugin.ts | 2026 | code | high | resolveId, importer handling |
| packages/virtual-modules/src/internal/VirtualRecordStore.ts | 2026 | code | high | recordsByVirtualFile, record.importer |

## WebSearch Query Log

| query | rationale | selected_sources |
| ----- | --------- | ---------------- |
| (none) | Codebase exploration sufficient | — |

## Key Findings

1. **LS Adapter**: `parsePreviewUri` handles `virtual-module://` and tsserver `^/virtual-module/` paths only. Virtual file paths like `node_modules/.typed/virtual/__virtual_plugin_hash.ts` are not detected; `importerForVirtual` defaults to `containingFile`, which is the virtual path.

2. **CH Adapter**: No virtual file recognition in `resolveModuleNames` or `resolveModuleNameLiterals`. `getOrBuildRecord(moduleName, containingFile)` receives virtual path as importer when resolving imports from virtual files.

3. **Vite**: `resolveId(id, importer)` receives `importer` as the encoded virtual ID when resolving imports from virtual modules. The plugin passes `importer` directly to `resolver.resolveModule`.

4. **VirtualRecordStore**: `recordsByVirtualFile` maps virtual file path → `MutableVirtualRecord`. Each record has `importer` (the file that imported this virtual module). Chain walk is feasible: virtual file → record.importer; if that is also a virtual file, repeat until real file.

## Open Risks and Unknowns

- None blocking implementation. Cycle detection will break loops defensively.

## Implications for Requirements and Specification

- Req: When containing file is a virtual file, resolve effective importer by walking chain.
- Req: When Vite importer is encoded virtual ID, decode before passing to resolver.
- Spec: `resolveEffectiveImporter(containingFile): string` returns root real-file path (or input if not a virtual file).

## Alignment Notes

- specs_alignment: N/A
- adrs_alignment: N/A
- workflows_alignment: Builds on 20260220-2209-virtual-modules virtual-modules architecture.

## Memory Promotion Candidates

- Heuristic: "Virtual-to-virtual imports require walking importer chain to root real file; each adapter (LS, CH, Vite) must implement this."
