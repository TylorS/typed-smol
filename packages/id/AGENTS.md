# @typed/id

## Intent

Type-safe ID generation for Effect: Cuid, Ksuid, NanoId, Ulid, Uuid4/5/7. Branded schemas and Effect services (Ids, RandomValues, DateTimes, CuidState, Uuid7State).

## Key exports / surfaces

- `Ids`, `Ids.Default`, `Ids.Test`, individual ID modules (Cuid, Ksuid, NanoId, Ulid, Uuid4, Uuid5, Uuid7)
- Dependencies: `effect`

## Constraints

- Effect skill loading when modifying services: `.cursor/rules/effect-skill-loading.mdc`
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`

## Pointers

- README for full API reference
- Root AGENTS.md for bootup/modes
