# @typed/virtual-modules-vscode

> **Beta:** This package is in beta; APIs may change.

VS Code extension that makes **virtual module imports** first-class in the editor. Virtual modules are build-time constructs (e.g. `router:./routes`, `api:./endpoints`, `virtual:foo`) that plugins generate on the fly—this extension lets you navigate and inspect them as if they were real files.

**Purpose:** Without this extension, Go to Definition and similar features fail on virtual imports because the content doesn't exist on disk. The extension resolves virtual modules via `@typed/virtual-modules` and your configured plugins, then serves content through custom URI schemes and a read-only FileSystemProvider—so the TypeScript language service and editor tooling work correctly.

**Capabilities:** Go to Definition, document links, find references, a sidebar tree of virtual imports, and diagnostic commands. Content refreshes automatically when source files change.

| Feature | Description |
|---------|-------------|
| **Go to Definition** | Cmd/Ctrl+click a virtual import → opens generated content |
| **Document links** | Virtual imports are clickable links |
| **Find references** | From a virtual module tab, shows all import sites |
| **Virtual Module Imports view** | Explorer sidebar listing discovered virtual imports |
| **Open from import** | Right-click import → "Virtual Modules: Open virtual module from import" |
| **Diagnose** | Output channel command for debugging go-to-definition |

## Installation

From the monorepo:

```bash
pnpm --filter @typed/virtual-modules-vscode build
```

Then run from the workspace via **Run and Debug** (see [Running the extension](#running-the-extension)). Do not install from the marketplace unless you have a published build.

## Running the extension

1. From repo root: **pnpm install** and **pnpm --filter @typed/virtual-modules-vscode build**
2. In Cursor/VS Code: **Run and Debug** (Ctrl/Cmd+Shift+D) → choose **Run Typed Virtual Modules extension** (or **Run extension + open sample-project**) → F5

## Commands

| Command | Title | Description |
| ------- | ----- | ----------- |
| `typed.virtualModules.open` | Virtual Modules: Open virtual module | Open a virtual module by ID |
| `typed.virtualModules.openFromImport` | Virtual Modules: Open virtual module from import | Open from import at cursor (editor context menu) |
| `typed.virtualModules.openFromTree` | Virtual Modules: Open virtual module from tree | Open from the Virtual Module Imports view |
| `typed.virtualModules.refresh` | Refresh Virtual Modules | Refresh the tree view |
| `typed.virtualModules.diagnoseDefinition` | Virtual Modules: Diagnose go-to-definition at cursor | Debug go-to-definition for the current import |

## Views

- **Virtual Module Imports** — Explorer sidebar view listing virtual module imports found in the workspace. Use the refresh button in the view title to update.

## Activation

The extension activates on TypeScript and TypeScript React files (`onLanguage:typescript`, `onLanguage:typescriptreact`).

## Dependencies

- `@typed/virtual-modules`
- Peer: `typescript` (>=5)

## Errors

See [virtual-modules-errors-and-gotchas](../virtual-modules/.docs/virtual-modules-errors-and-gotchas.md) for full reference. Summary:

- **FileNotFound** — Used for invalid `typed-virtual://` URIs, missing project root, or resolver returning nothing. Callers cannot distinguish without parsing the URI.
- **NoPermissions** — Thrown for `createDirectory`, `writeFile`, `delete`, `rename`; the provider is read-only.
- **Go to Definition** — If `writeVirtualPreviewAndGetPath` throws (e.g. disk full, permission denied), the error is re-thrown and surfaces as a definition failure in the editor.

## Troubleshooting

### Extension won't load (invalid / missing package.json)

If you see _"Unable to read file '.../typed.typed-virtual-modules-0.0.0/package.json'"_ or _"Invalid extensions detected"_:

1. **Uninstall the broken copy**: Extensions → search "typed-virtual-modules" or "Typed Virtual Modules" → Uninstall the invalid one (e.g. v0.0.0 or the one with the warning icon).
2. **Run from workspace** using the launch config above (do not install from the marketplace unless you have a published build).

After uninstalling the invalid extension, reload the window and run the extension from the repo via F5.
