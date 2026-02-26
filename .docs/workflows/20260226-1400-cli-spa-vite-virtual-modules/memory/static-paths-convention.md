# Static paths convention (short-term memory)

- **Source**: Design in `03-static-html-generation-design.md`.
- **Convention**: Router dirs can declare pre-rendered URLs via:
  - `_staticPaths.ts` (directory): `export default` or `export const getStaticPaths` → Effect yielding iterable of URL strings.
  - `*.staticPaths.ts` (route companion): same export for that route only.
  - In-file: route module may export `getStaticPaths` (same type).
- **Build**: `typed build` will discover these, run the Effects (with app runtime), then use the server render pipeline to pre-render each URL to static HTML.
- **Status**: Design only; implementation not started.
