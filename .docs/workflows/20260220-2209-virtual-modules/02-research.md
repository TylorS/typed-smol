## Research Questions

1. Which official TypeScript extension points are suitable for synchronous virtual module resolution in editor workflows?
2. How should a `tsc`-like type-checking path be implemented when Language Service plugins are not loaded by `tsc`?
3. What design constraints from incremental type-checking research should inform plugin API ergonomics and performance?

## Source Table


| source                                                                                                                                                                             | year                | type                                            | confidence  | notes                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| [https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin)                   | 2024 (page updated) | official TypeScript wiki (vendor documentation) | high        | Confirms LS plugins are editing-only and not loaded by `tsc`; shows decorator/proxy pattern and `PluginCreateInfo`. |
| [https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)                                         | n/a (wiki)          | official TypeScript wiki (vendor documentation) | high        | Documents custom `CompilerHost` and overriding `resolveModuleNames` / `getSourceFile` for custom resolution.        |
| [https://github.com/microsoft/typescript/wiki/using-the-language-service-api](https://github.com/microsoft/typescript/wiki/using-the-language-service-api)                         | 2020 (page updated) | official TypeScript wiki (vendor documentation) | medium-high | Clarifies LS host model is demand-driven and synchronous in host callbacks.                                         |
| [https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html)                   | 2026                | official release notes                          | medium      | No major LS plugin architecture shifts found that change the proposed integration path.                             |
| [https://www.typescriptlang.org/tsconfig/moduleResolution.html](https://www.typescriptlang.org/tsconfig/moduleResolution.html)                                                     | 2026                | official docs                                   | high        | Confirms resolution strategy differences (`bundler`, `node16`, etc.) affecting fallback behavior.                   |
| [https://arxiv.org/abs/2509.15150](https://arxiv.org/abs/2509.15150)                                                                                                               | 2025                | research preprint                               | low-medium  | Supports modular language tooling direction; less direct on TypeScript plugin APIs.                                 |
| [https://www.pl.informatik.uni-mainz.de/files/2020/10/incremental-typing-foundations.pdf](https://www.pl.informatik.uni-mainz.de/files/2020/10/incremental-typing-foundations.pdf) | 2020                | research paper/preprint copy                    | medium      | Shows value of incrementalized checking and avoiding unnecessary recomputation after small edits.                   |


## WebSearch Query Log


| query                                                                                                   | rationale                                                                         | selected_sources                                                 |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `TypeScript Language Service plugin official documentation getCompletionsAtPosition proxy`              | Find primary documentation for LS plugin integration points and lifecycle.        | TS wiki `Writing-a-Language-Service-Plugin`                      |
| `TypeScript module resolution CompilerHost resolveModuleNames getSourceFile virtual file official docs` | Validate compiler-host hooks for virtual module support in non-editor workflows.  | TS wiki `Using-the-Compiler-API`, TSConfig moduleResolution docs |
| `TypeScript 5.9 language service plugin changes tsserver plugin`                                        | Check recency/compatibility risk with TS 5.9 used in this repo.                   | TS 5.9 release notes                                             |
| `incremental type checking language server architecture paper`                                          | Satisfy research-stage paper discovery for architecture/performance implications. | arXiv 2509.15150, incremental typing foundations paper           |
| `A systematic approach to deriving incremental type checkers pdf`                                       | Obtain accessible primary source when ACM page was restricted.                    | incremental-typing-foundations PDF mirror                        |


## Key Findings

1. **Language Service plugins are editor-only**: official TS docs explicitly state plugins are not loaded by `tsc`, so CLI type-check support must be implemented via compiler-host/program APIs, not LS plugin loading.
2. **Compiler API supports custom synchronous resolution**: `CompilerHost.resolveModuleNames` and `getSourceFile` provide direct hooks for virtual module mapping and in-memory source provisioning.
3. **Synchronous host model aligns with requirements**: LS host interactions are on-demand and callback-based; a synchronous plugin contract is technically aligned with TypeScript integration points.
4. **First-match resolver model is operationally simple**: it maps cleanly onto `resolveModuleNames` semantics and avoids merge conflicts in generated source ownership.
5. **Performance risk area is type extraction**: rich type snapshots should use caching keyed by module/importer/program version to avoid repeated expensive extraction in editor loops.

## Open Risks and Unknowns

- Exact stable JSON shape for rich type info still needs design boundaries (how deep to include references and symbol graphs).
- Possible mismatch between repo default `moduleResolution: bundler` and user projects using `node16`/`nodenext`; adapters need explicit resolution strategy handling.
- The best boundary between “easy JSON snapshot” and “advanced escape hatch” needs validation with real plugin examples.

## Implications for Requirements and Specification

- Requirements should explicitly separate:
  - LS adapter responsibilities (editor features), and
  - CLI adapter responsibilities (type-check diagnostics path).
- Specification should include:
  - `shouldResolve` + `build` sync plugin lifecycle,
  - plugin manager first-match routing,
  - typed extraction API with stable JSON output,
  - caching strategy for extracted type snapshots.

## Alignment Notes

- specs_alignment: none yet; `.docs/specs/` does not exist.
- adrs_alignment: none yet; `.docs/adrs/` does not exist.
- workflows_alignment:
  - aligns with constraints and direction captured in `01-brainstorming.md`.

## Memory Promotion Candidates

- **heuristics**: “For TS virtual modules, separate LS (editor) and compiler-host (CLI) adapters behind one shared synchronous core.”
- **procedural**: “When docs claim plugin limitations, verify against official vendor docs before architecture decisions.”
- Promotion deferred to finalization pending implementation evidence.

