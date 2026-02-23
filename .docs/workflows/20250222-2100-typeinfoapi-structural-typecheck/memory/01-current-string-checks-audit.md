# Current string-based type checks in virtual module plugins

## Routing decision

**Direct execution** – narrow task: audit existing code, design API extension, document. No broad exploration; target files known (routeTypeNode, TypeInfoApi, RouterVirtualModulePlugin).

## 1. Where string checks occur

### packages/app/src/internal/routeTypeNode.ts

| Function | String dependency | Purpose |
|----------|-------------------|---------|
| `getReferenceTypeName(text)` | Parses `text` via `split("<")`, `split(".")`, `pop()` | Extract unqualified name from display string |
| `typeNodeIsRouteCompatible` | `name === "Route"` | Is type a Route? |
| `runtimeKindFromTypeText` | `name === "Fx"` \| `"Stream"` \| `"Effect"` | Classify Fx/Effect/Stream |
| `typeNodeToRuntimeKind` | Uses `runtimeKindFromTypeText(n.text)` | Route handler kind |
| `typeNodeIsRefSubject` | `name === "RefSubject"` | First param expects RefSubject? |
| `typeNodeIsEffectOptionRef` | `name === "Effect"`, `optionName === "Option"` | Guard return type validation |

Root cause: `node.text` comes from `checker.typeToString(type)`. Format depends on TS config, module resolution, and imports. Different projects can produce `"Fx.Fx<number>"`, `"Fx<number>"`, or namespace-qualified variants. String matching is brittle.

### packages/app/src/RouterVirtualModulePlugin.ts

- Uses `routeTypeNode` for all type decisions.
- Export name checks (`e.name === "route"`, `e.name === "default"`) – these are **structural** (export names from the snapshot). No issue.
- `routeExport.type` and `entrypoint.type` – passed to routeTypeNode, which uses `.text`.

## 2. TypeInfoApi current surface

- **ExportedTypeInfo**: `{ name, declarationKind?, declarationText?, docs?, type: TypeNode }`
- **TypeNode**: Discriminated union with `kind`, `text`, and kind-specific fields (`parameters`, `returnType`, `properties`, `typeArguments`, etc.).
- **No assignability or symbol identity** – `type` is a serialized AST; the original `ts.Type` is discarded after serialization.
- **ReferenceTypeNode** has `text` (from typeToString) and `typeArguments`; no symbol path or declaration reference.

## 3. Gap

Plugins receive **serialized** TypeNodes. They cannot call `checker.isTypeAssignableTo()` because they lack the checker and the original `ts.Type`. The only way to infer type identity today is to parse `text`, which is string-based and unreliable.
