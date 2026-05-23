# Memory Episodes

## M1 - Shared Diagnostics

- Added `@typed/compiler` shared diagnostics with stable sorting/fingerprinting and pure adapters for TypeScript, virtual-module, and Vite-shaped diagnostics.
- Kept host adapters dependency-light: no Vite or VS Code imports in compiler core.
- Preserved existing route/template diagnostics for compatibility; migration is deferred until host consumers need the shared model.
