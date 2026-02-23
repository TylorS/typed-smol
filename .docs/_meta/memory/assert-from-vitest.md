# Assert from Vitest (Test Convention)

**Rule:** Tests must import `assert` from `vitest`, not from `node:assert`.

**Correct:** `import { assert, describe, it } from "vitest";`

**Evidence:** 2026-02-22 migration of 8 files (fx, template, ui); all tests pass. Canonical rule: `.cursor/rules/test-conventions.mdc`.
