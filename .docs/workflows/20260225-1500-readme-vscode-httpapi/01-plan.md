## Subgoal DAG

| subgoal_id | objective                              | prerequisites | risk | requirement_links | success_check                                    |
| ---------- | -------------------------------------- | ------------- | ---- | ----------------- | ------------------------------------------------ |
| S1         | Add VSCode extension section to README | none          | low  | user request      | Section exists, mentions key features            |
| S2         | Improve HttpApi virtual module demo    | none          | low  | user request      | Richer endpoint examples, generated output shown |

## Ordered Tasks

| task_id | owner | prerequisites | validation                                                                    | safeguards        | rollback               |
| ------- | ----- | ------------- | ----------------------------------------------------------------------------- | ----------------- | ---------------------- |
| T1      | agent | none          | Section references @typed/virtual-modules-vscode, lists key features          | Read-before-write | git checkout README.md |
| T2      | agent | none          | HttpApi section shows richer endpoint examples and generated module structure | Read-before-write | git checkout README.md |
| T3      | agent | T1, T2        | Packages table includes vscode extension                                      | Read-before-write | git checkout README.md |

## Tactical Replanning Triggers

- User feedback on section placement or depth

## Memory Plan

- capture: none needed (docs-only)
- promotion_criteria: n/a
- recall_targets: none
