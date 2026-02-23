# Typed Virtual Modules (VS Code)

VS Code extension for virtual module imports (e.g. `router:./routes`, `virtual:foo`).

## Running the extension

1. From repo root: **pnpm install** and **pnpm --filter @typed/virtual-modules-vscode build**
2. In Cursor/VS Code: **Run and Debug** (Ctrl/Cmd+Shift+D) → choose **Run Typed Virtual Modules extension** (or **Run extension + open sample-project**) → F5

## If the extension won't load (invalid / missing package.json)

If you see _"Unable to read file '.../typed.typed-virtual-modules-0.0.0/package.json'"_ or _"Invalid extensions detected"_:

1. **Uninstall the broken copy**: Extensions → search "typed-virtual-modules" or "Typed Virtual Modules" → Uninstall the invalid one (e.g. v0.0.0 or the one with the warning icon).
2. **Run from workspace** using the launch config above (do not install from the marketplace unless you have a published build).

After uninstalling the invalid extension, reload the window and run the extension from the repo via F5.
