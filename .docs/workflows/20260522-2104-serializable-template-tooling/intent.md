# Intent

Expand Typed's compiler/tooling surface from route resumability and HMR planning into a full framework path for serializable runtime applications and type-safe templates.

The goal is to make `@typed/compiler` output actually participate in applications, not remain a sidecar analysis package. That means the compiler needs an `@typed/app` runtime-facing serialization contract, a build-mode Vite integration path, a CLI path that wraps/extends `vmc`, and an editor-facing template type-safety path that can reason about literal HTML more precisely than the current generic `@typed/template` TypeScript types.

This should push toward:

- all compiler-visible runtime boundaries being serializable or explicitly rejected;
- user-provided serialization schemas acting as an optimization and precision path;
- type-directed Effect Schema generation by default anywhere a user-provided schema is not present;
- `html` template optimization flowing through Vite builds;
- `@typed/vite-plugin` exposing this as core framework behavior;
- a companion template TypeScript plugin and VS Code extension integration that actively diagnose invalid template attributes, props, events, spreads, and component/template invocations in-editor;
- one shared diagnostic model across CLI, Vite, TypeScript plugin, and VS Code surfaces.

This workflow should also preserve the previous constraints:

- virtual modules remain the framework substrate;
- `@typed/compiler` integrates with `vmc` and does not replace it;
- `vmc` should become an extensible TypeScript compiler framework that `@typed/compiler` can wrap, rather than only a virtual-module compiler;
- all `@typed/template` `html` templates remain optimization targets;
- stateful HMR/resumability continues to favor explicit Effect Context and `RefSubject.Service` identities.
