# Implementation Notes

- For literal unions in this Effect version, use `Schema.Literals([...])`; `Schema.Literal("a", "b")` validates only the first literal.
- `DataAttr` schemas are whole `.data` object schemas, not per-attribute descriptors.
- DataAttr field schemas are service-free `Schema.Codec<any, any, never, never>` values so encode/decode effects do not require unknown services.
- Effect v4 uses `Context.Service(...)` for provider keys; `Context.GenericTag` is not available at runtime.
- `StartupRef.fromData` decodes DOM `dataset` through a whole-object `DataAttr` schema and merges the decoded fields into the existing `RefSubject` state.
- `StartupRef.compose` combines multiple startup ref callbacks for a single template `ref` attribute.
- Disclosure uses `DataAttr.encode` through `RefSubject.mapEffect` to emit stable `data-open` while preserving direct `RefSubject` state and inferred template return types.
