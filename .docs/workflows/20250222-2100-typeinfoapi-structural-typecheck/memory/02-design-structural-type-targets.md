# Design: Structural type targets for TypeInfoApi

## Option A: Pre-resolved types (recommended)

Host passes `ts.Type` instances when creating the session. TypeInfoApi runs `checker.isTypeAssignableTo(exportType, targetType)` during snapshot creation.

```ts
// types.ts
export interface ResolvedTypeTarget {
  readonly id: string;  // "Fx" | "Effect" | "Stream" | "Route" | "RefSubject" | "Option"
  readonly type: import("typescript").Type;
}

export interface CreateTypeInfoApiSessionOptions {
  readonly ts: typeof import("typescript");
  readonly program: ts.Program;
  readonly maxTypeDepth?: number;
  readonly typeTargets?: readonly ResolvedTypeTarget[];
}

// ExportedTypeInfo extended
export interface ExportedTypeInfo {
  readonly name: string;
  readonly declarationKind?: string;
  readonly declarationText?: string;
  readonly docs?: string;
  readonly type: TypeNode;
  readonly assignableTo?: Readonly<Record<string, boolean>>;  // id -> boolean
}
```

Host responsibility: resolve types before creating the session. Example for Router plugin:

```ts
const fxType = resolveTypeFromModule(program, checker, "@typed/fx", "Fx");
const effectType = resolveTypeFromModule(program, checker, "effect", "Effect");
const streamType = resolveTypeFromModule(program, checker, "effect", "Stream");
const routeType = resolveTypeFromModule(program, checker, "@typed/router", "Route");
// ...
const session = createTypeInfoApiSession({
  ts, program,
  typeTargets: [
    { id: "Fx", type: fxType },
    { id: "Effect", type: effectType },
    { id: "Stream", type: streamType },
    { id: "Route", type: routeType },
  ],
});
```

Plugin then checks `export.assignableTo?.Fx` instead of parsing `export.type.text`.

## Option B: Module specifiers (TypeInfoApi resolves)

Session options include `typeTargets: { id: string; module: string; export: string }[]`. TypeInfoApi resolves these from the program. Fails if no file in the program imports the module.

Downside: Resolution logic lives in virtual-modules; depends on program contents. Option A keeps resolution in the host/plugin layer.

## Option C: Structural fingerprint (no checker)

Define a structural shape (required props) for Fx, Effect, etc. Check TypeNode.properties recursively. No checker needed. Very fragile for interfaces that use generics and branding.

**Recommendation**: Option A. Clear separation of concerns; host controls resolution; API stays minimal.
