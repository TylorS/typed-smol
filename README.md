# Typed

> **Beta:** This repository and all packages are in **beta**.

**Typed** is an Effect-native toolkit for reactive state, HTML templates, routing, and accessible UI.
Use the pieces you need, with explicit dependencies and scoped lifetimes.

Start with the [documentation](https://tylors.github.io/typed-smol/),
[Quick Start](https://tylors.github.io/typed-smol/explore/quick-start/), or
[package reference](https://tylors.github.io/typed-smol/reference/).
Typed builds on [Effect](https://effect.website/).

## Documentation website

`apps/website` is an Astro static site for GitHub Pages. Guides, integration recipes, the Quick
Start, and TodoMVC tutorial live in Markdown. The API reference is generated from public package
exports and source documentation. Interactive examples, search, and theme controls use Typed
islands through the new `@typed/astro` workspace package.

```sh
pnpm --filter typed-website docs:generate
pnpm --filter typed-website test:docs
pnpm --filter typed-website typecheck
pnpm --filter typed-website test:production
pnpm --filter typed-website dev
```

See [website development](apps/website/README.md) and the
[@typed/astro integration](packages/astro/README.md) for commands and rendering contracts.
