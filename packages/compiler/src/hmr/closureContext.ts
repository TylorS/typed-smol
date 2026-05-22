export interface ClosureContextInput {
  readonly moduleId: string;
  readonly closureName: string;
  readonly captures: readonly ClosureCapture[];
  readonly typeParameters?: ClosureTypeParameters;
}

export interface ClosureCapture {
  readonly name: string;
  readonly type: string;
  readonly mutable?: boolean;
}

export interface ClosureTypeParameters {
  readonly error: string;
  readonly services: string;
}

export interface ClosureContextPlan {
  readonly closureName: string;
  readonly contextName: string;
  readonly eligible: boolean;
  readonly fields: readonly ClosureContextField[];
  readonly diagnostics: readonly ClosureContextDiagnostic[];
  readonly typeParameters: ClosureTypeParameters;
}

export interface ClosureContextField {
  readonly name: string;
  readonly type: string;
}

export interface ClosureContextDiagnostic {
  readonly code: "unsupported-closure-capture";
  readonly moduleId: string;
  readonly message: string;
}

const defaultTypeParameters: ClosureTypeParameters = {
  error: "never",
  services: "never",
};

export function planClosureContext(input: ClosureContextInput): ClosureContextPlan {
  const diagnostics = unsupportedCaptureDiagnostics(input);
  return {
    closureName: input.closureName,
    contextName: contextName(input.closureName),
    eligible: diagnostics.length === 0,
    fields: diagnostics.length === 0 ? input.captures.map(toField) : [],
    diagnostics,
    typeParameters: input.typeParameters ?? defaultTypeParameters,
  };
}

function unsupportedCaptureDiagnostics(
  input: ClosureContextInput,
): readonly ClosureContextDiagnostic[] {
  return input.captures.flatMap((capture) => {
    if (!capture.mutable) return [];
    return [
      {
        code: "unsupported-closure-capture",
        moduleId: input.moduleId,
        message: `Cannot rewrite closure ${input.closureName} in ${input.moduleId}: ${capture.name} is mutable`,
      },
    ];
  });
}

function toField(capture: ClosureCapture): ClosureContextField {
  return { name: capture.name, type: capture.type };
}

function contextName(closureName: string): string {
  return `__typed_${closureName}_context`;
}
