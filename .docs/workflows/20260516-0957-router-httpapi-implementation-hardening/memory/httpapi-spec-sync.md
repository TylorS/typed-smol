# HttpApi Spec Sync Memory

- Treat `packages/app/node_modules/effect/dist/unstable/httpapi/*.d.ts` as the source of truth for HttpApi generated source until the dependency target changes.
- Do not emit unsupported `OpenApi.fromApi(Api, ...)` options for stale durable-spec keys such as `additionalProperties`; defer or diagnose instead.
- Keep generated-source type-check fixtures in `packages/app` as the first proof path for virtual-module implementation hardening.
- Files that only look reserved, such as `_unknown.ts`, are non-participating. Diagnostics remain for supported convention misuse.
