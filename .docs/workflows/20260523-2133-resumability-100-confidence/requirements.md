# Requirements

- R1: DataAttr is the only HTML serialization path for route and UI resume metadata.
- R2: Generated route continuations register by descriptor id and compatibility fingerprint.
- R3: Resume payload decode uses user `Serializable.schema(...)` descriptors first and generated schema plans second.
- R4: Generated services are provided through real Effect `Context.Service` tags, not positional arrays.
- R5: `data-typed-resume` supports `load`, `idle`, `visible`, `hover`, `interaction`, and `focus`.
- R6: `EventHandler.action(...)` is the resumable event API; opaque handlers diagnose in strict resumable mode.
- R7: First-party UI state restores from DataAttr and StartupRef, without Hydratable.
- R8: WeakMaps may cache reconstructed values after resume but cannot be resumability source of truth.
- R9: Unsupported TypeScript constructs fail closed with stable diagnostics.
- R10: CLI, Vite, VMC extension, TS plugin, and VS Code diagnostics share the same diagnostic object.
- R11: Generated string outputs and diagnostics use inline snapshots.
- R12: Coverage matrix has no `unknown` cells for v1 resumability rows.
