import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import ts from "typescript";
import { createTypeInfoApiSession } from "@typed/virtual-modules";
import {
  createComponentVirtualModulePlugin,
  parseComponentVirtualModuleId,
} from "./ComponentVirtualModulePlugin.js";
import {
  COMPONENT_TYPE_TARGET_SPECS,
  HTTPAPI_TYPE_TARGET_SPECS,
  ROUTER_TYPE_TARGET_SPECS,
} from "./internal/typeTargetSpecs.js";

const tempDirs: string[] = [];
const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BOOTSTRAP_FILE = resolve(APP_ROOT, "src", "internal", "typeTargetBootstrap.ts");

function fixture(files: Record<string, string>) {
  const base = join(process.cwd(), "tmp-component-vm");
  mkdirSync(base, { recursive: true });
  const root = mkdtempSync(join(base, "run-"));
  symlinkSync(join(process.cwd(), "packages", "app", "node_modules"), join(root, "node_modules"), "dir");
  tempDirs.push(root);
  const paths: string[] = [];
  for (const [path, source] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, source, "utf8");
    paths.push(full);
  }
  const importer = join(root, "src", "entry.ts");
  if (!files["src/entry.ts"]) {
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(importer, "export {};", "utf8");
    paths.push(importer);
  }
  return { root, importer, paths };
}

function apiFor(f: ReturnType<typeof fixture>) {
  const program = ts.createProgram({
    rootNames: [...f.paths, BOOTSTRAP_FILE],
    options: {
      allowJs: true,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      target: ts.ScriptTarget.ESNext,
    },
  });
  return createTypeInfoApiSession({
    ts,
    program,
    typeTargetSpecs: [
      ...ROUTER_TYPE_TARGET_SPECS,
      ...HTTPAPI_TYPE_TARGET_SPECS,
      ...COMPONENT_TYPE_TARGET_SPECS,
    ],
    failWhenNoTargetsResolved: false,
  }).api;
}

afterEach(() => {
  while (tempDirs.length > 0) rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe("parseComponentVirtualModuleId", () => {
  it("defaults to the default export when only path is provided", () => {
    expect(parseComponentVirtualModuleId("typed:component?path=./UserCard.ts")).toEqual({
      ok: true,
      exportName: "default",
      path: "./UserCard.ts",
    });
  });

  it("accepts named exports and rejects URL-shaped paths", () => {
    expect(parseComponentVirtualModuleId("typed:component?path=./UserCard.ts&export=UserCard"))
      .toEqual({
        ok: true,
        exportName: "UserCard",
        path: "./UserCard.ts",
      });
    expect(parseComponentVirtualModuleId("typed:component?path=https://example.com/UserCard.ts"))
      .toEqual({
        ok: false,
        code: "CVM-COMPONENT-PATH-002",
        reason: "typed:component path must be a relative path",
      });
  });
});

describe("createComponentVirtualModulePlugin", () => {
  it("generates a default-export component with coalesced schema fields and Schema conveniences", () => {
    const f = fixture({
      "src/domain.ts": `
import * as Schema from "effect/Schema";

export const MyType = Schema.Struct({ name: Schema.String });
export type MyType = typeof MyType.Type;
`,
      "src/UserCard.ts": `
import { html } from "@typed/template";
import type { MyType } from "./domain.js";

export type MyInput = {
  readonly my: MyType;
  readonly other: number;
};

export default (input: MyInput) => html\`<article>\${input.my.name}: \${input.other}</article>\`;
`,
      "src/entry.ts": 'import "typed:component?path=./UserCard.ts";',
    });
    const source = createComponentVirtualModulePlugin().build(
      "typed:component?path=./UserCard.ts",
      f.importer,
      apiFor(f),
    );
    expect(typeof source, JSON.stringify(source)).toBe("string");
    if (typeof source !== "string") return;

    expect(source).toContain('import * as ComponentModule from "./UserCard.js";');
    expect(source).toContain('import { MyType as MyTypeSchema } from "./domain.js";');
    expect(source).toContain("export type Input = Parameters<typeof entrypoint>[0];");
    expect(source).toContain("export const InputSchema = Schema.Struct({");
    expect(source).toContain('"my": MyTypeSchema');
    expect(source).toContain('"other": Schema.Number');
    expect(source).toContain("export const InputArbitrary = Schema.toArbitrary(InputSchema);");
    expect(source).toContain("export const InputFormatter = Schema.toFormatter(InputSchema);");
    expect(source).toContain("export const InputJsonSchema = Schema.toJsonSchemaDocument(InputSchema);");
    expect(source).toContain('"other": { control: { type: "number" } }');
    expect(source).toContain("export const argTypes = {");
    expect(source).toContain("export type ComponentResult = ReturnType<typeof Component>;");
    expect(source).toContain("export type ComponentError = ComponentErrorOf<ComponentResult>;");
    expect(source).toContain("export type ComponentServices = ComponentServicesOf<ComponentResult>;");
    expect(source).toContain("export function makeComponentProperty");
    expect(source).toContain("readonly layers?: Layers");
    expect(source).toContain("readonly testLayers?: TestLayers");
    expect(source).toContain("parameters: makeComponentParameters(options)");
    expect(source).not.toContain(" as Schema.Decoder");
    expect(source).not.toContain(" as Record");
    expect(source).not.toContain(" as Input");
    expect(source).not.toContain("Schema.Unknown");
    expect(source).not.toContain("??");
  });

  it("generates select controls for literal unions", () => {
    const f = fixture({
      "src/UserCard.ts": `
import { html } from "@typed/template";

export type MyInput = {
  readonly label: string;
  readonly role: "admin" | "editor";
  readonly active?: boolean;
};

export default (input: MyInput) => html\`<article>\${input.label}: \${input.role}: \${input.active}</article>\`;
`,
      "src/entry.ts": 'import "typed:component?path=./UserCard.ts";',
    });
    const source = createComponentVirtualModulePlugin().build(
      "typed:component?path=./UserCard.ts",
      f.importer,
      apiFor(f),
    );
    expect(typeof source, JSON.stringify(source)).toBe("string");
    if (typeof source !== "string") return;

    expect(source).toContain('"label": { control: { type: "text" } }');
    expect(source).toContain('"role": { control: { type: "select" }, options: ["admin", "editor"] }');
    expect(source).toContain('"active": { control: { type: "boolean" } }');
    expect(source).toContain('"role": Schema.Union([Schema.Literal("admin"), Schema.Literal("editor")])');
    expect(source).not.toContain("Schema.Unknown");
  });

  it("fails closed when an input field cannot be converted to Schema", () => {
    const f = fixture({
      "src/UserCard.ts": `
import { html } from "@typed/template";

export type MyInput = {
  readonly value: Promise<string>;
};

export default (input: MyInput) => html\`<article>\${input.value}</article>\`;
`,
      "src/entry.ts": 'import "typed:component?path=./UserCard.ts";',
    });
    const source = createComponentVirtualModulePlugin().build(
      "typed:component?path=./UserCard.ts",
      f.importer,
      apiFor(f),
    );

    expect(source).toEqual({
      errors: [
        {
          code: "CVM-COMPONENT-SCHEMA-001",
          message: 'Could not generate an input schema for "value" from type Promise<string>',
          pluginName: "typed-component-virtual-module",
        },
      ],
    });
  });

  it("renders non-callable renderable exports without calling them", () => {
    const f = fixture({
      "src/UserCard.ts": `
import { html } from "@typed/template";

export default html\`<article>Static</article>\`;
`,
      "src/entry.ts": 'import "typed:component?path=./UserCard.ts";',
    });
    const source = createComponentVirtualModulePlugin().build(
      "typed:component?path=./UserCard.ts",
      f.importer,
      apiFor(f),
    );
    expect(typeof source, JSON.stringify(source)).toBe("string");
    if (typeof source !== "string") return;

    expect(source).toContain("export type Input = {};");
    expect(source).toContain("export const Component = (_input: Input) => ComponentModule.default;");
  });

  it("uses an existing full input schema when the inferred input type comes from that schema", () => {
    const f = fixture({
      "src/UserCard.ts": `
import * as Schema from "effect/Schema";
import { html } from "@typed/template";

export const InputSchema = Schema.Struct({ label: Schema.String });
export type Input = typeof InputSchema.Type;

export const UserCard = (input: Input) => html\`<article>\${input.label}</article>\`;
`,
      "src/entry.ts": 'import "typed:component?path=./UserCard.ts&export=UserCard";',
    });
    const source = createComponentVirtualModulePlugin().build(
      "typed:component?path=./UserCard.ts&export=UserCard",
      f.importer,
      apiFor(f),
    );
    expect(typeof source, JSON.stringify(source)).toBe("string");
    if (typeof source !== "string") return;

    expect(source).toContain('import { InputSchema as InputSchemaSchema } from "./UserCard.js";');
    expect(source).toContain("export const InputSchema = InputSchemaSchema;");
    expect(source).toContain("export const Component = (input: Input) => ComponentModule.UserCard(input);");
  });

  it("infers input schemas from default Fx.fn components", () => {
    const f = fixture({
      "src/domain.ts": `
import * as Schema from "effect/Schema";

export const UserProfile = Schema.Struct({ name: Schema.String });
export type UserProfile = typeof UserProfile.Type;
`,
      "src/UserCard.ts": `
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import type { UserProfile } from "./domain.js";

export type UserCardInput = {
  readonly user: UserProfile;
  readonly visits: number;
};

export default Fx.fn(function* UserCard(input: UserCardInput) {
  return html\`<article>\${input.user.name}: \${input.visits}</article>\`;
});
`,
      "src/entry.ts": 'import "typed:component?path=./UserCard.ts";',
    });
    const source = createComponentVirtualModulePlugin().build(
      "typed:component?path=./UserCard.ts",
      f.importer,
      apiFor(f),
    );
    expect(typeof source, JSON.stringify(source)).toBe("string");
    if (typeof source !== "string") return;

    expect(source).toContain('import { UserProfile as UserProfileSchema } from "./domain.js";');
    expect(source).toContain('"user": UserProfileSchema');
    expect(source).toContain('"visits": Schema.Number');
    expect(source).not.toContain("??");
  });
});
