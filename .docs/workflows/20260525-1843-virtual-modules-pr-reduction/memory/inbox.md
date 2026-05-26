# Memory Inbox

## 2026-05-25 - T0 baseline

- Exact T1 owner files are currently clean, so raw HttpApi client cleanup can start without direct file conflict.
- RealWorld validation is not fully isolated because adjacent RealWorld files are dirty, especially `examples/realworld/src/Api.ts`.
- `examples/realworld/node_modules/.typed/virtual` exists and contains stale wrapper names. T1 must clean/regenerate before trusting artifact scans.
- Wrapper names remain in source/test/docs surfaces, including app HttpApi generator/tests, Storybook runtime generator/tests, RealWorld Home story, Storybook README/fixtures, and Vite plugin tests.

## 2026-05-25 - T1 raw client cleanup

- Generated HttpApi client mode now exposes the raw Effect `Api`, `Client`, `makeClient`, `makeClientWith`, and `makeUrlBuilder` surface without wrapper endpoint mappings.
- Storybook runtime now re-exports raw `makeClient` and `makeClientWith`. The no-API fallback must keep compatible call signatures for both helpers.
- RealWorld `Home.stories.ts` uses `makeClient` from `typed:storybook/runtime?path=/`.
- Clean/regenerated RealWorld virtual artifacts no longer contain `TypedClient` wrapper names.
