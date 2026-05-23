import ts from "typescript";
import { describe, expect, it } from "vitest";
import type { VirtualModuleDiagnostic } from "@typed/virtual-modules";
import {
  createCompilerDiagnostic,
  diagnosticFingerprint,
  sortDiagnostics,
  toTsDiagnostic,
  toVirtualModuleDiagnostic,
  toViteDiagnostic,
  type TypedCompilerDiagnostic,
} from "./diagnostics.js";

describe("compiler diagnostics", () => {
  it("creates self-describing diagnostics with optional spans and related info", () => {
    const diagnostic = createCompilerDiagnostic({
      code: "TYPED-TEMPLATE-001",
      fileName: "/src/page.ts",
      message: "Unknown attribute on <button>",
      related: [
        {
          message: "Attribute came from this spread",
          span: { start: 32, end: 39 },
        },
      ],
      severity: "error",
      source: "compiler",
      span: { start: 10, end: 21 },
    });

    expect(diagnostic).toEqual({
      code: "TYPED-TEMPLATE-001",
      fileName: "/src/page.ts",
      message: "Unknown attribute on <button>",
      related: [
        {
          message: "Attribute came from this spread",
          span: { start: 32, end: 39 },
        },
      ],
      severity: "error",
      source: "compiler",
      span: { start: 10, end: 21 },
    });
  });

  it("sorts and fingerprints diagnostics stably", () => {
    const first = diag({ code: "B", fileName: "/b.ts", start: 4 });
    const second = diag({ code: "A", fileName: "/a.ts", start: 8 });
    const third = diag({ code: "A", fileName: "/a.ts", start: 2 });

    expect(sortDiagnostics([first, second, third])).toEqual([third, second, first]);
    expect(diagnosticFingerprint(second)).toBe(
      '{"code":"A","fileName":"/a.ts","message":"message:A","severity":"error","source":"compiler","span":{"end":9,"start":8}}',
    );
  });

  it("converts to TypeScript diagnostics without losing source positions", () => {
    const sourceFile = ts.createSourceFile(
      "/src/page.ts",
      "const view = html`<button bad=${value}></button>`;",
      ts.ScriptTarget.Latest,
      true,
    );
    const diagnostic = createCompilerDiagnostic({
      code: "TYPED-TEMPLATE-001",
      fileName: sourceFile.fileName,
      message: "Unknown attribute",
      severity: "error",
      source: "compiler",
      span: { start: 26, end: 29 },
    });

    expect(toTsDiagnostic(ts, diagnostic, sourceFile)).toMatchObject({
      category: ts.DiagnosticCategory.Error,
      code: 900001,
      file: sourceFile,
      length: 3,
      messageText: "TYPED-TEMPLATE-001: Unknown attribute",
      start: 26,
    });
  });

  it("converts to virtual-module diagnostics for legacy plugin hosts", () => {
    const diagnostic = diag({ code: "TYPED-VM-001", source: "vmc" });

    expect(toVirtualModuleDiagnostic(diagnostic, "typed-template")).toEqual({
      code: "TYPED-VM-001",
      message: "message:TYPED-VM-001",
      pluginName: "typed-template",
    } satisfies VirtualModuleDiagnostic);
  });

  it("converts to Vite diagnostic payloads without importing Vite", () => {
    const diagnostic = diag({
      code: "TYPED-VITE-001",
      fileName: "/src/page.ts",
      source: "vite",
      start: 5,
    });

    expect(toViteDiagnostic(diagnostic, "typed-template")).toEqual({
      id: "/src/page.ts",
      message: "TYPED-VITE-001: message:TYPED-VITE-001",
      plugin: "typed-template",
      severity: "error",
      loc: {
        file: "/src/page.ts",
        start: 5,
        end: 6,
      },
    });
  });
});

function diag(input: {
  readonly code: string;
  readonly fileName?: string;
  readonly source?: TypedCompilerDiagnostic["source"];
  readonly start?: number;
}): TypedCompilerDiagnostic {
  return createCompilerDiagnostic({
    code: input.code,
    fileName: input.fileName,
    message: `message:${input.code}`,
    severity: "error",
    source: input.source ?? "compiler",
    span:
      input.start === undefined
        ? undefined
        : {
            start: input.start,
            end: input.start + 1,
          },
  });
}
