# Generated Source Failures

## T3 HttpApi Baseline

Command:

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "type-checks generated HttpApi source"
```

Clean red diagnostic after fixing Node harness types:

```text
Type 'Effect<{ status: string; }, never, never>' is not assignable to type 'Effect<{ readonly status: "ok"; } | HttpServerResponse, { readonly message: string; }, never>'.
```

Cause:

- `HttpApiBuilder.handle` in `effect@4.0.0-beta.66` validates handler success/error channels against the endpoint schema types.
- The baseline endpoint handler returns an unannotated object literal inside a function, so TypeScript widens `{ status: "ok" }` to `{ status: string }`.
- Generated source must adapt the handler channels to exported schema types instead of leaking widened endpoint inference into installed Effect HttpApi declarations.
