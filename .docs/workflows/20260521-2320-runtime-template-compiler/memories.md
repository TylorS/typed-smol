# Runtime Template Compiler Execution Memories

## Task 5: DOM Emitter

- `DomRenderTemplate` keeps event listeners alive only while its render scope is open. DOM oracle tests that assert event behavior must interact with the runtime-rendered element before `Effect.scoped` closes.
- Fresh DOM rendering for node holes uses a trailing `<!--/n_i-->` comment. Primitive values are inserted before that marker; nullish values leave only the marker.
- Multi-root DOM templates are bounded by `<!--t_hash-->` and `<!--/t_hash-->`, matching `persistent(document, template.hash, fragment)`.
- Sparse class parts preserve each sparse segment as a class-list contribution. Joining the sparse text first incorrectly turns `["count-", "active"]` into `count-active`; runtime produces `count- active`.
- `.data=${{ userId: "7" }}` currently maps through `data-${key}` attribute setup, so the DOM attribute is `data-userid`, not `data-user-id`.
