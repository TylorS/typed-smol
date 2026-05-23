# Memory Reflections

- The first substrate step should stay intentionally small: define host-neutral diagnostics and adapters before migrating existing compiler facts. This keeps the next milestones from mixing model design with host integration.
- `vmc` can expose extension seams without depending on `@typed/compiler`. That keeps the dependency direction correct for the future compiler CLI wrapper.
