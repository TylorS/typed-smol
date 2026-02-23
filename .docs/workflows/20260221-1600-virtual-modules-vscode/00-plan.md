# Plan: virtual-modules-vscode Package

**Objective:** VS Code extension that lets users view generated virtual module contents.

**Started:** 2026-02-21

---

## 1. Use Cases

| Use case                 | Description                                                   | Entry point                            |
| ------------------------ | ------------------------------------------------------------- | -------------------------------------- |
| **Go to definition**     | User Cmd+clicks `virtual:foo`; editor opens generated content | TypeScript returns definition location |
| **Peek definition**      | User hovers or peeks on import; shows content inline          | Peek UI                                |
| **Open virtual module**  | Command palette: "Virtual Modules: Open virtual:foo"          | Command                                |
| **List virtual modules** | Tree / quick pick of resolved virtual modules in workspace    | Sidebar or command                     |

---

## 2. Content Resolution Challenge

Virtual module identity:

- **Key:** `virtualKey = importer::id` (e.g. `entry.ts::virtual:foo`)
- **Virtual file:** `typed-virtual://` URI (e.g. `typed-virtual://0/<pluginName>/<hash>.d.ts?...`); content served from memory, no disk path. Hash from virtualKey.

The URI may include `id` and `importer` in the query for resolution. To resolve content we need either:

1. **`(id, importer)`** – then we can call `resolver.resolveModule({ id, importer })` via `@typed/virtual-modules`
2. **`path -> content` mapping** – something that maps virtual file path to source text
3. **API from ts-plugin** – ts-plugin exposes content via a channel the extension can query

---

## 3. Architecture Options

### Option A: Extension Resolves On-Demand (Recommended)

**Idea:** Extension loads the same plugin config from `tsconfig.json`, instantiates `PluginManager` + `NodeModulePluginLoader`, and resolves `(id, importer)` to get content.

**Flow:**

1. User triggers "view virtual:foo" (from active editor or command with importer context)
2. Extension reads `tsconfig.json` → plugins array
3. Extension loads plugins via `NodeModulePluginLoader`
4. Extension calls `resolver.resolveModule({ id: "virtual:foo", importer: activeFilePath })`
5. Extension registers `TextDocumentContentProvider` for a custom URI scheme, e.g. `virtual-module:foo?importer=file:///path/to/entry.ts`
6. Provider returns `resolution.sourceText` when queried

**Pros:**

- No disk writes
- No cross-process communication
- Reuses `@typed/virtual-modules` core
- Self-contained once plugins are loaded

**Cons:**

- Duplicate plugin loading (extension + tsserver) – must stay in sync with tsconfig
- Need importer context; for "Go to definition" TS returns a path, not `(id, importer)`

### Option B: Path → Content Manifest (Opt-In)

**Idea:** ts-plugin optionally writes a manifest mapping `typed-virtual://` URI → sourceText when records are created/updated/evicted.

**Flow:**

1. User enables `virtualModulesManifest: true` in tsconfig plugin config
2. LanguageServiceAdapter writes/updates manifest on record resolution and eviction
3. Extension watches manifest, registers `FileSystemProvider` or `TextDocumentContentProvider` for `typed-virtual://` URIs
4. When user opens a virtual URI (e.g. from Go to definition), provider serves content from manifest

**Pros:**

- Go to definition works directly: TS returns path, we serve that path’s content
- Single source of truth (ts-plugin)
- No duplicate resolution

**Cons:**

- Requires opt-in disk write (manifest only)
- Manifest can grow; needs eviction/cleanup policy

### Option C: Custom Protocol / Bridge

**Idea:** ts-plugin and extension communicate via a side-channel (e.g. local socket, MCP, custom LSP request).

**Pros:** Centralized content source in ts-plugin.

**Cons:** Complex, cross-process, fragile; likely overkill for v1.

---

## 4. Recommendation: Hybrid (A + B Lightweight)

**Phase 1 (no disk writes):**

- Implement **Option A**: Extension uses `@typed/virtual-modules` to resolve on-demand.
- Support:
  - Command: "Virtual Modules: Open virtual:foo" (importer = active text editor)
  - `TextDocumentContentProvider` for URI `virtual-module:<id>?importer=<fileUri>`
  - Optional: Quick pick to choose importer when multiple files import the same virtual module

**Phase 2 (if Go to definition is required):**

- Add **opt-in manifest** in ts-plugin: `virtualModulesManifest: true` in plugin config.
- Manifest: `{ [virtualPath: string]: string }` (path → sourceText).
- Extension provides `FileSystemProvider` for `typed-virtual://` URIs (or `TextDocumentContentProvider` for that scheme).
- When TS "Go to definition" returns a `typed-virtual://` URI, extension serves that URI's content from the manifest or by resolving on-demand.

**Phase 1 does not require any ts-plugin changes.** Phase 2 adds an optional adapter capability.

---

## 5. Package Structure

```
packages/virtual-modules-vscode/
├── package.json          # extension manifest, engines.vscode
├── src/
│   ├── extension.ts      # activate, register provider, commands
│   ├── VirtualModuleProvider.ts   # TextDocumentContentProvider
│   ├── resolver.ts       # load tsconfig, plugins, resolve (id, importer)
│   └── types.ts
├── tsconfig.json
└── README.md
```

**Dependencies:**

- `@typed/virtual-modules` (workspace)
- `vscode` (peer / dev)
- `typescript` (for reading tsconfig, compiler options)

---

## 6. Integration with tsconfig

Extension must discover:

1. **Project root** – from workspace folder or `tsconfig.json` location
2. **Plugin config** – from `compilerOptions.plugins` array, find entry with `name: "@typed/virtual-modules-ts-plugin"` (or configurable)
3. **Plugin specifiers** – `config.plugins` array (e.g. `["./plugin.cjs"]`)
4. **projectRoot** – `getCurrentDirectory()` equiv; usually workspace root or tsconfig dir

Use `NodeModulePluginLoader` with `baseDir: projectRoot` to load plugins, same as ts-plugin.

---

## 7. URI Scheme Design

**`virtual-module` scheme:**

```
virtual-module:<moduleId>?importer=<file%3A%2F%2F%2Fpath%2Fto%2Ffile.ts>
```

Examples:

- `virtual-module:virtual:foo?importer=file:///project/entry.ts`
- Colons in `virtual:foo` can be encoded or use a different separator if needed

When provider is asked for this URI, parse `moduleId` and `importer`, resolve, return `sourceText`.

---

## 8. Commands

| Command ID                      | Description                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `virtualModules.open`           | Open virtual module: prompt for module ID or derive from cursor (import specifier); use active editor as importer |
| `virtualModules.openFromImport` | Run from context menu on import specifier; extract `virtual:foo`, use current file as importer                    |
| `virtualModules.list`           | (Phase 2) List virtual modules in workspace; open selected                                                        |

---

## 9. Out of Scope (v1)

- Inline hover with full content (can use peek definition)
- Editing virtual module content (read-only by design)
- Non-VS Code editors
- Workspace trust / restricted mode (follow VS Code best practices)

---

## 10. Next Steps

1. **Create package scaffold** – `packages/virtual-modules-vscode/` with extension manifest
2. **Implement resolver** – Read tsconfig, load plugins, expose `resolve(id, importer) => sourceText`
3. **Implement TextDocumentContentProvider** – Register for `virtual-module` scheme
4. **Implement "Open virtual module" command** – With importer from active editor
5. **Optional: Context menu** – "Open Virtual Module" on import specifiers
6. **Test** – With sample-project and plugin.cjs
7. **Phase 2 (if desired)** – Manifest + FileSystemProvider for Go to definition
