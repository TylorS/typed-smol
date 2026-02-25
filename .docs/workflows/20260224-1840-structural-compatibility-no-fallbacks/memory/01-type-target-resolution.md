# Type Target Resolution for Structural Compatibility

## Root Cause: Namespace Imports Not Handled

`resolveTypeTargetsFromSpecs` in TypeInfoApi.ts only processed:
- Named imports: `import { X } from "module"`
- Default imports: `import X from "module"` (binding.name branch)

It did **not** handle namespace imports: `import * as X from "module"`. For namespace imports, the binding lives in `binding.namedBindings` with `isNamespaceImport(binding.namedBindings) === true`, and the namespace identifier is `binding.namedBindings.name`.

## Fix

Added `else if (tsMod.isNamespaceImport(binding.namedBindings))` branch that iterates all specs matching the module and extracts types via `nsType.getProperty(spec.exportName)`.

## Bootstrap for Tests

Router tests use fixtures in temp dirs. `resolveTypeTargetsFromSpecs` scans program source files for imports. Without a file that imports from effect/@typed/fx/@typed/router, typeTargets stay empty and assignableTo is undefined.

**Solution:** Added `typeTargetBootstrap.ts` in app/src/internal/ with imports from effect, @typed/fx, @typed/router. `buildRouterFromFixture` includes this file in the program when it exists. Tests that create sessions directly must pass `typeTargetSpecs: ROUTER_TYPE_TARGET_SPECS` and include the bootstrap in the program.

## Spec Module Path Variants

ROUTER_TYPE_TARGET_SPECS includes alternate module paths so resolution works with common import styles:
- Effect: "effect" and "effect/Effect"
- Stream: "effect" and "effect/Stream"
- Fx: "@typed/fx" and "@typed/fx/Fx"
