# Intent

The branch should converge from four mostly-successful parallel streams into one coherent product slice:

- `@typed/ui` is the headless, template-native component layer.
- `@typed/compiler` and `@typed/template` emit and run optimized templates with resumability hooks.
- `@typed/app` owns the browser runtime handoff for route resume, action resume, and DOM devtools observation.
- `@typed/storybook` remains a consumer of app virtual modules rather than a second framework runtime.
- Chrome DevTools receives a stable browser bridge instead of reaching for an uninstalled global.
- `examples/realworld` ends as a fully functional, RealWorld-spec-compliant flagship app, not only a build fixture.
- Resumability is complete end to end for the shipped app path: server-rendered route state, action handlers, compiled DOM templates, Storybook stories, and browser hydration all use the same resumable runtime.
- Architecture remains sustainable for the next five years by enforcing the package ownership model in `.docs/adrs/20260524-runtime-cohesion-ownership-boundaries.md`.

The developer-tooling workflow is still active under another agent. This plan therefore separates app/runtime fixes from tooling-host fixes and adds an explicit handoff checkpoint before touching developer-tooling-owned surfaces.
