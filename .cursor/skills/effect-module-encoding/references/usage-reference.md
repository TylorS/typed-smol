# Usage Reference: effect/Encoding

- Import path: `effect/Encoding`

## What It Is For

Encoding & decoding for Base64 (RFC4648), Base64Url, and Hex.

## How To Use

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Encoding } from "effect";

// Encode a string
console.log(Encoding.encodeBase64("hello")); // "aGVsbG8="

// Encode binary data
const bytes = new Uint8Array([72, 101, 108, 108, 111]);
console.log(Encoding.encodeBase64(bytes)); // "SGVsbG8="
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
