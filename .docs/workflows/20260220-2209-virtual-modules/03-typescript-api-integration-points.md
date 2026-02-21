# TypeScript API Integration Points for Virtual Module Adapters

## Handoff Contract

### 1. Objective

Provide precise TypeScript interfaces and methods for implementing virtual module adapters in TS 5.9-ish environments, covering:
- Language Service / tsserver plugin integration (editor)
- CompilerHost integration for tsc-like type-checking (CLI)
- Watch/invalidation integration for both paths

---

### 2. Completed Work

- Survey of TypeScript `types.ts` (compiler) and `server/types.ts`
- Review of official wiki: Writing-a-Language-Service-Plugin, Using-the-Compiler-API, Using-the-Language-Service-API
- Analysis of CompilerHost, ModuleResolutionHost, ResolvedModule, WatchCompilerHost
- Review of TS issue #47600 (VFS) and resolution-related APIs
- Synthesis of method signatures and caveats

---

### 3. Findings/Evidence

#### 3.1 Language Service Plugin Integration (Editor)

**Available via `PluginCreateInfo` (passed to plugin `create(info)`):**

| Property | Type | Purpose |
|----------|------|---------|
| `info.languageService` | `ts.LanguageService` | The LS instance to wrap (decorator target) |
| `info.project` | `ts.server.Project` | Project context; access to `projectService` |
| `info.projectService` | `ts.server.ProjectService` | Logger (`logger.info()`), project management |
| `info.config` | `object` | Plugin config from `tsconfig.json` `plugins` entry |

**Relevant LS / Host Methods (for virtual module resolution/source):**

Planned virtual module support is achieved by influencing **how modules are resolved and what source is returned**. The plugin uses the decorator pattern and wraps `LanguageService`. The underlying host (which provides `getScriptSnapshot`, `fileExists`, `readFile`) is owned by tsserver’s `Project` / `ProjectService`; it is not part of the public plugin API.

**What plugins can do today:**

1. **Wrap `LanguageService` methods** – Override `getCompletionsAtPosition`, `getDefinitionAtPosition`, `getSemanticDiagnostics`, etc., to change editor behavior. This does **not** change how modules are resolved or where source comes from; it only changes what the LS reports.

2. **Access `info.project`** – For logging and project metadata. Internal host exposure for patching is not part of the documented API.

**Path for virtual module source in LS:**

- Virtual module content is ultimately supplied by the host via `getScriptSnapshot` / `readFile` for virtual paths.
- For a plugin loaded by tsserver, the host is under tsserver control. The public plugin API does **not** expose a way to patch the host.
- Frameworks (e.g. Vue, Svelte) often run their own TS server or use tools like Volar, where they **control** the host and can inject virtual files. A plugin inside tsserver typically does not.
- TS 4.8.1+ VFS (issue #47600) uses the `updateFileSystem` protocol request from the **client** (e.g. VS Code) to push virtual files. That is a client–server protocol feature, not a plugin hook.

**Recommended approach for `@typed/virtual-modules` LS adapter:**

1. **Document the limitation**: The standard tsserver plugin API does not expose host patching. Virtual modules require host-level interception.
2. **Define an adapter contract** that assumes a **custom LanguageServiceHost** (e.g. created with `ts.createLanguageService(host)`), where the adapter owns the host and can:
   - Override `fileExists` to recognize virtual IDs
   - Override `getScriptSnapshot` / `readFile` to return generated content for those IDs
   - Override or integrate with module resolution (see below)
3. **Support integration points** for tools that:
   - Use `createLanguageService` with a custom host (e.g. programmatic LS, custom editors)
   - Or that can inject a host wrapper at a lower layer (e.g. VS Code extension replacing the TS server host)

**Method signatures (conceptual) for a host the adapter controls:**

```ts
// Host methods the adapter must override when it owns the host
interface VirtualModuleHostOverrides {
  fileExists(fileName: string): boolean;
  readFile(fileName: string, encoding?: string): string | undefined;
  getScriptSnapshot?(fileName: string): ts.IScriptSnapshot | undefined;
  getScriptVersion?(fileName: string): string;
  getScriptFileNames?(): string[];  // Include virtual paths when they are in the program
}
```

**Concise method shapes for implementation:**

```ts
// CompilerHost (CLI) - override these for virtual modules
resolveModuleNames(
  moduleNames: string[],
  containingFile: string,
  reusedNames: string[] | undefined,
  redirectedReference: ts.ResolvedProjectReference | undefined,
  options: ts.CompilerOptions,
  containingSourceFile?: ts.SourceFile
): (ts.ResolvedModule | undefined)[];

getSourceFile(
  fileName: string,
  languageVersionOrOptions: ts.ScriptTarget | ts.CreateSourceFileOptions,
  onError?: (message: string) => void,
  shouldCreateNewSourceFile?: boolean
): ts.SourceFile | undefined;

// ModuleResolutionHost (inherited by CompilerHost)
fileExists(fileName: string): boolean;
readFile(fileName: string): string | undefined;

// Watch (Compiler or Server host)
watchFile(path: string, callback: ts.FileWatcherCallback, pollingInterval?: number, options?: ts.WatchOptions): ts.FileWatcher;
watchDirectory(path: string, callback: ts.DirectoryWatcherCallback, recursive?: boolean, options?: ts.WatchOptions): ts.FileWatcher;
```

**Caveats:**
- `getScriptFileNames` must include virtual module paths if they are to be part of the LS program.
- The LS host must cooperate with resolution so imports of virtual IDs resolve to virtual paths the host can serve.
- Reference resolution walks imports; for `import x from 'virtual:id'`, resolution must produce a path the host recognizes and for which it returns content.

---

#### 3.2 CompilerHost Integration (CLI / type-check-only)

**Primary source:** [Using-the-Compiler-API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)

**Methods to override (from `types.ts`):**

| Method | Signature (approximate) | Why needed |
|--------|-------------------------|------------|
| `resolveModuleNames` | `(moduleNames: string[], containingFile: string, reusedNames: string[] \| undefined, redirectedReference: ResolvedProjectReference \| undefined, options: CompilerOptions, containingSourceFile?: SourceFile) => (ResolvedModule \| undefined)[]` | Map virtual IDs to resolved file paths. Return `{ resolvedFileName: virtualPath }` for virtual modules; `undefined` for unresolved. |
| `getSourceFile` | `(fileName: string, languageVersionOrOptions: ScriptTarget \| CreateSourceFileOptions, onError?: (message: string) => void, shouldCreateNewSourceFile?: boolean) => SourceFile \| undefined` | Return `ts.createSourceFile(fileName, virtualSource, ...)` when `fileName` is a virtual module path. |
| `fileExists` (from `ModuleResolutionHost`) | `(fileName: string) => boolean` | Return `true` for virtual paths so resolution and `getSourceFile` are used. |
| `readFile` (from `ModuleResolutionHost`) | `(fileName: string) => string \| undefined` | Return virtual source for virtual paths (used when resolution reads file content). |

**Exact `CompilerHost` snippet (from `types.ts` ~8130):**

```ts
export interface CompilerHost extends ModuleResolutionHost {
  getSourceFile(fileName: string, languageVersionOrOptions: ScriptTarget | CreateSourceFileOptions,
    onError?: (message: string) => void, shouldCreateNewSourceFile?: boolean): SourceFile | undefined;
  resolveModuleNames?(moduleNames: string[], containingFile: string, reusedNames: string[] | undefined,
    redirectedReference: ResolvedProjectReference | undefined, options: CompilerOptions,
    containingSourceFile?: SourceFile): (ResolvedModule | undefined)[];
  // ... other methods
}
```

**`ModuleResolutionHost` (~7981):**

```ts
export interface ModuleResolutionHost {
  fileExists(fileName: string): boolean;
  readFile(fileName: string): string | undefined;
  directoryExists?(directoryName: string): boolean;
  realpath?(path: string): string;
  getCurrentDirectory?(): string;
  getDirectories?(path: string): string[];
  useCaseSensitiveFileNames?: boolean | (() => boolean) | undefined;
}
```

**`ResolvedModule` (~8016):**

```ts
export interface ResolvedModule {
  resolvedFileName: string;
  isExternalLibraryImport?: boolean;
  resolvedUsingTsExtension?: boolean;
}
```

**TS 5.x note:** `resolveModuleNames` is deprecated in favor of `resolveModuleNameLiterals` for Node16/NodeNext. For bundler-like workflows and simple virtual IDs, `resolveModuleNames` remains usable.

---

#### 3.3 Watch / Invalidation Integration

**Compiler / Watch host path**

`WatchCompilerHostOfConfigFile` (and the host from `createWatchCompilerHost`) includes:

| Method | Signature (approximate) | Purpose |
|--------|-------------------------|---------|
| `watchFile` | `(path: string, callback: FileWatcherCallback, pollingInterval?: number, options?: WatchOptions) => FileWatcher` | Register callback for file changes; use for file-level dependency invalidation. |
| `watchDirectory` | `(path: string, callback: DirectoryWatcherCallback, recursive?: boolean, options?: WatchOptions) => FileWatcher` | Register callback for directory changes; use for glob-style dependencies. |

**LS / tsserver path**

`ServerHost` (from `src/server/types.ts`) extends `System` and adds:

```ts
watchFile(path: string, callback: FileWatcherCallback, pollingInterval?: number, options?: WatchOptions): FileWatcher;
watchDirectory(path: string, callback: DirectoryWatcherCallback, recursive?: boolean, options?: WatchOptions): FileWatcher;
```

**Recommended invalidation flow:**

1. **Plugin manager** collects dependency descriptors (file paths, directory-globs, recursive flag) per virtual module during `build`.
2. **Adapter** receives descriptors and registers:
   - `watchFile` for each file path
   - `watchDirectory` for each directory (with `recursive` when appropriate)
3. **On callback**: mark affected virtual modules stale; on next access, recompute via plugin manager.
4. **Debouncing**: Combine rapid events (e.g. via `setTimeout`) before invalidating to avoid excessive recomputation.

**Caveats:**
- The LS plugin does not directly own `ServerHost`; watch registration must happen wherever the host is controlled (e.g. custom LS host or host wrapper).
- `WatchCompilerHost` for CLI watch mode is created by the tool; the adapter can wrap `createWatchCompilerHost` to inject a host with custom `resolveModuleNames`, `getSourceFile`, and `watchFile` / `watchDirectory`.

---

#### 3.4 Relative File and `directory(relativeGlobs)` Integration

The TypeInfo API’s `file(relativePath, options)` and `directory(relativeGlobs, options)` produce paths that are used as:
- Watch targets
- Keys for caching
- Inputs to program/checker (via the host)

**Path resolution:**
- Resolve relative paths from `baseDir` (e.g. importer dir, project root).
- `directory()` results must be stable, de-duplicated, and sorted for cache keys and watch descriptors.

---

### 4. Risks / Open Questions

1. **LS host access**: The public plugin API does not expose host patching. A `LanguageServiceAdapter` that works with the built-in tsserver plugin loader will need one of: (a) internal/undocumented host access, (b) a separate integration mode (custom LS with owned host), or (c) a different entry point (e.g. VS Code API) where the host can be wrapped.
2. **`resolveModuleNameLiterals`**: For full Node16/NodeNext support, the adapter should support `resolveModuleNameLiterals` in addition to `resolveModuleNames`.
3. **Path normalization**: Virtual paths (e.g. `virtual:ids` or `id.ts`) must be normalized consistently for `fileExists`, `readFile`, and `getSourceFile` across host and resolution.
4. **Program invalidation**: When virtual module source changes, the program/cache must be invalidated. `hasInvalidatedResolutions?` on `CompilerHost` may help; behavior for virtual modules needs verification.
5. **TS version drift**: Signatures come from TS main branch; 5.9 may have minor differences. Validate against the project’s TypeScript version.

---

### 5. Recommended Next Actions

1. **Specify adapter modes** in the spec:
   - **LS mode (owned host)**: Document support for `createLanguageService(customHost)` where the adapter provides/wraps the host.
   - **LS mode (tsserver plugin)**: Document the current limitation and options (e.g. host injection via another mechanism).
2. **Implement `CompilerHostAdapter`** as the first target: wrap `ts.createCompilerHost` or `ts.createWatchCompilerHost` and override `resolveModuleNames`, `getSourceFile`, `fileExists`, `readFile`, plus `watchFile` / `watchDirectory` for invalidation.
3. **Add a type definition module** (e.g. `types.ts`) in the package that re-exports or mirrors the needed TS types (`ResolvedModule`, `CompilerHost`, etc.) for clearer adapter contracts.
4. **Prototype watch wiring** using `createWatchCompilerHost` to confirm that watch callbacks and virtual module invalidation work end-to-end.
5. **Investigate host injection** options for tsserver plugins (e.g. through `info.project` or similar) for a potential LS adapter that works in the default plugin environment.

---

## Reference URLs

- [Writing a Language Service Plugin](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin)
- [Using the Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [Using the Language Service API](https://github.com/microsoft/TypeScript/wiki/Using-the-Language-Service-API)
- [TypeScript `types.ts` (compiler)](https://github.com/microsoft/TypeScript/blob/main/src/compiler/types.ts) — `CompilerHost`, `ModuleResolutionHost`, `ResolvedModule`
- [TypeScript `server/types.ts`](https://github.com/microsoft/TypeScript/blob/main/src/server/types.ts) — `ServerHost`
- [WatchCompilerHostOfConfigFile (TypeDoc)](https://typestrong.org/typedoc-auto-docs/typedoc/interfaces/TypeScript.WatchCompilerHostOfConfigFile.html)
- [TS VFS issue #47600](https://github.com/microsoft/TypeScript/issues/47600)
- [TS resolveModuleNames params fix #31056](https://github.com/microsoft/TypeScript/issues/31056)
