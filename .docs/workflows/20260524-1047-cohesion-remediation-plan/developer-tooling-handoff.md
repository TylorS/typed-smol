# Developer Tooling Handoff

- status: another agent is still working through `.docs/workflows/20260522-2104-serializable-template-tooling/`
- blocked_surfaces:
  - virtual-module host/plugin/VS Code/TS plugin diagnostics
  - compiler CLI and vmc extension hooks
  - null-byte virtual id cleanup
- allowed_overlap:
  - app runtime helper consumed by generated browser source
  - compiled-template action-resume bootstrapping only
- required_before_tooling_edits: explicit handoff from the developer-tooling agent or human approval
- subagent_routing: direct execution for this checkpoint because the callable subagent tool requires explicit user delegation.

- blocker: upstream local acceptance requires `hurl`, but `command -v hurl` returned exit code 1 in this environment
- owner: environment prerequisite
- handoff status: blocked before `pnpm --filter typed-realworld test:acceptance:local`; do not treat acceptance as verified
- failing command: `command -v hurl && pnpm --filter typed-realworld exec playwright install chromium`
- exact error: `command -v hurl` produced no path and exited 1
- required next action: install Hurl, then rerun `pnpm --filter typed-realworld test:acceptance:local`

- null-byte virtual id warning: not observed in the final non-acceptance gates after cache regeneration
- browser externalization warnings: still observed during RealWorld build and Storybook build for server-oriented Node imports; no build failure observed, but this remains a developer-tooling/runtime bundling follow-up
- compiler HMR warning: fixed in cohesion remediation by emitting Vite-detectable `import.meta.hot.accept(` calls; verified with `pnpm --filter typed-realworld test:hmr:local`
- Vite/TS plugin/VS Code diagnostics: untouched by this remediation pass
