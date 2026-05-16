# Workflow Memories

## T1 Generated Source Harness

- Generated virtual module source should be type-checked in the same fixture root that produced the emitted source. Creating a second fixture root can make relative generated imports point at files that were not part of the build.
- The shared harness writes the generated source to disk, adds it to the root files, uses strict ESNext Bundler compiler options, and accepts module fallbacks for workspace or declaration-package imports.
