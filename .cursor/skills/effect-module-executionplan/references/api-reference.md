# API Reference: effect/ExecutionPlan

- Import path: `effect/ExecutionPlan`
- Source file: `packages/effect/src/ExecutionPlan.ts`
- Function exports (callable): 3
- Non-function exports: 5

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `isExecutionPlan`
- `make`
- `merge`

## All Function Signatures

```ts
export declare const isExecutionPlan: (u: unknown): u is ExecutionPlan<any>;
export declare const make: <const Steps extends NonEmptyReadonlyArray<make.Step>>(...steps: Steps & { [K in keyof Steps]: make.Step; }): ExecutionPlan<{ provides: make.StepProvides<Steps>; input: make.StepInput<Steps>; error: (Steps[number]["provide"] extends ServiceMap.ServiceMap<infer _P> | Layer.Layer<infer _P, infer E, infer _R> ? E : never) | (Steps[number]["while"] extends (input: infer _I) => Effect.Effect<infer _A, infer _E, infer _R> ? _E : never); requirements: (Steps[number]["provide"] extends Layer.Layer<infer _A, infer _E, infer R> ? R : never) | (Steps[number]["while"] extends (input: infer _I) => Effect.Effect<infer _A, infer _E, infer R> ? R : never) | (Steps[number]["schedule"] extends Schedule.Schedule<infer _O, infer _I, infer R> ? R : never); }>;
export declare const merge: <const Plans extends NonEmptyReadonlyArray<ExecutionPlan<any>>>(...plans: Plans): ExecutionPlan<{ provides: make.PlanProvides<Plans>; input: make.PlanInput<Plans>; error: Plans[number] extends ExecutionPlan<infer T> ? T["error"] : never; requirements: Plans[number] extends ExecutionPlan<infer T> ? T["requirements"] : never; }>;
```

## Other Exports (Non-Function)

- `ConfigBase` (type)
- `CurrentMetadata` (variable)
- `ExecutionPlan` (interface)
- `Metadata` (interface)
- `TypeId` (type)
