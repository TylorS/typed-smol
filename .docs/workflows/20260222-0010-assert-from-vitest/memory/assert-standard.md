# Assert import standard

## Rule

Tests must use `assert` from `vitest`, not from `node:assert`.

## Correct

```ts
import { assert, describe, it } from "vitest";
// or when also using expect
import { assert, describe, expect, it } from "vitest";
```

Usage: `assert.strictEqual`, `assert.deepStrictEqual`, `assert.deepEqual`, `assert.ok`, etc.

## Incorrect

```ts
import assert from "node:assert";
import { deepEqual, deepStrictEqual } from "assert";
import * as assert from "node:assert";
```

## Rationale

- Single test runtime: Vitest provides assert with compatible API.
- Consistent imports across the monorepo.
- Avoids mixing Node assert with Vitest's runtime context.

## Evidence

- 2026-02-22: Migrated 8 files (fx: 3, template: 3, ui: 2) from node:assert to vitest assert.
- All affected tests pass after migration.
