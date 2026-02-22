# Router Virtual Module Plugin — Snapshot Test Design

**Created:** 2025-02-21  
**Purpose:** Comprehensive snapshot test suite locking in all meaningful "match usages" and codegen shape for `RouterVirtualModulePlugin`.  
**Source of truth:** `packages/app/src/RouterVirtualModulePlugin.ts`, existing tests in `RouterVirtualModulePlugin.test.ts`.

---

## 1. Test Matrix

Structured list of scenario combinations. Each row defines a dedicated snapshot test (or a small set of tests). Prefer **one snapshot per scenario** so diffs are clear.

### 1.1 Handler kinds (5 scenarios)

| # | Scenario | Fixture | Expected codegen fragment |
|---|----------|---------|---------------------------|
| H1 | Plain value (non-function) | `handler = 1` | `handler: () => Fx.succeed(Home.handler)` |
| H2 | Plain function | `handler = (p) => 1` | `handler: (params) => Fx.succeed(Page.handler(params))` |
| H3 | Fx (type mentions `Fx`) | `handler: FxHandler = 1` | Pass-through: `handler: MFx.handler` (no wrapper) |
| H4 | Effect (type mentions `Effect`) | `handler: EffectHandler = 1` | Pass-through: `handler: MEffect.handler` |
| H5 | Stream (type mentions `Stream`) | `handler: StreamHandler = 1` | Pass-through: `handler: MStream.handler` |

**Notes:** Fx/Effect/Stream function handlers also pass through (e.g. `(p) => Fx.Fx<...>` → `handler: Async.handler`). H3–H5 already partially covered; add full snapshot for each.

### 1.2 Entrypoint export (3 scenarios)

| # | Scenario | Fixture | Snapshot focus |
|---|----------|---------|----------------|
| E1 | Handler only | `export const handler = 1` | `handler: ...` in match opts |
| E2 | Template only | `export const template = "<div/>"` | `handler: () => Fx.succeed(Template.template)` |
| E3 | Default only | `export default 1` | `handler: () => Fx.succeed(Default.default)` |

**Notes:** Exactly one per route (enforced). RVM-ENTRY-001/RVM-ENTRY-002 tested separately (error path).

### 1.3 Companions — dependencies and layout (6 scenarios)

| # | Scenario | Fixture structure | Expected codegen |
|---|----------|-------------------|------------------|
| C1 | None | Single route, no companions | No `.provide()` or `.layout()` |
| C2 | Sibling only | `page.ts` + `page.dependencies.ts` + `page.layout.ts` | Inline: `dependencies: Page.dependencies`, `layout: Page.layout` in match opts; may also appear in chain if `collectOrderedCompanionPaths` includes them |
| C3 | Directory only | `_dependencies.ts`, `api/_layout.ts`, `api/item.ts` | `.provide(Dependencies)`, `.layout(ApiLayout)` in ancestor→leaf order |
| C4 | Both sibling and directory | `_dependencies.ts`, `users/profile.ts`, `users/profile.dependencies.ts` | Dir in chain + sibling in match opts (or both in chain per implementation) |
| C5 | Multiple ancestors | `_dependencies.ts`, `api/_dependencies.ts`, `api/item.ts` | `.provide(RoutesDependencies).provide(ApiDependencies)` (ancestor first) |
| C6 | Sibling + multiple directory | `api/_layout.ts`, `api/item.ts`, `api/item.layout.ts` | Dir layout in chain, sibling layout in match opts |

**Implementation detail:** `collectOrderedCompanionPaths` returns both sibling and directory paths. Sibling companions also drive inline `dependencies:` / `layout:` in match opts when `hasSiblingDeps` / `hasSiblingLayout`. Snapshot locks actual order.

### 1.4 Route shape (5 scenarios)

| # | Scenario | Fixture | Snapshot focus |
|---|----------|---------|----------------|
| R1 | Single route | `home.ts` | One `Router.match(Home.route, {...})` |
| R2 | Multiple routes at same level | `home.ts`, `about.ts`, `contact.ts` | `.match(Home.route,...).match(About.route,...).match(Contact.route,...)` (sorted by filePath) |
| R3 | Nested routes (path hierarchy) | `users/index.ts`, `users/profile.ts`, `users/[id].ts` | Chain order by path sort |
| R4 | Ambiguous routes (same `route` type) | `shared.ts` route + `a.ts`/`b.ts` re-export | **Error path:** RVM-AMBIGUOUS-001, no snapshot |
| R5 | Index route | `index.ts` | `Router.match(Index.route, {...})` |

### 1.5 Provide/layout order (2 scenarios)

| # | Scenario | Fixture | Expected order |
|---|----------|---------|----------------|
| O1 | Dependencies before layout | Dir `_dependencies.ts` + dir `_layout.ts` | `.provide(...).layout(...)` |
| O2 | Multiple of each, ancestor→leaf | `_dependencies.ts`, `api/_dependencies.ts`, `api/_layout.ts`, `api/items/_layout.ts`, `api/items/x.ts` | `.provide(RoutesDeps).provide(ApiDeps).layout(ApiLayout).layout(ItemsLayout)` |

---

## 2. Naming Convention

### 2.1 Test names

Pattern: **`golden: <brief scenario description>`**

Examples:

- `golden: single route with handler only`
- `golden: single route with template entrypoint`
- `golden: plain value handler`
- `golden: plain function handler`
- `golden: fx handler (pass-through)`
- `golden: effect handler (pass-through)`
- `golden: stream handler (pass-through)`
- `golden: no companions`
- `golden: sibling dependencies and layout`
- `golden: directory dependencies and layout`
- `golden: sibling and directory companions`
- `golden: multiple ancestors dependencies`
- `golden: multiple routes at same level`
- `golden: nested routes`
- `golden: index route`
- `golden: provide and layout order ancestor to leaf`

### 2.2 Snapshot keys

Vitest snapshot keys are derived from `describe` + `it` name. Use:

- **Describe:** `RouterVirtualModulePlugin`
- **It:** `golden: <scenario>`

Resulting key example:  
`RouterVirtualModulePlugin > golden: single route with handler only 1`

---

## 3. Fixture Strategy

### 3.1 Recommendation: one temp dir per test, inline fixture setup

- **Approach:** Each test creates its own `createTempDir()`, writes the minimal file set needed, and runs `plugin.build()`.
- **Rationale:**
  - Tests stay independent; no shared mutable state.
  - Each scenario is self-contained; fixtures are small and readable.
  - No cross-test coupling; failures point to a single scenario.
  - Mirrors current style in `RouterVirtualModulePlugin.test.ts`.

### 3.2 Shared constants

- `ROUTE_SHAPED_EXPORT` — already defined; use for all route files that must pass RVM-ROUTE-002.
- For RVM-ROUTE-002 test, use an invalid route (missing `ast`, `path`, etc.).

### 3.3 Fixture reuse

- Avoid one large fixture tree. Prefer ~1–4 files per scenario.
- For complex scenarios (e.g. O2), use the minimal tree (4–6 files) to exercise order.

### 3.4 Program/session

- Use `makeProgram([importer, ...routeFiles, ...companionFiles])` so all fixtures are in the TS program.
- Use `createTypeInfoApiSession({ ts, program })` and pass `session.api` to `plugin.build()`.
- Ensure `api.directory()` would return these files (tests mock this via the session); the existing pattern uses real file writes + real TypeScript.

**Note:** The plugin’s `build` uses `api.directory("**/*.ts", { baseDir, recursive, watch })`. Tests must provide a session whose `directory()` returns snapshots for the written files. Verify how `createTypeInfoApiSession` and `PluginManager` provide this — current tests pass `session.api` directly to `plugin.build`, which may expect the real API. The test design assumes the existing integration pattern works.

---

## 4. Assertion Strategy

### 4.1 Recommendation: full snapshot per scenario + targeted error assertions

| Assertion type | When to use | Example |
|----------------|--------------|---------|
| **Full snapshot** | Every successful build scenario | `expect(source).toMatchSnapshot()` |
| **Error message** | RVM-* violations (no build success) | `expect(() => plugin.build(...)).toThrow(/RVM-AMBIGUOUS-001/)` |
| **Fragment assertion** | Optional for very long outputs; prefer full snapshot | Avoid unless snapshot is too large |

### 4.2 Pros and cons

| Approach | Pros | Cons |
|----------|------|------|
| **Full snapshot per scenario** | Clear diffs; locks full codegen; easy to add cases | More snapshots; updates require reviewing each |
| **Fragment-only assertions** | Flexible; less churn on unrelated changes | Miss subtle ordering/format changes; weaker lock |
| **Hybrid: one canonical full + fragments** | One golden file for overall shape | Fragments can drift; canonical may not cover all branches |

### 4.3 Chosen strategy

- **Use full snapshot for each success scenario.** Each scenario gets `expect(source).toMatchSnapshot()`.
- **Use error assertions for failure paths** (ambiguous, missing route, multiple entrypoints, invalid route, no entrypoint).
- **Keep one “canonical” golden** as the baseline (current `golden: build output matches snapshot`) — this can remain as the simplest success case and serve as the template for naming.

---

## 5. Edge Cases

| Edge case | Error code | Test approach | Snapshot? |
|-----------|------------|---------------|-----------|
| Ambiguous routes (same route type, different files) | RVM-AMBIGUOUS-001 | `expect(...).toThrow(/RVM-AMBIGUOUS-001/)`; assert message mentions both files | No |
| Missing route export (has handler) | RVM-ROUTE-001 | `expect(...).toThrow(/RVM-ROUTE-001/)` | No |
| Invalid route shape (no ast/path/paramsSchema/pathSchema/querySchema) | RVM-ROUTE-002 | `expect(...).toThrow(/RVM-ROUTE-002/)` | No |
| Multiple entrypoints (handler + template) | RVM-ENTRY-002 | `expect(...).toThrow(/RVM-ENTRY-002/)` | No |
| No entrypoint (has route only) | RVM-ENTRY-001 | `expect(...).toThrow(/RVM-ENTRY-001/)` | No |
| No valid routes (all invalid or none) | RVM-LEAF-001 or first violation | `expect(...).toThrow(/RVM-LEAF-001/)` or other | No |
| Empty directory (no routes) | RVM-LEAF-001 | `expect(...).toThrow(/RVM-LEAF-001/)` | No |

### 5.1 RVM-ROUTE-002 fixture

Create a route file with an object that lacks the required Route shape:

```ts
// Invalid: missing ast, path, paramsSchema, pathSchema, querySchema
export const route = { foo: 1 };
export const handler = 1;
```

---

## 6. Concrete Next Steps (Implementation Checklist)

Ordered list for a developer (or execution-operator) to implement.

1. **Split/rename existing golden**
   - Rename current `golden: build output matches snapshot (TS-6 determinism)` to `golden: single route with handler only` (or keep both; ensure one remains as the canonical minimal case).

2. **Add handler-kind snapshots**
   - H1: `golden: plain value handler` — already covered by current golden; ensure snapshot key is clean.
   - H2: `golden: plain function handler` — add test + snapshot.
   - H3: `golden: fx handler pass-through` — add test + snapshot.
   - H4: `golden: effect handler pass-through` — add test + snapshot.
   - H5: `golden: stream handler pass-through` — add test + snapshot.

3. **Add entrypoint snapshots**
   - E1: Covered by H1.
   - E2: `golden: template entrypoint` — add test + snapshot.
   - E3: `golden: default entrypoint` — add test + snapshot.

4. **Add companion snapshots**
   - C1: `golden: no companions` — same as H1 (already minimal).
   - C2: `golden: sibling dependencies and layout` — add test + snapshot.
   - C3: `golden: directory dependencies and layout` — exists as “composes dependencies and layout”; convert to snapshot.
   - C4: `golden: sibling and directory companions` — add test + snapshot.
   - C5: `golden: multiple ancestors dependencies` — add test + snapshot.
   - C6: `golden: sibling and directory layout` — add test + snapshot.

5. **Add route-shape snapshots**
   - R1: Covered by H1.
   - R2: `golden: multiple routes at same level` — add test + snapshot.
   - R3: `golden: nested routes` — add test + snapshot.
   - R4: Ambiguous — already tested with `toThrow`; keep as error test.
   - R5: `golden: index route` — add test + snapshot.

6. **Add provide/layout order snapshots**
   - O1: Covered by C3.
   - O2: `golden: provide and layout order ancestor to leaf` — add test + snapshot (or enhance C5).

7. **Add edge-case error tests**
   - `build throws RVM-ROUTE-002 when route shape is invalid` — add test.
   - `build throws RVM-ENTRY-001 when no entrypoint` — add test.
   - Ensure RVM-ENTRY-002, RVM-ROUTE-001, RVM-AMBIGUOUS-001, RVM-LEAF-001 are covered (some already exist).

8. **Snapshot file organization**
   - Ensure `__snapshots__/RouterVirtualModulePlugin.test.ts.snap` contains one snapshot per scenario.
   - Run `pnpm test -- -u` (or equivalent) to update snapshots after implementation.
   - Review snapshot diffs for correctness.

9. **Integration tests**
   - Keep existing PluginManager integration tests; optionally add one that asserts a scenario’s `resolved.sourceText` matches a snapshot if desired.

10. **Documentation**
    - Add a short comment in the test file pointing to this design doc for future maintainers.

---

## Appendix: Handler Codegen Matrix (from plugin source)

| runtimeKind | entrypointIsFunction | handlerExpr |
|-------------|---------------------|-------------|
| plain | false | `() => Fx.succeed(M.export)` |
| plain | true | `(params) => Fx.succeed(M.handler(params))` |
| fx/effect/stream | false | `() => M.export` |
| fx/effect/stream | true | `M.handler` |

---

## Appendix: Route Contract Violation Codes

| Code | Meaning |
|------|---------|
| RVM-ROUTE-001 | Missing `route` export (but has entrypoint) |
| RVM-ROUTE-002 | `route` not structurally compatible with Route |
| RVM-ENTRY-001 | No handler/template/default |
| RVM-ENTRY-002 | Multiple entrypoints |
| RVM-LEAF-001 | No valid route leaves |
| RVM-AMBIGUOUS-001 | Same route type from different files |
