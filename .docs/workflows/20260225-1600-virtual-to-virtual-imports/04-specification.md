## System Context and Scope

Extension of @typed/virtual-modules: when virtual module A's generated source imports virtual module B, resolution must succeed and plugins must receive a real-file importer. Scope: VirtualRecordStore, LanguageServiceAdapter, CompilerHostAdapter, virtual-modules-vite plugin.

## Component Responsibilities and Interfaces

### VirtualRecordStore

- **New**: `resolveEffectiveImporter(containingFile: string): string`
  - Input: any file path (real or virtual).
  - Output: the root real-file importer when input is a virtual file; otherwise the input unchanged.
  - Behavior: Walk `recordsByVirtualFile` from `containingFile` via `record.importer` until no record found or cycle detected. Return the last `current` value.

### LanguageServiceAdapter

- **resolveModuleNames** / **resolveModuleNameLiterals**: When `containingFile` is a virtual file (present in `recordsByVirtualFile`), set `importerForVirtual = store.resolveEffectiveImporter(containingFile)` before calling `getOrBuildRecord(moduleName, importerForVirtual)`.

### CompilerHostAdapter

- **resolveModuleNames** / **resolveModuleNameLiterals**: Use `effectiveImporter = store.resolveEffectiveImporter(containingFile)` when calling `getOrBuildRecord(moduleName, effectiveImporter)`.

### virtual-modules-vite

- **resolveId**: When `importer` is an encoded virtual ID (`isVirtualId(importer)`), decode it and use `decoded.importer` as the effective importer for `resolver.resolveModule`.

## System Diagrams (Mermaid)

```mermaid
flowchart LR
  mainTs["main.ts"] -->|"import virtual:A"| vmA["virtual:A"]
  vmA -->|"generated: import virtual:B"| vmB["virtual:B"]
  vmB -->|"getOrBuildRecord(B, resolveEffectiveImporter(vmA_path))"| store["VirtualRecordStore"]
  store -->|"importer=main.ts"| pluginB["Plugin B.build"]
```

## Data and Control Flow

1. TS/Vite requests resolution of `virtual:B` with containing file = virtual file path for A.
2. Adapter checks `recordsByVirtualFile.get(containingFile)`; if present, calls `resolveEffectiveImporter(containingFile)`.
3. Chain walk: A's path → A's record.importer (main.ts); main.ts not in records → return main.ts.
4. `getOrBuildRecord("virtual:B", main.ts)` invoked; plugin B receives importer=main.ts.

## Failure Modes and Mitigations

| Failure                        | Mitigation                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------- |
| Circular virtual imports A→B→A | Cycle detection in resolveEffectiveImporter; break loop, return last current |
| Encoded importer decode fails  | Vite: if decode returns null, keep original importer (defensive)             |

## Requirement Traceability

| requirement_id | design_element                                  | notes                                         |
| -------------- | ----------------------------------------------- | --------------------------------------------- |
| FR-1           | resolveEffectiveImporter, LS/CH adapter changes | Effective importer passed to getOrBuildRecord |
| FR-2           | Vite resolveId decode branch                    | Decode when isVirtualId(importer)             |
| FR-3           | VirtualRecordStore.resolveEffectiveImporter     | New method                                    |
| NFR-1          | visited Set in chain walk                       | Cycle detection                               |
| NFR-2          | No plugin API change                            | Adapters only                                 |

## References Consulted

- specs: virtual-modules
- adrs: (none)
- workflows: 20260220-2209-virtual-modules
