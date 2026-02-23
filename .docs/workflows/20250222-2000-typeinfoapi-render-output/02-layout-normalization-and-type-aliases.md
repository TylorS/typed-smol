# Layout Normalization and Type Aliases (Plan Addendum)

## Constraints

- **Exports**: Only `layout` or `default` — no new export names.
- **Passthrough layouts removed**: Do not add identity/passthrough layouts to the stack; they waste memory.
- **Support `identity` from effect/Function**: Treat `identity` as passthrough and skip it.
- **No other layout variants**: Just the two forms below.
- **Maximum type safety**, no type casts.

---

## 1. Layout Input Shapes

| Name                  | Signature                             | Behavior                                        |
| --------------------- | ------------------------------------- | ----------------------------------------------- |
| **Layout** (existing) | `(params: LayoutParams) => Fx`        | Full layout; add to stack                       |
| **ContentLayout**     | `(content: Fx<A,E,R>) => Fx<B,E2,R2>` | Content-only; normalize to Layout, add to stack |
| **Passthrough**       | `identity` or `(content) => content`  | **Skip** — do not add to stack                  |

---

## 2. Normalization Strategy

**Single export** (`layout` or `default`). Use TypeInfoApi at plugin build time to classify:

1. **Passthrough**: Layout is `identity` from effect/Function or structurally `(x) => x`. **Do not emit** `.layout()` for this — omit from the chain.
2. **ContentLayout**: First param type is `Fx<...>` (not `LayoutParams`). Emit wrapper: `(params) => ${var}.layout(params.content)`.
3. **Full Layout**: First param is `LayoutParams`. Emit `${var}.layout` as-is.

Plugin uses routeTypeNode-style classification on the layout export's type to pick the correct emission path. No runtime discrimination.

---

## 3. Type Aliases (for user ergonomics)

| Alias             | Purpose                                                     |
| ----------------- | ----------------------------------------------------------- |
| **LayoutParams**  | Already exists: `{ params, content }` for full layouts      |
| **LayoutContent** | `Fx<A, E, R>` — content stream type                         |
| **ContentLayout** | `(content: Fx<A,E,R>) => Fx<B,E2,R2>` — content-only layout |

No PassthroughLayout type — passthroughs are skipped, not typed.

---

## 4. Implementation Outline

### 4.1 Router (@typed/router)

- Add `ContentLayout<A,E,R,B,E2,R2>` type and `LayoutContent` alias.
- Export `identity` support: when `layout === identity` (reference equality), router skips adding it. Plugin may omit passthroughs entirely, so router receives no layout call; router still handles `layout(identity)` if called directly.
- `Matcher.layout()` accepts `Layout | ContentLayout | typeof identity`; normalizes ContentLayout, skips identity.

### 4.2 Plugin (@typed/app)

- Use TypeInfoApi to classify layout export: passthrough | contentOnly | full.
- **Passthrough**: Do not emit `.layout()` for this layout — omit from the matcher chain.
- **ContentOnly**: Emit `.layout((params) => ${var}.layout(params.content))`.
- **Full**: Emit `.layout(${var}.layout)`.
- Resolve layout from `layout` or `default` export only.

### 4.3 Identity detection

- For `export const layout = identity` (or `export default identity`): TypeInfoApi sees a reference to `identity`. Plugin classifies as passthrough and omits.
- Add `typeNodeIsIdentity` (or similar) in routeTypeNode: check for function type `(a: A) => A` or reference to `identity` from effect/Function.
