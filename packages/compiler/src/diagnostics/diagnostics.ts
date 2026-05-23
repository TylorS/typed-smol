import type * as ts from "typescript";
import type { VirtualModuleDiagnostic } from "@typed/virtual-modules";

export const TYPED_COMPILER_DIAGNOSTIC_CODE = 900001;

export type TypedCompilerDiagnosticSeverity = "error" | "warning" | "suggestion" | "message";

export type TypedCompilerDiagnosticSource =
  | "compiler"
  | "app"
  | "vmc"
  | "vite"
  | "ts-plugin"
  | "vscode";

export interface SourceSpan {
  readonly start: number;
  readonly end: number;
}

export interface DiagnosticRelatedInfo {
  readonly message: string;
  readonly fileName?: string;
  readonly span?: SourceSpan;
}

export interface DiagnosticFix {
  readonly title: string;
  readonly edits?: readonly DiagnosticTextEdit[];
}

export interface DiagnosticTextEdit {
  readonly fileName: string;
  readonly span: SourceSpan;
  readonly text: string;
}

export interface TypedCompilerDiagnostic {
  readonly code: string;
  readonly severity: TypedCompilerDiagnosticSeverity;
  readonly message: string;
  readonly source: TypedCompilerDiagnosticSource;
  readonly fileName?: string;
  readonly span?: SourceSpan;
  readonly related?: readonly DiagnosticRelatedInfo[];
  readonly fix?: DiagnosticFix;
}

export interface TypedViteDiagnostic {
  readonly id?: string;
  readonly message: string;
  readonly plugin: string;
  readonly severity: TypedCompilerDiagnosticSeverity;
  readonly loc?: {
    readonly file?: string;
    readonly start: number;
    readonly end: number;
  };
}

export type TypedCompilerDiagnosticInput = TypedCompilerDiagnostic;

export function createCompilerDiagnostic(
  input: TypedCompilerDiagnosticInput,
): TypedCompilerDiagnostic {
  return stripUndefined({
    code: input.code,
    fileName: input.fileName,
    fix: input.fix,
    message: input.message,
    related: input.related,
    severity: input.severity,
    source: input.source,
    span: input.span,
  });
}

export function sortDiagnostics(
  diagnostics: readonly TypedCompilerDiagnostic[],
): readonly TypedCompilerDiagnostic[] {
  return [...diagnostics].sort(compareDiagnostics);
}

export function diagnosticFingerprint(diagnostic: TypedCompilerDiagnostic): string {
  return stableStringify(diagnostic);
}

export function toTsDiagnostic(
  tsMod: typeof import("typescript"),
  diagnostic: TypedCompilerDiagnostic,
  sourceFile?: ts.SourceFile,
): ts.Diagnostic {
  const span = diagnostic.span;
  return {
    category: toTsCategory(tsMod, diagnostic.severity),
    code: TYPED_COMPILER_DIAGNOSTIC_CODE,
    file: sourceFile,
    length: span ? span.end - span.start : 0,
    messageText: `${diagnostic.code}: ${diagnostic.message}`,
    start: span?.start ?? 0,
  };
}

export function toVirtualModuleDiagnostic(
  diagnostic: TypedCompilerDiagnostic,
  pluginName: string,
): VirtualModuleDiagnostic {
  return {
    code: diagnostic.code,
    message: diagnostic.message,
    pluginName,
  };
}

export function toViteDiagnostic(
  diagnostic: TypedCompilerDiagnostic,
  plugin: string,
): TypedViteDiagnostic {
  return stripUndefined({
    id: diagnostic.fileName,
    loc: diagnostic.span
      ? {
          end: diagnostic.span.end,
          file: diagnostic.fileName,
          start: diagnostic.span.start,
        }
      : undefined,
    message: `${diagnostic.code}: ${diagnostic.message}`,
    plugin,
    severity: diagnostic.severity,
  });
}

function compareDiagnostics(
  left: TypedCompilerDiagnostic,
  right: TypedCompilerDiagnostic,
): number {
  return (
    compareText(left.fileName, right.fileName) ||
    compareNumber(left.span?.start, right.span?.start) ||
    left.code.localeCompare(right.code) ||
    left.message.localeCompare(right.message)
  );
}

function compareText(left: string | undefined, right: string | undefined): number {
  return (left ?? "").localeCompare(right ?? "");
}

function compareNumber(left: number | undefined, right: number | undefined): number {
  return (left ?? -1) - (right ?? -1);
}

function toTsCategory(
  tsMod: typeof import("typescript"),
  severity: TypedCompilerDiagnosticSeverity,
): ts.DiagnosticCategory {
  if (severity === "error") return tsMod.DiagnosticCategory.Error;
  if (severity === "warning") return tsMod.DiagnosticCategory.Warning;
  if (severity === "suggestion") return tsMod.DiagnosticCategory.Suggestion;
  return tsMod.DiagnosticCategory.Message;
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, child]) => child !== undefined)) as T;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  const entries = Object.keys(value)
    .filter((key) => value[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
  return `{${entries.join(",")}}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
