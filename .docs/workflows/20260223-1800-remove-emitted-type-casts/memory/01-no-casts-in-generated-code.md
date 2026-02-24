# No Type-Casts in Generated Code

**Date:** 2026-02-23  
**Context:** Self-improvement loop on HttpApi virtual module emitted source

## Problem

Emitted HttpApi virtual module code contained type assertions like:
`(${m} as { headers: unknown }).headers` when conditionally including optional endpoint exports (headers, body, success, error). Type-casts in generated code are forbidden.

## Root Cause

The emitter used runtime guards (`"headers" in m && typeof m.headers !== "undefined"`) plus type-casts to satisfy TypeScript when spreading optional properties. The casts were added because the endpoint module type might not declare optional exports, so direct access would fail type-check.

## Solution

Use TypeInfo snapshot export names at emit time instead of runtime detection:
1. Build `optionalExportsByPath: Map<path, Set<'headers'|'body'|'success'|'error'>>` from snapshot.exports
2. Pass it into `emitHttpApiSource`
3. Emit only properties we know exist: `headers: ${m}.headers` (no spread, no guard, no cast)

## Result

- Emitted code: `{ params, query, success, error }` when snapshot shows those exports
- No `as` assertions in generated source
- Cleaner, type-safe output

## TypeInfo-First Principle

**Either the export is in TypeInfo, or it is NOT available.** The compiler (emitter) only references what the caller provides as available via `optionalExportsByPath`—derived strictly from snapshot.exports. No fallback guessing; if it's not in TypeInfo, it is not emitted.
