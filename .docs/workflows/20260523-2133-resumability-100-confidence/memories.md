# Memories

- DataAttr remains the only resumability serialization channel.
- Hydratable must not be recreated; schema encode/decode plus StartupRef/DataAttr is the state bootstrap path.
- Component identity should be compiler-derived from file/module id, export name, local symbol name, declaration kind, and source token position.
- Serializable UI event resume is registry-driven: compiled/server DOM emits `data-typed-action-*` DataAttrs, boot reads them, and `@typed/app/resumability` dispatches through registered action descriptors.
- Captured outer `let` and `var` remain fail-closed.
- Other agents are active in the same worktree; do not revert unrelated changes.
