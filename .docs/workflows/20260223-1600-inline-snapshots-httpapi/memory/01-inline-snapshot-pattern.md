# Pattern: Prefer inline snapshots over toContain

**Source**: 20260223-1600-inline-snapshots-httpapi self-improvement run

## Observation

Tests used multiple `expect(x).toContain("substring")` assertions to validate build output and validation errors. This pattern is brittle: substring matches obscure full expected shape, and changes to output wording or structure cause noisy failures.

## Change

Replaced with `expect(value).toMatchInlineSnapshot()`:

- **Full output**: `expect(buildResult).toMatchInlineSnapshot()` for emitted source
- **Error objects**: `expect(errorEntry).toMatchInlineSnapshot()` for `{ code, message, pluginName }`
- **Validation results**: `expect(validateEndpointContract(input)).toMatchInlineSnapshot()` for `{ ok, reason }`

## Caveats

- **Volatile paths**: Do NOT snapshot values containing temp dirs or absolute paths that vary per run (e.g. `resolveHttpApiTargetDirectory` returns `targetDirectory` with temp path). Keep structural checks (e.g. `toContain("apis")`) for those.
- **Vitest update**: Use `pnpm exec vitest run <pattern> -u` to generate/update inline snapshots.

## Files updated

- `packages/app/src/HttpApiVirtualModulePlugin.test.ts` (6 snapshots)
- `packages/app/src/httpapiEndpointContract.test.ts` (9 snapshots)
