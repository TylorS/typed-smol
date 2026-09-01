# Typed

> **Beta:** This repository and all packages are in **beta**.

**Typed** is a fully **Effect-native UI framework** for building typed, reliable web applications.

## Documentation website

`apps/website` is the production SSR marketing and documentation application. It is itself built
with Typed and exposes one normalized first-slice corpus as semantic HTML, negotiated/direct
Markdown, JSON, deterministic search, a read-only MCP endpoint, WebMCP tools, a glossary, and agent
discovery artifacts.

```sh
pnpm --filter typed-website docs:generate
pnpm --filter typed-website test:docs
pnpm --filter typed-website typecheck
pnpm --filter typed-website test:production
```

The documentation extractor intentionally uses TypeScript 6.0's compiler API under the
`typescript-compiler` alias. The workspace and website continue to compile with TypeScript 7;
only 7's changed package-root compiler API is avoided by the extractor.
