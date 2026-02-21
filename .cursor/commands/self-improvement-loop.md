---
description: Trigger a structured agent self-improvement loop
argument-hint: "<objective and scope>"
---

Run a self-improvement loop for this objective:
`{{args}}`

Follow this sequence:

1. Clarify objective and constraints.
2. Run a routing decision (`direct` vs `specialist subagent` vs `swarm`) using `.cursor/rules/agent-collaboration.mdc`.
3. Execute the loop:
   - Observe: capture friction, retries, delays, and failure modes.
   - Diagnose: identify root causes.
   - Propose: suggest 1-3 low-risk improvements.
   - Validate: apply and test the highest-impact improvement.
   - Consolidate: keep what worked; discard what did not.
   - Apply: use the improved pattern in the next step.
4. Preserve evidence and memory:
   - write short-term memory in `.docs/workflows/<workflow_slug>/memory/`
   - promote durable insights to `.docs/_meta/memory/` only when evidence-backed
5. Report:
   - outcome quality impact
   - reliability impact
   - speed/efficiency impact
   - reusable pattern to carry forward

Constraints:

- Prioritize user outcome quality and safety over speed.
- Do not take destructive actions without explicit approval.
- Keep final output concise and evidence-based.
