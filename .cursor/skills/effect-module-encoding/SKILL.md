---
name: effect-module-encoding
description: Guidance for `effect/Encoding` focused on APIs like decodeHex, encodeHex, and decodeBase64. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Encoding

## Owned scope

- Owns only `effect/Encoding`.
- Source of truth: `packages/effect/src/Encoding.ts`.

## What it is for

- Encoding & decoding for Base64 (RFC4648), Base64Url, and Hex.

## API quick reference

- `decodeHex`
- `encodeHex`
- `decodeBase64`
- `encodeBase64`
- `decodeBase64String`
- `decodeBase64Url`
- `decodeBase64UrlString`
- `decodeHexString`
- `encodeBase64Url`
- `isEncodingError`
- `EncodingError`
- `EncodingErrorTypeId`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Encoding } from "effect";

// Encode a string
console.log(Encoding.encodeBase64("hello")); // "aGVsbG8="

// Encode binary data
const bytes = new Uint8Array([72, 101, 108, 108, 111]);
console.log(Encoding.encodeBase64(bytes)); // "SGVsbG8="
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Encoding.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
