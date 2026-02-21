# Anchorpoint

We are designing the future of human-in-the-loop agentic engineering.

## Bootup Sequence

### Step 1: Collect Run Configuration

Call `AskQuestion` with the following:

```ts
AskQuestion({
  questions: [
    {
      id: "mode",
      prompt: "What mode?",
      options: [
        { id: "strict", label: "Strict" },
        { id: "vibe", label: "Vibe" },
        { id: "review", label: "Review" }
      ]
    },
    {
      id: "finalization-strategy",
      prompt: "What finalization strategy?",
      options: [
        { id: "pr", label: "PR" },
        { id: "merge", label: "Merge" }
      ]
    }
  ]
})
```

### Step 2: Load Mode Rule and Enforce Stage Order

Using those answers, you MUST load `.cursor/rules/modes/{mode}.mdc` and execute its stage sequence.

- `strict`: `brainstorming -> research -> requirements -> specification -> planning -> execution -> finalization`
- `vibe`: `planning -> execution -> finalization`
- `review`: `review -> finalization`

Do not skip required stages unless the user explicitly asks to.

### Step 3: Initialize Run-Owned Workflow

Before writing any stage artifact under `.docs/workflows/`:

1. Create a new workflow slug using `<YYYYMMDD-HHMM>-<topic-slug>`.
2. Treat any pre-existing workflow folders as reference-only by default.
3. Reuse an existing workflow folder only if the user explicitly asks to continue it.
4. Create `.docs/workflows/<workflow_slug>/00-workflow-init.md` capturing:
   - objective
   - started_at
   - started_by
   - source_context reviewed
   - `explicit_reuse_override` (`true` only with user request)

## Operating Principles

1. **Two-timescale planning**
   - Build an upfront semantic plan (goals, subgoals, dependencies).
   - Adapt tactically during execution with local replanning.
2. **Scoped context**
   - Keep planning, execution, and review contexts separated to reduce drift.
3. **Safe mutation**
   - Verify high-risk or mutating actions before execution.
4. **Evidence before assertion**
   - Ground claims in code, tests, logs, or cited sources.

## Documentation Architecture (`.docs`)

Canonical reference: `.cursor/rules/docs-architecture.mdc`.

## Monorepo Governance

Canonical monorepo policy is defined in:

- `.docs/specs/monorepo-governance/spec.md`

Runtime pointer rule for scoped coding contexts:

- `.cursor/rules/monorepo-governance.mdc`

Do not redefine monorepo policy details in this file; keep this section as a pointer only.

## Specialized Agent Collaboration (`.cursor/agents`)

Specialize agents by task (research, planning, execution, review, documentation), and require concise handoffs.

Subagent routing is mandatory when required by the canonical policy in `.cursor/rules/agent-collaboration.mdc` ("Subagent Usage Policy (required)").
Do not redefine that policy here; treat it as the single source of truth.

### Required Subagent Routing Check

Before substantial work:

1. Classify task shape (narrow direct task vs specialist task vs multi-stream task).
2. Apply mandatory triggers from `.cursor/rules/agent-collaboration.mdc`.
3. Launch required subagent(s) immediately when any trigger matches.
4. Use direct execution only when no trigger matches or the user explicitly requests no subagents.

Recommended swarm roles:

- `swarm-orchestrator`
- `research-scout`
- `requirements-analyst`
- `specification-writer`
- `planning-architect`
- `execution-operator`
- `debug-detective`
- `test-strategist`
- `performance-profiler`
- `security-sentinel`
- `refactor-surgeon`
- `review-auditor`
- `docs-archivist`
- `release-finalizer`

Handoff contract between agents (canonical definition in `.cursor/rules/agent-collaboration.mdc`):

1. Objective
2. Completed work
3. Findings/evidence
4. Risks/open questions
5. Recommended next action

Keep handoffs short, concrete, and directly actionable.
