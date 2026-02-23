# Research: Virtual Module Type-Checking in VSCode

## Root cause

TypeScript type-checking fails for the virtual module preview because of **three issues**:

### 1. VSCode only enables semantic support for specific schemes

`extensions/typescript-language-features/src/configuration/fileSchemes.ts`:

```ts
export function getSemanticSupportedSchemes() {
  return [file, untitled, walkThroughSnippet, vscodeNotebookCell, chatCodeBlock];
}
```

`virtual-module` and `typed-virtual` are **not** in this list. `hasCapabilityForResource(resource, ClientCapability.Semantic)` returns `false`, so the TS extension skips semantic diagnostics for our documents.

**Caveat**: With TypeScript API v440+, `supportsSyntaxGetErr` is true and the GetErr filter may not apply. Buffers may still be opened.

### 2. `toTsFilePath` omits the query string

`typescriptServiceClient.ts` line 768–772:

```ts
return inMemoryResourcePrefix + '/'
  + resource.scheme + '/'
  + (resource.authority || emptyAuthority)
  + (resource.path.startsWith('/') ? resource.path : '/' + resource.path)
  + (resource.fragment ? '#' + resource.fragment : '');
```

For `virtual-module:///module.ts?id=router:routes&importer=/path/to/router-demo.ts` this produces:

- `^/virtual-module/ts-nul-authority/module.ts`

The **query string** (`id` and `importer`) is dropped. When tsserver calls `getScriptSnapshot("^/virtual-module/ts-nul-authority/module.ts")`, the adapter cannot recover `id` and `importer`, so it cannot look up the virtual module record.

### 3. We need `file://` or path-based identity

`file://` URIs are always supported. The path is preserved in full. For custom schemes, only `scheme + authority + path` are preserved; query and fragment are only partially supported.

## Options

### Option A: Encode identity in path (no disk, no VSCode changes)

Use a URI where the path encodes the virtual file path (which is unique per virtual module):

- **Extension**: `virtual-module:///${virtualFileName}` (e.g. `virtual-module:///Users/me/proj/__virtual_router_abc123.ts`)
- **tsserver path**: `^/virtual-module/ts-nul-authority/Users/me/proj/__virtual_router_abc123.ts`
- **Adapter**: Strip `^/virtual-module/ts-nul-authority` and treat the remainder as `virtualFileName`, then look up `recordsByVirtualFile`.

Pros: No disk writes, no VSCode changes.  
Cons: Still subject to `getSemanticSupportedSchemes` filtering for some flows.

### Option B: Use `file://` URIs (requires disk write)

- Open preview as `vscode.Uri.file(virtualFileName)`.
- Content must exist on disk; we cannot supply content for `file://` without writing (we cannot override the `file` scheme).

**Verdict**: `file://` URIs would give full semantic support but require writing the virtual content to disk (e.g. `.typed/virtual-preview/` or `node_modules/.cache/typed-virtual/`). This is a proven fallback if Option A fails.

### Option C: Use `untitled` scheme

`untitled` is in `getSemanticSupportedSchemes()`. We can open the preview as:

```ts
vscode.workspace.openTextDocument({
  content: result.sourceText,
  language: 'typescript',
});
```

Pros: Supported by VSCode, no disk, no adapter changes for path parsing.  
Cons: No stable URI, new tab per open, not clearly tied to the virtual module.

### Option D: Request VSCode change

Add `virtual-module` and `typed-virtual` to `getSemanticSupportedSchemes()`, or allow extensions to contribute schemes. Requires an upstream PR.

## Do we need `file://` URIs?

**No** – we do not need `file://` for the path-based approach to work. The GetErr/diagnostics flow uses `supportsSyntaxGetErr || hasCapabilityForResource` (typescriptServiceClient.ts ~300). With TS API v440+, `supportsSyntaxGetErr` is true, so documents are synced to tsserver **regardless of scheme**. The blocking issue was the dropped query string; path-based URIs fix that.

**When `file://` helps**: If diagnostics or other features still fail after path-based URIs, using `file://` with a disk write is the most reliable fallback. Vite and others use `.d.ts` on disk for IntelliSense because it works everywhere.

## Recommended path

1. **Option A** (current): Encode `virtualFileName` in the preview URI path so the adapter can look up the record when tsserver uses the `^/...` path.
2. **If A fails**: Try **Option B** (disk write) – write to `.typed/virtual-preview/`, open `vscode.Uri.file(path)`.
3. **Long-term**: Option D – PR to add `virtual-module`/`typed-virtual` to `getSemanticSupportedSchemes()`.

---

## Research: How Volar Handles Virtual Files (Feb 2025)

### Objective

Understand how Volar (Vue Language Tools) represents and surfaces virtual/generated files to avoid "file not found", save prompts, and confusion—and whether those patterns apply to typed-smol's virtual module previews.

### Completed work

- Reviewed Volar.js docs (volarjs.dev), vuejs/language-tools and volarjs/volar.js source
- Compared Vue's VirtualCode model with typed-smol's approach
- Checked VS Code `TextDocumentContentProvider` and `FileSystemProvider` APIs

### Findings / Evidence

#### 1. Volar never shows virtual files in the main editor

Virtual files (e.g. compiled template TS, script blocks) are internal to the language server. Users only edit `.vue` source files. The language service:

- Creates `VirtualCode` objects via `createVirtualCode(fileId, languageId, snapshot)`
- Uses `embeddedCodes` for blocks (script_ts, script_tsx, template, etc.)
- Feeds these directly to its own TypeScript language service host
- Maps diagnostics and locations back to the source via `mappings` / `SourceMap`

So Volar avoids all save prompts and "file not found" UX because virtual content is never opened as a document in the editor.

#### 2. Volar uses script IDs, not custom URI schemes

- `scriptId` = real file path (e.g. `/path/to/App.vue`)
- `asFileName(scriptId)` returns that path
- Embedded VirtualCode IDs: `script_js`, `script_ts`, `script_tsx`, `template`, etc.
- The Vue plugin’s `typescript.getServiceScript` returns `{ code, extension, scriptKind }` for TS-relevant blocks. TypeScript sees these as logical "files" inside the LS, not as VS Code `TextDocument` URIs.

#### 3. Take Over Mode = own TypeScript instance

In Take Over Mode, Volar runs its own TypeScript language service. Virtual code is supplied through a custom host (`getScriptSnapshot`, etc.); tsserver/VS Code never sees virtual documents. No `TextDocumentContentProvider` or `FileSystemProvider` is used for Vue’s virtual code.

#### 4. Volar Labs: debug-only preview

[Volar Labs](https://volarjs.dev/core-concepts/volar-labs) lets developers "Inspect Virtual File" and see virtual source maps. That’s a debug panel, not an editable buffer. So when virtual code is shown, it’s read-only and clearly for inspection.

#### 5. VS Code APIs for our use case

| API | Use case | Save / write behavior |
|-----|----------|------------------------|
| `TextDocumentContentProvider` | Custom scheme, `provideTextDocumentContent` | No save callback; document can become dirty; save may fail or be ignored |
| `FileSystemProvider` | Full virtual FS, `readFile`/`stat` | Can throw `NoPermissions` on `writeFile`; can return `readonly: true` in `FileStat` for "(read-only)" tab badge |
| `untitled` scheme | `openTextDocument({ content })` | In `getSemanticSupportedSchemes()`; no stable URI; users may try to save |

#### 6. typed-smol’s different requirement

We want users to **see** a preview of generated virtual module content (e.g. `router:./routes`). That implies opening a document, unlike Volar’s fully internal model. Implications:

- We must choose a surface: editable tab vs read-only preview
- If read-only: `FileSystemProvider` with `readonly: true` in `FileStat` plus `writeFile` throwing `NoPermissions` gives clear "(read-only)" behavior and avoids accidental saves

### Risks / open questions

1. **FileStat.readonly** – Confirm VS Code version support and that it prevents Save from being offered or handled cleanly.
2. **Volar Labs pattern** – Consider an "Inspect virtual module" panel instead of an editor tab to avoid save UX; trade-off: fewer TS features (e.g. diagnostics) in that panel unless we wire them.

### Recommended next actions

1. **Already done**: `registerFileSystemProvider(..., { isReadonly: true })` is used. Consider also returning `readonly: true` in `FileStat` for per-file signaling if UX differs.
2. Consider a "Virtual Module Inspector" panel (similar to Volar Labs) as an alternative to opening a tab.
3. Keep path-based URIs and `typed-virtual://` for TS identity; FileSystemProvider already provides the content.
