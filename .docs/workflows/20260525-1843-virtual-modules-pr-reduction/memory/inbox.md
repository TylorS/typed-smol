# Memory Inbox

## 2026-05-25 - T0 baseline

- Exact T1 owner files are currently clean, so raw HttpApi client cleanup can start without direct file conflict.
- RealWorld validation is not fully isolated because adjacent RealWorld files are dirty, especially `examples/realworld/src/Api.ts`.
- `examples/realworld/node_modules/.typed/virtual` exists and contains stale wrapper names. T1 must clean/regenerate before trusting artifact scans.
- Wrapper names remain in source/test/docs surfaces, including app HttpApi generator/tests, Storybook runtime generator/tests, RealWorld Home story, Storybook README/fixtures, and Vite plugin tests.
