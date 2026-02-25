## Workflow Init

- objective: Add support for virtual modules importing other virtual modules; teach adapters (LS, CompilerHost, Vite) to walk the importer chain back to the root real-file importer when resolving imports from virtual modules
- started_at: 2026-02-25T16:00
- started_by: user
- source_context_reviewed: packages/virtual-modules/, packages/virtual-modules-vite/, packages/virtual-modules-ts-plugin/, packages/vite-plugin/
- explicit_reuse_override: false

## Notes

- initial constraints: Sync-only build(), no re-entrancy during build(), existing plugin contract unchanged
- initial risks: Medium -- resolution path changes; requires thorough tests for LS, CH, and Vite adapters
