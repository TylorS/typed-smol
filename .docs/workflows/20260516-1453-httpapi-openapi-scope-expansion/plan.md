# HttpApi OpenAPI Scope Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `api:` virtual-module OpenAPI support for root generation/exposure, group annotations, and endpoint annotations while preserving installed Effect compatibility.

**Architecture:** Keep `_api.ts` and `_group.ts` as the root/group control modules. Split OpenAPI planning into extraction/normalization/planning before emission so scope diagnostics and precedence are testable independently from generated source rendering. Emit only APIs available in installed `packages/app` Effect declarations; binary `additionalProperties` becomes an OpenAPI transform annotation rather than unsupported `OpenApi.fromApi(Api, ...)` options.

**Tech Stack:** TypeScript, Vitest, `@typed/virtual-modules`, `@typed/app`, installed `effect@4.0.0-beta.66` unstable HttpApi declarations.

---

## File Structure

- Modify: `packages/app/src/internal/extractHttpApiOpenApi.ts`
  - Extract `annotations`, `generation.additionalProperties`, and `exposure` from `openapi` named exports and default-exported companion OpenAPI config.
- Modify: `packages/app/src/internal/httpapiOpenApiConfig.ts`
  - Normalize root-only binary generation config.
  - Reject generation/exposure outside API scope.
  - Reject object-shaped `additionalProperties`.
  - Keep annotation key filtering as the central whitelist.
- Create: `packages/app/src/internal/httpapiOpenApiPlan.ts`
  - Build a deterministic OpenAPI plan from descriptor tree + snapshots.
  - Own root, group, and endpoint OpenAPI scope resolution.
  - Own endpoint annotation precedence and diagnostics.
- Modify: `packages/app/src/internal/emitHttpApiSource.ts`
  - Accept `openapiPlan`.
  - Emit API transform annotations, group annotations, and endpoint annotations.
  - Preserve existing root exposure output.
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.ts`
  - Replace direct `_api.ts` OpenAPI extraction with plan construction.
  - Include OpenAPI plan diagnostics in build errors.
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
  - Add red/green generated-source tests for root generation, group annotations, endpoint annotations, precedence, and diagnostics.
- Modify: `.docs/specs/httpapi-virtual-module-plugin/spec.md`
  - Align durable spec with the approved `_api.ts` / `_group.ts` / endpoint OpenAPI design.
- Modify: `.docs/specs/httpapi-virtual-module-plugin/requirements.md`
  - Update requirements for binary `additionalProperties` and scoped annotations.
- Modify: `.docs/specs/httpapi-virtual-module-plugin/testing-strategy.md`
  - Add blocking generated-source proof for root/group/endpoint OpenAPI scope expansion.

## Task 1: Root Binary `additionalProperties` Generation

**Files:**
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
- Modify: `packages/app/src/internal/extractHttpApiOpenApi.ts`
- Modify: `packages/app/src/internal/httpapiOpenApiConfig.ts`
- Create: `packages/app/src/internal/httpapiOpenApiPlan.ts`
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.ts`
- Modify: `packages/app/src/internal/emitHttpApiSource.ts`

- [x] **Step 1: Write failing tests**

Add tests under the existing `"3g. Path prefix and OpenAPI exposure"` describe block:

```ts
it("_api.ts openapi.generation.additionalProperties false emits strict OpenAPI transform", () => {
  const apiWithGeneration = `
export const openapi = {
  generation: {
    additionalProperties: false as const,
  },
};
`;
  const fixture = createApiFixture({
    "src/apis/_api.ts": apiWithGeneration,
    "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
  });
  const result = buildApiFromExistingFixture(fixture);
  expect(result).not.toHaveProperty("errors");
  const sourceText = getSourceText(result);
  expect(sourceText).toBeDefined();
  if (!sourceText) return;
  expect(sourceText).toContain("const applyOpenApiAdditionalProperties");
  expect(sourceText).toContain("additionalProperties: false");
  expect(sourceText).toContain("OpenApiModule.annotations");
  expect(sourceText).toContain(".annotateMerge(");
  expect(sourceText).not.toContain("OpenApiModule.fromApi(Api,");
  expectHttpApiGeneratedSourceToTypeCheck(
    fixture,
    sourceText,
    "src/api-openapi-generation.generated.ts",
  );
});

it("_api.ts openapi.generation.additionalProperties true emits allow OpenAPI transform", () => {
  const fixture = createApiFixture({
    "src/apis/_api.ts": `
export const openapi = {
  generation: {
    additionalProperties: true as const,
  },
};
`,
    "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
  });
  const result = buildApiFromExistingFixture(fixture);
  expect(result).not.toHaveProperty("errors");
  const sourceText = getSourceText(result);
  expect(sourceText).toBeDefined();
  expect(sourceText).toContain("additionalProperties: true");
  expectHttpApiGeneratedSourceToTypeCheck(
    fixture,
    sourceText!,
    "src/api-openapi-generation-allow.generated.ts",
  );
});
```

- [x] **Step 2: Verify red**

Run:

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "additionalProperties"
```

Expected: fails because extraction does not read `generation`, the emitter has no transform helper, or generated source lacks the asserted text.

- [x] **Step 3: Implement extraction and normalization**

Update `ExtractedOpenApiConfig`:

```ts
export type ExtractedOpenApiConfig = {
  readonly annotations?: OpenApiAnnotationsConfig;
  readonly generation?: OpenApiGenerationConfig;
  readonly exposure?: OpenApiExposureConfig;
};
```

Extract `generation`:

```ts
const generation = getGenerationConfig(getProperty(openapiType, "generation"));
```

Add:

```ts
function getGenerationConfig(node: TypeNode | undefined): OpenApiGenerationConfig | undefined {
  const value = getPropertyFromOptionalObject(node, "additionalProperties");
  if (!value) return undefined;
  if (value.text === "true") return { additionalProperties: true };
  if (value.text === "false") return { additionalProperties: false };
  if (value.kind === "object") return { additionalProperties: getObjectValue(value) ?? {} };
  return undefined;
}

function getPropertyFromOptionalObject(node: TypeNode | undefined, name: string): TypeNode | undefined {
  if (!node) return undefined;
  return getProperty(node, name);
}
```

Update `normalizeOpenApiConfig` so object-shaped `additionalProperties` produces:

```ts
{
  code: "AVM-OPENAPI-005",
  message: "OpenAPI generation.additionalProperties only supports boolean true|false in this tranche.",
  scope,
}
```

- [x] **Step 4: Implement the OpenAPI plan boundary**

Create `httpapiOpenApiPlan.ts`:

```ts
import type { TypeInfoFileSnapshot } from "@typed/virtual-modules";
import type { HttpApiDescriptorTree } from "./httpapiDescriptorTree.js";
import { extractOpenApiConfig } from "./extractHttpApiOpenApi.js";
import {
  normalizeOpenApiConfig,
  type OpenApiAnnotationsConfig,
  type OpenApiConfigDiagnostic,
  type OpenApiExposureConfig,
  type OpenApiGenerationConfig,
} from "./httpapiOpenApiConfig.js";

export interface HttpApiOpenApiPlan {
  readonly api: {
    readonly annotations: OpenApiAnnotationsConfig;
    readonly generation: OpenApiGenerationConfig;
    readonly exposure: OpenApiExposureConfig;
  };
  readonly groupAnnotationsByPath: ReadonlyMap<string, OpenApiAnnotationsConfig>;
  readonly endpointAnnotationsByPath: ReadonlyMap<string, OpenApiAnnotationsConfig>;
  readonly diagnostics: readonly OpenApiConfigDiagnostic[];
}

export function buildHttpApiOpenApiPlan(input: {
  readonly tree: HttpApiDescriptorTree;
  readonly snapshotsByRelativePath: ReadonlyMap<string, TypeInfoFileSnapshot>;
}): HttpApiOpenApiPlan {
  const diagnostics: OpenApiConfigDiagnostic[] = [];
  const apiRoot = input.tree.conventions.find((c) => c.kind === "api_root");
  const extracted = apiRoot
    ? extractOpenApiConfig(input.snapshotsByRelativePath.get(apiRoot.path)!)
    : null;
  const normalized = normalizeOpenApiConfig("api", {
    annotations: extracted?.annotations,
    generation: extracted?.generation,
    exposure: extracted?.exposure,
  });
  diagnostics.push(...normalized.diagnostics);
  return {
    api: normalized.config,
    groupAnnotationsByPath: new Map(),
    endpointAnnotationsByPath: new Map(),
    diagnostics,
  };
}
```

Then replace direct `_api.ts` OpenAPI extraction in `HttpApiVirtualModulePlugin.ts` with `buildHttpApiOpenApiPlan(...)`.

- [x] **Step 5: Emit transform annotation**

In `emitHttpApiSource.ts`, change input to accept `openapiPlan?: HttpApiOpenApiPlan`.

Render API expression with:

```ts
const apiExpr = renderAnnotatedApiExpression(
  `HttpApi.make(${JSON.stringify(apiId)})${apiChain}`,
  input.openapiPlan?.api.annotations,
  input.openapiPlan?.api.generation,
);
```

Add:

```ts
function renderAnnotatedApiExpression(
  apiExpression: string,
  annotations: OpenApiAnnotationsConfig | undefined,
  generation: OpenApiGenerationConfig | undefined,
): string {
  const merged = {
    ...(annotations ?? {}),
    ...renderGenerationAnnotations(generation),
  };
  if (Object.keys(merged).length === 0) return apiExpression;
  return `${apiExpression}.annotateMerge(OpenApiModule.annotations(${renderObjectLiteral(merged)}))`;
}

function renderGenerationAnnotations(
  generation: OpenApiGenerationConfig | undefined,
): Record<string, unknown> {
  if (generation?.additionalProperties === undefined) return {};
  return { transform: "applyOpenApiAdditionalProperties" };
}
```

Update `renderValue` to render the sentinel string as an identifier:

```ts
if (value === "applyOpenApiAdditionalProperties") return value;
```

Emit helper only when generation is present:

```ts
const openApiHelpers = input.openapiPlan?.api.generation.additionalProperties === undefined
  ? ""
  : `
const applyOpenApiAdditionalProperties = (spec: Record<string, any>): Record<string, any> => {
  const visit = (value: unknown): unknown => {
    if (!value || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(visit);
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(record)) next[key] = visit(entry);
    if (next.type === "object" && next.additionalProperties === undefined) {
      next.additionalProperties = ${String(input.openapiPlan?.api.generation.additionalProperties)};
    }
    return next;
  };
  return visit(spec) as Record<string, any>;
};
`;
```

Place `${openApiHelpers}` before `export const Api = ...`.

- [x] **Step 6: Verify green and commit**

Run:

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "additionalProperties"
pnpm --filter @typed/app build
pnpm --filter @typed/app test
```

Expected: all pass.

Commit:

```bash
git add packages/app/src/HttpApiVirtualModulePlugin.test.ts packages/app/src/HttpApiVirtualModulePlugin.ts packages/app/src/internal/extractHttpApiOpenApi.ts packages/app/src/internal/httpapiOpenApiConfig.ts packages/app/src/internal/httpapiOpenApiPlan.ts packages/app/src/internal/emitHttpApiSource.ts
git commit -m "fix(app): support httpapi openapi generation config" -m "- normalize root binary additionalProperties config" -m "- emit installed-compatible OpenAPI transform annotations"
```

## Task 2: Root Exposure Through the OpenAPI Plan

**Files:**
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
- Modify: `packages/app/src/internal/httpapiOpenApiPlan.ts`
- Modify: `packages/app/src/internal/emitHttpApiSource.ts`
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.ts`

- [ ] **Step 1: Write failing composed root test**

Add:

```ts
it("_api.ts openapi generation composes with JSON Swagger and Scalar exposure", () => {
  const fixture = createApiFixture({
    "src/apis/_api.ts": `
export const openapi = {
  generation: { additionalProperties: false as const },
  exposure: {
    jsonPath: "/openapi.json" as const,
    swaggerPath: "/swagger" as const,
    scalar: { path: "/docs" as const, source: "inline" as const, config: { theme: "default" as const } },
  },
};
`,
    "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
  });
  const result = buildApiFromExistingFixture(fixture);
  expect(result).not.toHaveProperty("errors");
  const sourceText = getSourceText(result);
  expect(sourceText).toContain('openapiPath: "/openapi.json"');
  expect(sourceText).toContain('path: "/swagger"');
  expect(sourceText).toContain("HttpApiScalar.layer(Api");
  expect(sourceText).toContain("applyOpenApiAdditionalProperties");
  expectHttpApiGeneratedSourceToTypeCheck(
    fixture,
    sourceText!,
    "src/api-openapi-generation-exposure.generated.ts",
  );
});
```

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "generation composes"
```

Expected: fails until emitter consumes exposure through the plan.

- [ ] **Step 3: Route exposure through plan**

Remove separate `openapiExposure` input from `emitHttpApiSource`. Read:

```ts
const jsonPath = input.openapiPlan?.api.exposure.jsonPath;
const swaggerPath = input.openapiPlan?.api.exposure.swaggerPath;
const scalarConfig = input.openapiPlan?.api.exposure.scalar;
```

Pass only `openapiPlan` from `HttpApiVirtualModulePlugin.ts`.

- [ ] **Step 4: Verify green and commit**

Run:

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "openapi"
pnpm --filter @typed/app build
pnpm --filter @typed/app test
```

Commit:

```bash
git add packages/app/src/HttpApiVirtualModulePlugin.test.ts packages/app/src/HttpApiVirtualModulePlugin.ts packages/app/src/internal/httpapiOpenApiPlan.ts packages/app/src/internal/emitHttpApiSource.ts
git commit -m "fix(app): route httpapi openapi exposure through plan" -m "- compose root generation with JSON Swagger and Scalar exposure"
```

## Task 3: Group OpenAPI Annotations

**Files:**
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
- Modify: `packages/app/src/internal/httpapiOpenApiPlan.ts`
- Modify: `packages/app/src/internal/emitHttpApiSource.ts`

- [ ] **Step 1: Write failing group annotation test**

Add:

```ts
it("_group.ts openapi.annotations annotates generated HttpApiGroup", () => {
  const fixture = createApiFixture({
    "src/apis/users/_group.ts": `
export const openapi = {
  annotations: {
    title: "Users" as const,
    description: "User management" as const,
  },
};
`,
    "src/apis/users/list.ts": VALID_ENDPOINT_SOURCE,
  });
  const result = buildApiFromExistingFixture(fixture);
  expect(result).not.toHaveProperty("errors");
  const sourceText = getSourceText(result);
  expect(sourceText).toContain('HttpApiGroup.make("users")');
  expect(sourceText).toContain('title: "Users"');
  expect(sourceText).toContain('description: "User management"');
  expect(sourceText).toContain(".annotateMerge(OpenApiModule.annotations");
  expectHttpApiGeneratedSourceToTypeCheck(
    fixture,
    sourceText!,
    "src/api-openapi-group-annotations.generated.ts",
  );
});
```

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "_group.ts openapi.annotations"
```

Expected: fails because group annotations are not planned or emitted.

- [ ] **Step 3: Plan group annotations**

In `httpapiOpenApiPlan.ts`, walk descriptor tree group nodes. For each `group_override` convention, extract `openapi.annotations`, normalize with `scope: "group"`, and store by group directory path.

Generated shape:

```ts
groupAnnotationsByPath.set(groupDirPath, normalized.config.annotations);
```

Diagnostics from generation/exposure in `_group.ts` are accumulated.

- [ ] **Step 4: Emit group annotations**

In `emitHttpApiSource.ts`, when building each group expression:

```ts
const groupAnnotations = input.openapiPlan?.groupAnnotationsByPath.get(groupSpec.dirPath);
const annotatedGroup = renderAnnotatedGroupExpression(
  `HttpApiGroup.make(${JSON.stringify(groupName)})${groupChain}${suffix}`,
  groupAnnotations,
);
groupExprs.push(annotatedGroup);
```

Add:

```ts
function renderAnnotatedGroupExpression(
  groupExpression: string,
  annotations: OpenApiAnnotationsConfig | undefined,
): string {
  if (!annotations || Object.keys(annotations).length === 0) return groupExpression;
  return `${groupExpression}.annotateMerge(OpenApiModule.annotations(${renderObjectLiteral(annotations)}))`;
}
```

- [ ] **Step 5: Verify green and commit**

Run:

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "_group.ts openapi.annotations"
pnpm --filter @typed/app build
pnpm --filter @typed/app test
```

Commit:

```bash
git add packages/app/src/HttpApiVirtualModulePlugin.test.ts packages/app/src/internal/httpapiOpenApiPlan.ts packages/app/src/internal/emitHttpApiSource.ts
git commit -m "fix(app): emit httpapi group openapi annotations" -m "- plan _group.ts annotation scope" -m "- annotate generated HttpApiGroup expressions"
```

## Task 4: Endpoint OpenAPI Annotations and Precedence

**Files:**
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
- Modify: `packages/app/src/internal/extractHttpApiOpenApi.ts`
- Modify: `packages/app/src/internal/httpapiOpenApiPlan.ts`
- Modify: `packages/app/src/internal/emitHttpApiSource.ts`

- [ ] **Step 1: Write failing endpoint direct annotation test**

Add:

```ts
it("endpoint openapi.annotations annotates generated HttpApiEndpoint", () => {
  const endpoint = `
${VALID_ENDPOINT_SOURCE}
export const openapi = {
  annotations: {
    summary: "Status summary" as const,
    description: "Status description" as const,
  },
};
`;
  const fixture = createApiFixture({ "src/apis/status.ts": endpoint });
  const result = buildApiFromExistingFixture(fixture);
  expect(result).not.toHaveProperty("errors");
  const sourceText = getSourceText(result);
  expect(sourceText).toContain('summary: "Status summary"');
  expect(sourceText).toContain('description: "Status description"');
  expect(sourceText).toContain("HttpApiEndpoint.get");
  expect(sourceText).toContain(".annotateMerge(OpenApiModule.annotations");
  expectHttpApiGeneratedSourceToTypeCheck(
    fixture,
    sourceText!,
    "src/api-openapi-endpoint-direct.generated.ts",
  );
});
```

- [ ] **Step 2: Write failing inherited/companion precedence test**

Add:

```ts
it("endpoint OpenAPI annotations use in-file over companion over nearest inherited defaults", () => {
  const fixture = createApiFixture({
    "src/apis/_openapi.ts": `
export default {
  annotations: {
    summary: "Root default" as const,
    description: "Root default description" as const,
  },
};
`,
    "src/apis/users/_openapi.ts": `
export default {
  annotations: {
    summary: "Users default" as const,
    deprecated: true as const,
  },
};
`,
    "src/apis/users/list.openapi.ts": `
export default {
  annotations: {
    summary: "Companion summary" as const,
  },
};
`,
    "src/apis/users/list.ts": `
${VALID_ENDPOINT_SOURCE}
export const openapi = {
  annotations: {
    description: "In-file description" as const,
  },
};
`,
  });
  const result = buildApiFromExistingFixture(fixture);
  expect(result).not.toHaveProperty("errors");
  const sourceText = getSourceText(result);
  expect(sourceText).toContain('summary: "Companion summary"');
  expect(sourceText).toContain('description: "In-file description"');
  expect(sourceText).toContain("deprecated: true");
  expect(sourceText).not.toContain("Root default description");
  expectHttpApiGeneratedSourceToTypeCheck(
    fixture,
    sourceText!,
    "src/api-openapi-endpoint-precedence.generated.ts",
  );
});
```

- [ ] **Step 3: Verify red**

Run:

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "endpoint OpenAPI"
```

Expected: fails because endpoint annotation plan/emission does not exist.

- [ ] **Step 4: Support default-exported OpenAPI config**

In `extractHttpApiOpenApi.ts`, add:

```ts
export function extractDefaultOpenApiConfig(
  snapshot: TypeInfoFileSnapshot,
): ExtractedOpenApiConfig | null {
  return extractOpenApiConfigFromExport(snapshot, "default");
}
```

Refactor `extractOpenApiConfig` to call:

```ts
return extractOpenApiConfigFromExport(snapshot, "openapi");
```

- [ ] **Step 5: Plan endpoint annotations**

In `httpapiOpenApiPlan.ts`, for each endpoint:

- collect ancestor `_openapi.ts` default exports root to leaf;
- merge their annotations in order;
- merge sibling `<endpoint>.openapi.ts` default export;
- merge in-file endpoint `openapi.annotations`;
- normalize each with `scope: "endpoint"`;
- store final annotations by endpoint path.

Use deterministic object merging:

```ts
const mergeAnnotations = (...configs: readonly OpenApiAnnotationsConfig[]): OpenApiAnnotationsConfig =>
  Object.assign({}, ...configs);
```

- [ ] **Step 6: Emit endpoint annotations**

In the endpoint expression construction:

```ts
const baseEndpoint = `HttpApiEndpoint.${factory}(${JSON.stringify(name)}, ${m}.route.path, { ${opts} })`;
const endpointAnnotations = input.openapiPlan?.endpointAnnotationsByPath.get(ep.path);
endpointExprs.push(renderAnnotatedEndpointExpression(baseEndpoint, endpointAnnotations));
```

Add:

```ts
function renderAnnotatedEndpointExpression(
  endpointExpression: string,
  annotations: OpenApiAnnotationsConfig | undefined,
): string {
  if (!annotations || Object.keys(annotations).length === 0) return endpointExpression;
  return `${endpointExpression}.annotateMerge(OpenApiModule.annotations(${renderObjectLiteral(annotations)}))`;
}
```

- [ ] **Step 7: Verify green and commit**

Run:

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "endpoint OpenAPI"
pnpm --filter @typed/app build
pnpm --filter @typed/app test
```

Commit:

```bash
git add packages/app/src/HttpApiVirtualModulePlugin.test.ts packages/app/src/internal/extractHttpApiOpenApi.ts packages/app/src/internal/httpapiOpenApiPlan.ts packages/app/src/internal/emitHttpApiSource.ts
git commit -m "fix(app): emit httpapi endpoint openapi annotations" -m "- support endpoint in-file companion and inherited annotation precedence" -m "- typecheck generated endpoint annotation source"
```

## Task 5: Scope Diagnostics

**Files:**
- Modify: `packages/app/src/HttpApiVirtualModulePlugin.test.ts`
- Modify: `packages/app/src/internal/httpapiOpenApiPlan.ts`
- Modify: `packages/app/src/internal/httpapiOpenApiConfig.ts`

- [ ] **Step 1: Write failing diagnostics tests**

Add:

```ts
it("returns AVM-OPENAPI-001 when generation appears outside _api.ts", () => {
  const result = buildApiFromFixture({
    "src/apis/users/_group.ts": `
export const openapi = {
  generation: { additionalProperties: false as const },
};
`,
    "src/apis/users/list.ts": VALID_ENDPOINT_SOURCE,
  });
  expect(result).toHaveProperty("errors");
  const err = result as VirtualModuleBuildError;
  expect(err.errors.some((e) => e.code === "AVM-OPENAPI-001")).toBe(true);
});

it("returns AVM-OPENAPI-002 when exposure appears outside _api.ts", () => {
  const result = buildApiFromFixture({
    "src/apis/users/list.ts": `
${VALID_ENDPOINT_SOURCE}
export const openapi = {
  exposure: { jsonPath: "/bad.json" as const },
};
`,
  });
  expect(result).toHaveProperty("errors");
  const err = result as VirtualModuleBuildError;
  expect(err.errors.some((e) => e.code === "AVM-OPENAPI-002")).toBe(true);
});

it("returns AVM-OPENAPI-005 for object-shaped additionalProperties", () => {
  const result = buildApiFromFixture({
    "src/apis/_api.ts": `
export const openapi = {
  generation: { additionalProperties: { type: "string" as const } },
};
`,
    "src/apis/status.ts": VALID_ENDPOINT_SOURCE,
  });
  expect(result).toHaveProperty("errors");
  const err = result as VirtualModuleBuildError;
  expect(err.errors.some((e) => e.code === "AVM-OPENAPI-005")).toBe(true);
});
```

- [ ] **Step 2: Verify red**

Run:

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "AVM-OPENAPI"
```

Expected: fails because some diagnostics are swallowed or not collected for group/endpoint scopes.

- [ ] **Step 3: Collect diagnostics from all OpenAPI scopes**

Update plan construction so every extracted group/endpoint/inherited config calls `normalizeOpenApiConfig` with the correct scope and appends diagnostics, even when annotations are still usable.

- [ ] **Step 4: Return diagnostics from plugin build**

In `HttpApiVirtualModulePlugin.ts`, include `...openapiPlan.diagnostics` in `allViolations` before emission.

- [ ] **Step 5: Verify green and commit**

Run:

```bash
pnpm --filter @typed/app test -- src/HttpApiVirtualModulePlugin.test.ts -t "AVM-OPENAPI"
pnpm --filter @typed/app build
pnpm --filter @typed/app test
```

Commit:

```bash
git add packages/app/src/HttpApiVirtualModulePlugin.test.ts packages/app/src/internal/httpapiOpenApiPlan.ts packages/app/src/internal/httpapiOpenApiConfig.ts packages/app/src/HttpApiVirtualModulePlugin.ts
git commit -m "fix(app): diagnose invalid httpapi openapi scopes" -m "- reject generation and exposure outside _api.ts" -m "- reject object-shaped additionalProperties"
```

## Task 6: Durable Spec Sync and Final Verification

**Files:**
- Modify: `.docs/specs/httpapi-virtual-module-plugin/spec.md`
- Modify: `.docs/specs/httpapi-virtual-module-plugin/requirements.md`
- Modify: `.docs/specs/httpapi-virtual-module-plugin/testing-strategy.md`
- Create: `.docs/workflows/20260516-1453-httpapi-openapi-scope-expansion/99-finalization.md`

- [ ] **Step 1: Update durable specs**

Update docs to state:

- `_api.ts` supports root `openapi.generation.additionalProperties`, `openapi.exposure`, and `openapi.annotations`.
- `_group.ts` supports `openapi.annotations` only.
- endpoint primary modules support `openapi.annotations`.
- `<endpoint>.openapi.ts` and `_openapi.ts` support endpoint annotation defaults.
- `additionalProperties` is binary only.
- generated-source type-check fixtures are the blocking proof.

- [ ] **Step 2: Run final verification**

Run:

```bash
pnpm --filter @typed/app build
pnpm --filter @typed/app test
pnpm build
pnpm test
```

Expected: all pass.

- [ ] **Step 3: Write finalization artifact**

Create `99-finalization.md` with:

- commits made;
- commands run;
- test counts;
- known deferrals.

- [ ] **Step 4: Commit**

```bash
git add .docs/specs/httpapi-virtual-module-plugin .docs/workflows/20260516-1453-httpapi-openapi-scope-expansion
git commit -m "docs(app): finalize httpapi openapi scope expansion" -m "- document scoped root group and endpoint OpenAPI support"
```

## Self-Review

- Spec coverage: covers root generation/exposure/annotations, group annotations, endpoint annotations, invalid scope diagnostics, and durable docs.
- Placeholder scan: no placeholder tasks; every task includes concrete files, tests, commands, and commit messages.
- Type consistency: plan consistently uses `HttpApiOpenApiPlan`, `OpenApiGenerationConfig`, `additionalProperties: boolean`, and installed Effect-compatible annotation emission.
