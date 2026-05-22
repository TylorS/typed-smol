# Implementation Notes

- For literal unions in this Effect version, use `Schema.Literals([...])`; `Schema.Literal("a", "b")` validates only the first literal.
- `DataAttr` schemas are whole `.data` object schemas, not per-attribute descriptors.
- DataAttr field schemas are service-free `Schema.Codec<any, any, never, never>` values so encode/decode effects do not require unknown services.
- Effect v4 uses `Context.Service(...)` for provider keys; `Context.GenericTag` is not available at runtime.
