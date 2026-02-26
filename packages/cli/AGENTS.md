# @typed/cli

## Intent

Vite 7 CLI with server-side capabilities for typed-smol apps. Mirrors `vite`/`vite dev`/`vite build`/`vite preview` and adds `typed run` (vite-node replacement). Uses `effect/unstable/cli` for type-safe parsing.

## Commands

| Command       | Purpose                          |
|---------------|----------------------------------|
| `typed serve` | Dev server (Vite + SSR module)   |
| `typed build` | Client + server multibuild       |
| `typed preview` | Preview production build       |
| `typed run`   | Run TS file with Vite transforms |

## Key surfaces

- **bin**: `typed` → `dist/bin.js`
- **Commands**: `serve`, `build`, `preview`, `run` (see `src/commands/`)
- **Shared**: flags, resolveConfig, serverEntry, viteHelpers

## Requirements

- Project must have `vite.config.ts` with `typedVitePlugin()` for virtual modules
- Server entry: `server.ts` by convention, or `--entry` / vite config option
- `vite >= 7`, `typescript >= 5`

## Constraints

- No vavite dependency; uses Vite 7 native APIs
- Server entry convention: `server.ts`, `server.js`, `server.mts` at root
