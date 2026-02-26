# Plan — CLI SPA + Vite Virtual Modules

## Subgoal DAG

| subgoal_id | objective | prerequisites | risk | requirement_links | success_check |
| ---------- | --------- | ------------- | ---- | ----------------- | -------- |
| SG-1 | TypedConfig.clients + resolveServerEntry Option | — | low | FR-2, FR-1 | Config has clients; serve accepts no entry |
| SG-2 | createTypedRuntimeVitePlugin in app | SG-1 | low | FR-3, FR-4, FR-6 | typed:config and typed:vite-dev-server resolve |
| SG-3 | ssrForHttp in app with Vite integration | SG-2 | medium | FR-5 | ssrForHttp uses transformIndexHtml when server provided |
| SG-4 | vite-plugin integration + ui re-export | SG-3 | low | FR-6, FR-7 | typedVitePlugin registers runtime plugin; ui re-exports |

## Ordered Tasks

| task_id | owner | prerequisites | validation | safeguards | rollback |
| ------- | ----- | ------------- | ---------- | ---------- | -------- |
| T1 | dev | — | pnpm build | — | revert TypedConfig |
| T2 | dev | T1 | pnpm build, serve in counter | — | revert serverEntry |
| T3 | dev | T2 | pnpm build | — | revert plugin |
| T4 | dev | T3 | pnpm build | — | revert HttpRouter move |
| T5 | dev | T4 | pnpm build | — | revert vite-plugin |
| T6 | dev | T5 | pnpm build | — | revert ui |

## Tactical Replanning Triggers

- Build failure in any package → fix before next task
- Breaking import in examples/todomvc or sample-project → update import paths

## Memory Plan

- capture: clients config default (`["."]`); virtual module IDs
- promotion_criteria: If pattern reused elsewhere
- recall_targets: (none)
