# Skill Ownership Rules

These rules enforce high granularity and prevent blurred boundaries.

1. One public module import path per primary skill.
2. One parent module per facet skill.
3. Router skills navigate only; they do not own module behavior.
4. Every skill must include: `Owned scope`, `Not covered here`, `Escalate to`.
5. If ownership is unclear, ownership defaults to `public-module-manifest.json`.
