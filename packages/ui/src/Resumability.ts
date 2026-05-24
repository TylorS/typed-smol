export interface ResumabilityDiagnostic {
  readonly severity: "error";
  readonly code: ResumabilityDiagnosticCode;
  readonly component: string;
  readonly option: string;
  readonly reason: string;
}

export type ResumabilityDiagnosticCode =
  | "ui-raw-handler-closure"
  | "ui-raw-ref-callback"
  | "ui-function-focus-target"
  | "ui-custom-host"
  | "ui-weakmap-only-state"
  | "ui-opaque-handler"
  | "ui-opaque-ref"
  | "ui-opaque-host"
  | "ui-nonserializable-option";

export function rawHandlerClosure(
  component: string,
  option: string,
): ResumabilityDiagnostic {
  return unsupportedOption(
    "ui-raw-handler-closure",
    component,
    option,
    "raw DOM handler closures cannot cross a resumability boundary; use EventHandler descriptors or component actions instead",
  );
}

export function rawRefCallback(component: string, option: string): ResumabilityDiagnostic {
  return unsupportedOption(
    "ui-raw-ref-callback",
    component,
    option,
    "raw ref callbacks close over runtime state; use declared resumability refs instead",
  );
}

export function functionFocusTarget(
  component: string,
  option: string,
): ResumabilityDiagnostic {
  return unsupportedOption(
    "ui-function-focus-target",
    component,
    option,
    "function focus targets are runtime closures; use a selector string or element id target",
  );
}

export function customHost(component: string, option: string): ResumabilityDiagnostic {
  return unsupportedOption(
    "ui-custom-host",
    component,
    option,
    "custom host renderers are opaque functions and cannot be serialized for resume",
  );
}

export function unsupportedOption(
  code: ResumabilityDiagnosticCode,
  component: string,
  option: string,
  reason: string,
): ResumabilityDiagnostic {
  return { code, component, option, reason, severity: "error" };
}

export function diagnoseOptions(
  component: string,
  options: Readonly<Record<string, unknown>>,
): readonly ResumabilityDiagnostic[] {
  return [
    ...diagnoseHost(component, options),
    ...diagnoseProps(component, options.props),
    ...diagnoseFocusTargets(component, options),
  ];
}

export function formatDiagnostic(diagnostic: ResumabilityDiagnostic): string {
  return `[${diagnostic.code}] ${diagnostic.component} ${diagnostic.option}: ${diagnostic.reason}`;
}

export function formatDiagnostics(
  diagnostics: readonly ResumabilityDiagnostic[],
): string {
  return diagnostics.map(formatDiagnostic).join("\n");
}

function diagnoseHost(
  component: string,
  options: Readonly<Record<string, unknown>>,
): readonly ResumabilityDiagnostic[] {
  return typeof options.host === "function" ? [customHost(component, "host")] : [];
}

function diagnoseProps(
  component: string,
  value: unknown,
): readonly ResumabilityDiagnostic[] {
  if (!isRecord(value)) return [];

  return Object.entries(value).flatMap(([key, option]) => {
    if (key === "ref" && typeof option === "function") {
      return [rawRefCallback(component, "props.ref")];
    }

    if (isEventOption(key) && typeof option === "function") {
      return [rawHandlerClosure(component, `props.${key}`)];
    }

    return [];
  });
}

function diagnoseFocusTargets(
  component: string,
  options: Readonly<Record<string, unknown>>,
): readonly ResumabilityDiagnostic[] {
  return ["initialFocus", "finalFocus"].flatMap((key) =>
    typeof options[key] === "function" ? [functionFocusTarget(component, key)] : [],
  );
}

function isEventOption(value: string): boolean {
  return /^on[a-z]/.test(value);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}
