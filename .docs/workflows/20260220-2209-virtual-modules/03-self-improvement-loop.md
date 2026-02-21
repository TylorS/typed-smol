## Objective and Scope

Apply a reusable process improvement so specifications always include Mermaid diagrams that visually explain key systems and interactions.

## Constraints

- Prioritize user outcome quality and safety over speed.
- Keep the change low-risk and reversible.
- Preserve existing canonical documentation routing.

## Routing Decision

- Decision: **direct execution**
- Rationale:
  - Task is narrow and deterministic (targeted doc/rule/template edits).
  - No mandatory specialist trigger from `.cursor/rules/agent-collaboration.mdc` (not broad exploration, security/perf/debug specialist work, or multi-stream orchestration).

## Self-Improvement Loop

### Observe

- Friction: spec quality depended on ad-hoc text updates; no explicit visual-system requirement in templates/rules.
- Failure mode risk: future specs may omit architecture visuals, reducing scanability and shared understanding.

### Diagnose

- Root cause: no canonical enforcement point requiring Mermaid diagrams in spec artifacts.
- Secondary cause: templates did not provide diagram scaffolding.

### Propose (low-risk options)

1. Update `.docs/_templates/spec.md` to include a Mermaid section scaffold.
2. Update `.cursor/rules/stages/specification.mdc` to require Mermaid diagrams in spec content and exit criteria.
3. Validate immediately by adding concrete Mermaid diagrams to the active `virtual-modules/spec.md`.

### Validate (highest-impact option)

Applied all three options and verified they are consistent:

- Template now includes `## System Diagrams (Mermaid)`.
- Specification stage rule now explicitly requires Mermaid diagrams.
- Active spec now contains two Mermaid diagrams (system architecture + resolution/recompute sequence).

### Consolidate

- Keep: “template + stage-rule + active-doc validation” pattern for process improvements.
- Discard: relying on one-off manual reminders without canonical enforcement.

### Apply Next Step

- Continue specification updates under the new visual-first requirement.
- Use the same pattern for any future spec-authoring standards.

## Impact Report

- outcome quality impact: improved readability and architecture clarity in specs.
- reliability impact: higher consistency because requirement is encoded in both rule and template.
- speed/efficiency impact: modest upfront cost, faster reviews later due to visual summaries.
- reusable pattern: enforce process changes through canonical policy + template + in-flight validation.
