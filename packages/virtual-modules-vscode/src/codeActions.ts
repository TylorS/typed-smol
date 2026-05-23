import type * as vscode from "vscode";

export interface EncodedDiagnosticFix {
  readonly title: string;
  readonly edits?: readonly EncodedDiagnosticTextEdit[];
}

export interface EncodedDiagnosticTextEdit {
  readonly fileName: string;
  readonly span: {
    readonly start: number;
    readonly end: number;
  };
  readonly text: string;
}

interface DiagnosticLike {
  readonly code?: unknown;
}

export function getTypedCompilerFix(diagnostic: DiagnosticLike): EncodedDiagnosticFix | undefined {
  const code = diagnostic.code;
  if (!isRecord(code) || !isRecord(code.fix)) return undefined;
  const fix = code.fix;
  if (typeof fix.title !== "string" || fix.title.length === 0) return undefined;
  const edits = Array.isArray(fix.edits) ? fix.edits.filter(isEncodedEdit) : undefined;
  return {
    ...(edits ? { edits } : {}),
    title: fix.title,
  };
}

export function createTypedCompilerCodeActionProvider(
  vscodeApi: Pick<typeof vscode, "CodeAction" | "CodeActionKind" | "Range" | "Uri" | "WorkspaceEdit">,
): vscode.CodeActionProvider {
  return {
    provideCodeActions(document, _range, context) {
      return context.diagnostics.flatMap((diagnostic) =>
        codeActionsForDiagnostic(vscodeApi, document, diagnostic),
      );
    },
  };
}

function codeActionsForDiagnostic(
  vscodeApi: Pick<typeof vscode, "CodeAction" | "CodeActionKind" | "Range" | "Uri" | "WorkspaceEdit">,
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  const fix = getTypedCompilerFix(diagnostic);
  if (!fix) return [];
  const action = new vscodeApi.CodeAction(fix.title, vscodeApi.CodeActionKind.QuickFix);
  action.diagnostics = [diagnostic];
  const workspaceEdit = new vscodeApi.WorkspaceEdit();
  for (const edit of fix.edits ?? []) {
    if (edit.fileName !== document.uri.fsPath) continue;
    workspaceEdit.replace(
      vscodeApi.Uri.file(edit.fileName),
      new vscodeApi.Range(document.positionAt(edit.span.start), document.positionAt(edit.span.end)),
      edit.text,
    );
  }
  action.edit = workspaceEdit;
  return [action];
}

function isEncodedEdit(value: unknown): value is EncodedDiagnosticTextEdit {
  if (!isRecord(value) || typeof value.fileName !== "string" || typeof value.text !== "string") {
    return false;
  }
  if (!isRecord(value.span)) return false;
  return typeof value.span.start === "number" && typeof value.span.end === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
