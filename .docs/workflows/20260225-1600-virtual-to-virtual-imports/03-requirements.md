## Functional Requirements

- FR-1: When resolving a virtual module import whose containing file is a virtual file, the resolver must receive the effective (root real-file) importer, not the virtual file path.
- FR-2: When the Vite plugin's resolveId receives an encoded virtual ID as importer, it must decode it and use the decoded importer for resolution.
- FR-3: VirtualRecordStore must expose a method to resolve the effective importer by walking the virtual-file chain back to a real file.

## Non-Functional Requirements

- NFR-1: Chain walk must terminate in the presence of circular virtual imports (cycle detection).
- NFR-2: No change to the VirtualModulePlugin contract; plugins remain unaware of virtual-to-virtual resolution mechanics.

## Acceptance Criteria

- AC-1: Plugin A generating `import { x } from "virtual:b"` and plugin B generating `export const x = 1` resolves correctly; B's build receives the root real file as importer. (FR-1)
- AC-2: Chain A→B→C resolves; C's build receives the root real file. (FR-1)
- AC-3: Vite resolveId with encoded virtual ID as importer resolves the requested virtual module. (FR-2)
- AC-4: resolveEffectiveImporter returns input unchanged when input is not a virtual file. (FR-3)
- AC-5: Circular virtual imports do not cause infinite loop. (NFR-1)

## Prioritization

- must_have: FR-1, FR-2, FR-3, NFR-1, AC-1 through AC-5
- should_have: NFR-2
- could_have: (none)
