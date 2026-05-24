export type ResumabilityCoverageStatus = "resumable" | "fail-closed" | "static-safe";

export interface ResumabilityCoverageRow {
  readonly area: string;
  readonly pattern: string;
  readonly classify: ResumabilityCoverageStatus;
  readonly transform: ResumabilityCoverageStatus;
  readonly typecheck: ResumabilityCoverageStatus;
  readonly serialize: ResumabilityCoverageStatus;
  readonly resume: ResumabilityCoverageStatus;
  readonly hmrCompatible: ResumabilityCoverageStatus;
  readonly hmrIncompatible: ResumabilityCoverageStatus;
  readonly diagnosticsParity: ResumabilityCoverageStatus;
}

export const resumabilityCoverageRows: readonly ResumabilityCoverageRow[] = [
  routeRow("parameter context services", "resumable"),
  routeRow("Context.Service captures", "resumable"),
  routeRow("RefSubject.Service captures", "resumable"),
  routeRow("inline RefSubject.make migration", "resumable"),
  routeRow("serializable const values", "resumable"),
  routeRow("template value captures", "resumable"),
  routeRow("outer let/var captures", "fail-closed"),
  routeRow("any/unknown captures", "fail-closed"),
  routeRow("dynamic service ids", "fail-closed"),
  routeRow("anonymous class instances", "fail-closed"),
  templateRow("data-typed-resume load", "resumable"),
  templateRow("data-typed-resume idle", "resumable"),
  templateRow("data-typed-resume visible", "resumable"),
  templateRow("data-typed-resume hover", "resumable"),
  templateRow("data-typed-resume interaction", "resumable"),
  templateRow("data-typed-resume focus", "resumable"),
  eventRow("EventHandler.action", "resumable"),
  eventRow("EventHandler.make", "fail-closed"),
  eventRow("raw function handlers", "fail-closed"),
  uiRow("Disclosure", "resumable"),
  uiRow("Checkbox", "resumable"),
  uiRow("Popover", "resumable"),
  uiRow("Dialog", "resumable"),
  uiRow("Select", "resumable"),
  uiRow("custom host renderers", "fail-closed"),
  uiRow("function refs", "fail-closed"),
  uiRow("WeakMap-only state", "fail-closed"),
];

export function renderResumabilityCoverageMatrix(
  rows: readonly ResumabilityCoverageRow[] = resumabilityCoverageRows,
): string {
  return [
    "| Area | Pattern | Classify | Transform | Typecheck | Serialize | Resume | HMR Compatible | HMR Incompatible | Diagnostics Parity |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(renderRow),
  ].join("\n");
}

export function unknownCoverageCells(
  rows: readonly ResumabilityCoverageRow[] = resumabilityCoverageRows,
): readonly string[] {
  return rows.flatMap((row) =>
    Object.entries(row).flatMap(([key, value]) =>
      value === "unknown" ? [`${row.area}:${row.pattern}:${key}`] : [],
    ),
  );
}

function routeRow(
  pattern: string,
  status: ResumabilityCoverageStatus,
): ResumabilityCoverageRow {
  return row("route", pattern, status);
}

function templateRow(
  pattern: string,
  status: ResumabilityCoverageStatus,
): ResumabilityCoverageRow {
  return row("template", pattern, status);
}

function eventRow(
  pattern: string,
  status: ResumabilityCoverageStatus,
): ResumabilityCoverageRow {
  return row("event", pattern, status);
}

function uiRow(pattern: string, status: ResumabilityCoverageStatus): ResumabilityCoverageRow {
  return row("ui", pattern, status);
}

function row(
  area: string,
  pattern: string,
  status: ResumabilityCoverageStatus,
): ResumabilityCoverageRow {
  return {
    area,
    classify: status,
    diagnosticsParity: status,
    hmrCompatible: status,
    hmrIncompatible: status,
    pattern,
    resume: status,
    serialize: status,
    transform: status,
    typecheck: status,
  };
}

function renderRow(row: ResumabilityCoverageRow): string {
  return `| ${row.area} | ${row.pattern} | ${row.classify} | ${row.transform} | ${row.typecheck} | ${row.serialize} | ${row.resume} | ${row.hmrCompatible} | ${row.hmrIncompatible} | ${row.diagnosticsParity} |`;
}
