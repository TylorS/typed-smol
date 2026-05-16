# Workflow Memories

## T1 Generated Source Harness

- Generated virtual module source should be type-checked in the same fixture root that produced the emitted source. Creating a second fixture root can make relative generated imports point at files that were not part of the build.
- The shared harness writes the generated source to disk, adds it to the root files, uses strict ESNext Bundler compiler options, and accepts module fallbacks for workspace or declaration-package imports.

## T2 Router Generated Source

- Router guard validation should not rely only on a single TypeInfo projection chain. For `Effect<Option<*>>` guards, first verify the return type is assignable to `Effect`, then inspect the serialized success type for an assignable `Option` node.
- Router generated catch wrappers need explicit `RefSubject<Cause.Cause<unknown>>` parameter annotations under strict type-checking. Snapshot-only tests missed the implicit `any`.
- Layout fixtures used for generated-source proof must satisfy the real Router layout contract by returning an `Fx`, not an identity value.
