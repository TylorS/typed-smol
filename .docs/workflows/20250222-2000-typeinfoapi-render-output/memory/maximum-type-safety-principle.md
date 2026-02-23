# Maximum Type Safety Principle

## Objective
Establish "maximum type safety" as a non-negotiable constraint for all implementation choices in the typed-smol codebase.

## Principle
**We need to be crystal clear going forward: maximum type safety in all choices we make.**

### Implications
- No type casts in generated plugin output (`as any`, `as readonly any[]`, etc.)
- Prefer type guards and proper narrowings over casts in implementation
- Use overloads or discriminated unions when runtime shapes differ
- When implementing `normalizeDependencyInput`: refactor existing `normalizeDependencies` to eliminate `dep as ServiceMap.ServiceMap<any>`—use or add `ServiceMap` type guard for narrowing
- Review existing casts in Matcher.ts; treat elimination as tech debt when touching those paths

### Source
- Self-improvement loop, 2025-02-22
- User: "we need to be crystal clear going forward that we need maximum type safety in all choices we make"
