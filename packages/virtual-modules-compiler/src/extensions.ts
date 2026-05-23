import type * as ts from "typescript";
import type { TypeTargetSpec } from "@typed/virtual-modules";

export interface VmcCompilerExtension {
  readonly name: string;
  readonly typeTargetSpecs?: readonly TypeTargetSpec[];
  beforeProgramCreate?(context: VmcProgramContext): void;
  transformSource?(input: VmcSourceTransformInput): VmcSourceTransformResult | undefined;
  diagnostics?(context: VmcProgramContextWithProgram): readonly ts.Diagnostic[];
}

export interface VmcProgramContext {
  readonly ts: typeof import("typescript");
  readonly projectRoot: string;
  readonly rootNames: readonly string[];
  readonly options: ts.CompilerOptions;
  readonly projectReferences?: readonly ts.ProjectReference[];
}

export interface VmcProgramContextWithProgram extends VmcProgramContext {
  readonly program: ts.Program;
}

export interface VmcSourceTransformInput extends VmcProgramContext {
  readonly fileName: string;
  readonly sourceText: string;
  readonly sourceFile: ts.SourceFile;
}

export interface VmcSourceTransformResult {
  readonly sourceText?: string;
  readonly diagnostics?: readonly ts.Diagnostic[];
}

type SourceTransformInput = {
  readonly ts: typeof import("typescript");
  readonly compilerHost: ts.CompilerHost;
  readonly context: VmcProgramContext;
  readonly extensions?: readonly VmcCompilerExtension[];
  readonly reportDiagnostic: ts.DiagnosticReporter;
};

type SourceTransformHostState = {
  readonly originalGetSourceFile: ts.CompilerHost["getSourceFile"];
  input: SourceTransformInput;
};

const sourceTransformHosts = new WeakMap<ts.CompilerHost, SourceTransformHostState>();

export function extensionTypeTargetSpecs(
  base: readonly TypeTargetSpec[] | undefined,
  extensions: readonly VmcCompilerExtension[] | undefined,
): readonly TypeTargetSpec[] | undefined {
  const specs = [
    ...(base ?? []),
    ...(extensions ?? []).flatMap((extension) => extension.typeTargetSpecs ?? []),
  ];
  if (specs.length === 0) return undefined;
  return [...new Map(specs.map((spec) => [spec.id, spec])).values()];
}

export function createProgramContext(input: VmcProgramContext): VmcProgramContext {
  return {
    options: input.options,
    projectReferences: input.projectReferences,
    projectRoot: input.projectRoot,
    rootNames: input.rootNames,
    ts: input.ts,
  };
}

export function runBeforeProgramCreate(
  extensions: readonly VmcCompilerExtension[] | undefined,
  context: VmcProgramContext,
): void {
  for (const extension of extensions ?? []) extension.beforeProgramCreate?.(context);
}

export function collectExtensionDiagnostics(
  extensions: readonly VmcCompilerExtension[] | undefined,
  context: VmcProgramContextWithProgram,
): readonly ts.Diagnostic[] {
  return (extensions ?? []).flatMap((extension) => extension.diagnostics?.(context) ?? []);
}

export function reportExtensionDiagnostics(
  extensions: readonly VmcCompilerExtension[] | undefined,
  context: VmcProgramContextWithProgram,
  reportDiagnostic: ts.DiagnosticReporter,
): boolean {
  const diagnostics = collectExtensionDiagnostics(extensions, context);
  for (const diagnostic of diagnostics) reportDiagnostic(diagnostic);
  return diagnostics.some(
    (diagnostic) => diagnostic.category === context.ts.DiagnosticCategory.Error,
  );
}

export function attachSourceTransformExtensions(input: SourceTransformInput): void {
  if (!input.extensions || input.extensions.length === 0) return;
  const existing = sourceTransformHosts.get(input.compilerHost);
  if (existing) {
    existing.input = input;
    return;
  }

  const originalGetSourceFile = input.compilerHost.getSourceFile.bind(input.compilerHost);
  const state: SourceTransformHostState = {
    input,
    originalGetSourceFile,
  };
  sourceTransformHosts.set(input.compilerHost, state);

  input.compilerHost.getSourceFile = (...args: Parameters<ts.CompilerHost["getSourceFile"]>) => {
    const sourceFile = state.originalGetSourceFile(...args);
    if (!sourceFile || sourceFile.isDeclarationFile) return sourceFile;
    const transformed = transformSourceFile(state.input, sourceFile);
    return transformed ?? sourceFile;
  };
}

function transformSourceFile(
  input: SourceTransformInput,
  sourceFile: ts.SourceFile,
): ts.SourceFile | undefined {
  const sourceText = applyTransforms(input, sourceFile);
  if (sourceText === sourceFile.text) return undefined;
  return input.ts.createSourceFile(
    sourceFile.fileName,
    sourceText,
    sourceFile.languageVersion,
    true,
  );
}

function applyTransforms(
  input: SourceTransformInput,
  sourceFile: ts.SourceFile,
): string {
  let sourceText = sourceFile.text;
  for (const extension of input.extensions ?? []) {
    const result = extension.transformSource?.({
      ...input.context,
      fileName: sourceFile.fileName,
      sourceFile,
      sourceText,
    });
    for (const diagnostic of result?.diagnostics ?? []) input.reportDiagnostic(diagnostic);
    sourceText = result?.sourceText ?? sourceText;
  }
  return sourceText;
}
