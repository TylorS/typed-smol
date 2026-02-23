## Reflection

- Config ownership migrations require all consumer surfaces to update together.
- A resolver that silently returns no plugins can look like an ESM interop failure even when root cause is empty config input.
- Fastest robust debug path: compare behavior against sibling package implementations that already migrated.
- Highest-impact prevention pattern: centralize vmc bootstrap logic in core and let consumers layer only policy differences (fatal vs log-only vs fallback).
- Reliability gain: run `@typed/virtual-modules` build first when new core exports are introduced before validating dependents.
