# Workflow Memories

## T1 Generated Source Harness

- Generated virtual module source should be type-checked in the same fixture root that produced the emitted source. Creating a second fixture root can make relative generated imports point at files that were not part of the build.
- The shared harness writes the generated source to disk, adds it to the root files, uses strict ESNext Bundler compiler options, and accepts module fallbacks for workspace or declaration-package imports.

## T2 Router Generated Source

- Router guard validation should not rely only on a single TypeInfo projection chain. For `Effect<Option<*>>` guards, first verify the return type is assignable to `Effect`, then inspect the serialized success type for an assignable `Option` node.
- Router generated catch wrappers need explicit `RefSubject<Cause.Cause<unknown>>` parameter annotations under strict type-checking. Snapshot-only tests missed the implicit `any`.
- Layout fixtures used for generated-source proof must satisfy the real Router layout contract by returning an `Fx`, not an identity value.

## T3/T4 HttpApi Generated Source

- The generated-source harness needs Node types enabled because HttpApi emitted source imports `node:http`.
- Installed `HttpApiBuilder.handle` checks endpoint handlers against schema-decoded success/error channel types. Generated non-raw handlers should adapt user handler success/error channels to `Schema.Schema.Type<typeof Module.success/error>` when those exports exist.

## T5 HttpApi Non-Participation

- Unsupported underscore-prefixed files like `_unknown.ts` should classify as `non_participating`, not warning-producing `unsupported_reserved`. Keep diagnostics for files that actually collide with supported conventions, such as misplaced `_api.ts`.
