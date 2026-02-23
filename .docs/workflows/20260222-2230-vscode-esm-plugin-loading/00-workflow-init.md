## Workflow Init

- objective: Restore VS Code virtual-modules plugin loading for ESM plugin entries after vmc config migration.
- started_at: 2026-02-22T22:30:00-08:00
- started_by: codex-gpt-5.3-codex-xhigh
- source_context_reviewed: user bug report, `packages/virtual-modules-vscode/src/resolver.ts`, `packages/virtual-modules-ts-plugin/src/plugin.ts`, `packages/virtual-modules/src/NodeModulePluginLoader.ts`, recent workflow artifacts
- explicit_reuse_override: false

## Notes

- initial constraints: keep behavior backward compatible for legacy tsconfig plugin lists; avoid destructive git operations; touch minimal files
- initial risks: changing config precedence could alter existing resolver behavior; loader baseDir choice can break relative specifier resolution
