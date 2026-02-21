# API Reference: effect/unstable/workflow/WorkflowProxyServer

- Import path: `effect/unstable/workflow/WorkflowProxyServer`
- Source file: `packages/effect/src/unstable/workflow/WorkflowProxyServer.ts`
- Function exports (callable): 2
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerHttpApi`
- `layerRpcHandlers`

## All Function Signatures

```ts
export declare const layerHttpApi: <ApiId extends string, Groups extends HttpApiGroup.Any, Name extends HttpApiGroup.Name<Groups>, const Workflows extends NonEmptyReadonlyArray<Workflow.Any>>(api: HttpApi.HttpApi<ApiId, Groups>, name: Name, workflows: Workflows): Layer.Layer<HttpApiGroup.ApiGroup<ApiId, Name>, never, WorkflowEngine | Workflow.RequirementsHandler<Workflows[number]>>;
export declare const layerRpcHandlers: <const Workflows extends NonEmptyReadonlyArray<Workflow.Any>, const Prefix extends string = "">(workflows: Workflows, options?: { readonly prefix?: Prefix; }): Layer.Layer<RpcHandlers<Workflows[number], Prefix>, never, WorkflowEngine | Workflow.RequirementsHandler<Workflows[number]>>;
```

## Other Exports (Non-Function)

- `RpcHandlers` (type)
