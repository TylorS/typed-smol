# Testing Strategy — CLI SPA + Vite Virtual Modules

## Test Type Taxonomy

- **unit**: Plugin resolveId/load for typed:config and typed:vite-dev-server; resolveServerEntry Option semantics; clients normalization
- **integration**: `typed serve` in examples/counter (no server) succeeds; typed:config import returns config; typed:vite-dev-server returns server in dev
- **e2e**: N/A for initial delivery (manual verification of SPA serve)

## Critical Path Scenarios

| ts_id | scenario                                                             | maps_to_fr_nfr | maps_to_ac | blocking |
| ----- | -------------------------------------------------------------------- | -------------- | ---------- | -------- |
| TS-1  | `typed serve` in project without server.ts starts and serves SPA     | FR-1           | AC-1       | yes      |
| TS-2  | `typed serve` in project with server.ts still loads server           | FR-1           | AC-1       | yes      |
| TS-3  | `import config from "typed:config"` returns loaded config            | FR-3           | AC-3       | yes      |
| TS-4  | `typed:vite-dev-server` resolves in dev                              | FR-4           | AC-4       | yes      |
| TS-5  | ssrForHttp with Vite applies transformIndexHtml when server provided | FR-5           | AC-5       | yes      |
| TS-6  | @typed/ui ssrForHttp works (re-export)                               | FR-7           | AC-6       | yes      |

## Coverage Targets

- critical_path_target: All TS-\* scenarios pass
- code_coverage_target: New plugin and serve logic covered by unit/integration
- validation_hooks: `pnpm build`; vitest in affected packages; manual `typed serve` in examples/counter

## Dependency Readiness Matrix

| dep                | status | unblock_action |
| ------------------ | ------ | -------------- |
| @typed/app         | ready  | —              |
| @typed/vite-plugin | ready  | —              |
| @typed/ui          | ready  | —              |
| vite               | ready  | —              |

## Acceptance Failure Policy

- TS-\* failure → fix before merge
- Incomplete dep → prioritize unblocking
