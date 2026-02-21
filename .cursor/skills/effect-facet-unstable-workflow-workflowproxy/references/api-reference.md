# API Reference: effect/unstable/workflow/WorkflowProxy

- Import path: `effect/unstable/workflow/WorkflowProxy`
- Source file: `packages/effect/src/unstable/workflow/WorkflowProxy.ts`
- Function exports (callable): 2
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `toHttpApiGroup`
- `toRpcGroup`

## All Function Signatures

```ts
export declare const toHttpApiGroup: <const Name extends string, const Workflows extends NonEmptyReadonlyArray<Workflow.Any>>(name: Name, workflows: Workflows): HttpApiGroup.HttpApiGroup<Name, ConvertHttpApi<Workflows[number]>>;
export declare const toRpcGroup: <const Workflows extends NonEmptyReadonlyArray<Workflow.Any>, const Prefix extends string = "">(workflows: Workflows, options?: { readonly prefix?: Prefix | undefined; }): RpcGroup.RpcGroup<ConvertRpcs<Workflows[number], Prefix>>;
```

## Other Exports (Non-Function)

- `ConvertHttpApi` (type)
- `ConvertRpcs` (type)
