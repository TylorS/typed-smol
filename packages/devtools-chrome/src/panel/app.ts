import {
  DevtoolsProtocolFixtures,
  makeDevtoolsClientId,
  type ComponentId,
  type DevtoolsHandshakeRequest,
  type DevtoolsHandshakeResponse,
  type DomBindingId,
  type DomBindingRequest,
  type DomBindingResolution,
  type RuntimeEventStreamItem,
  type RuntimeEventSubscriptionRequest,
  type RuntimeEventEnvelope,
  type SourceAnalyzerRequest,
  type SourceAnalyzerResponse,
} from "@typed/devtools-protocol";
import {
  makeChromeRuntimeRpcClient,
  type ChromeRuntimeConnectable,
} from "../transport/chromeRuntime.js";
import {
  inspectDomBinding as inspectInspectedWindowDomBinding,
  makeInspectedWindowRpcClient,
  type ChromeInspectedWindow,
} from "../transport/inspectedWindow.js";
import { applyRuntimeStreamItem, createTypedDevtoolsPanelState } from "./state.js";
import { componentRows, templateRows, type ComponentPanelRow } from "./views/components.js";
import { fxRows } from "./views/fx.js";
import { refSubjectRows } from "./views/refsubjects.js";

export interface TypedDevtoolsPanelOptions {
  readonly actions?: TypedDevtoolsPanelActions;
  readonly inspectedWindow?: ChromeInspectedWindow;
  readonly runtime?: ChromeRuntimeConnectable;
}

export interface TypedDevtoolsPanelActions {
  readonly inspectDomBinding?: (bindingId: DomBindingId) => void | Promise<void>;
  readonly openSource?: (target: SourceTarget) => void | Promise<void>;
}

export interface SourceTarget {
  readonly column?: number;
  readonly line: number;
  readonly resource: string;
}

type PanelTab =
  | "Components"
  | "Templates"
  | "Fx"
  | "RefSubjects"
  | "HMR"
  | "Navigation"
  | "OTEL"
  | "Sources";

const tabs: readonly PanelTab[] = [
  "Components",
  "Templates",
  "Fx",
  "RefSubjects",
  "HMR",
  "Navigation",
  "OTEL",
  "Sources",
];

export async function renderTypedDevtoolsPanel(
  root: Element,
  options: TypedDevtoolsPanelOptions = {},
): Promise<void> {
  const runtimeModel = await loadRuntimeModel(
    options.runtime ?? globalChromeRuntime(),
    options.inspectedWindow ?? globalChromeInspectedWindow(),
  );
  const events = runtimeModel.items.filter(isRuntimeEventStreamEnvelope);
  const state = runtimeModel.items.reduce(applyRuntimeStreamItem, createTypedDevtoolsPanelState());
  const actions = options.actions ?? chromePanelActions();
  let activeTab: PanelTab = "Components";

  const frame = el("main", { class: "typed-devtools" }, [
    header(runtimeModel),
    nav((tab) => {
      activeTab = tab;
      renderBody();
    }),
    el("section", { class: "panel-body" }),
  ]);

  function renderBody(): void {
    const body = frame.querySelector(".panel-body");
    if (!body) return;
    body.replaceChildren(panel(activeTab, state, events, runtimeModel, actions));
    markActiveTab(frame, activeTab);
  }

  root.innerHTML = "";
  root.append(el("style", {}, stylesheet()), frame);
  renderBody();
}

interface RuntimeModel {
  readonly domBinding: DomBindingResolution;
  readonly items: readonly RuntimeEventStreamItem[];
  readonly sessionId: string;
  readonly source: SourceAnalyzerResponse;
  readonly status: string;
}

async function loadRuntimeModel(
  runtime: ChromeRuntimeConnectable | undefined,
  inspectedWindow: ChromeInspectedWindow | undefined,
): Promise<RuntimeModel> {
  if (inspectedWindow) {
    return loadRuntimeModelFromInspectedWindow(inspectedWindow);
  }
  if (!runtime) return disconnectedRuntimeModel();
  const client = makeChromeRuntimeRpcClient(runtime);
  try {
    return await loadRuntimeModelFromRuntimeRequests({
      analyzeSource: (payload) => client.request("AnalyzeSource", payload),
      handshake: (payload) => client.request("Handshake", payload),
      resolveDomBinding: (payload) => client.request("ResolveDomBinding", payload),
      subscribeRuntimeEvents: (payload) => client.request("SubscribeRuntimeEvents", payload),
    });
  } catch {
    return disconnectedRuntimeModel("runtime unavailable");
  } finally {
    client.disconnect();
  }
}

async function loadRuntimeModelFromInspectedWindow(
  inspectedWindow: ChromeInspectedWindow,
): Promise<RuntimeModel> {
  const client = makeInspectedWindowRpcClient(inspectedWindow);
  try {
    return await loadRuntimeModelFromRuntimeRequests({
      analyzeSource: (payload) => client.request("AnalyzeSource", payload),
      handshake: (payload) => client.request("Handshake", payload),
      resolveDomBinding: (payload) => client.request("ResolveDomBinding", payload),
      subscribeRuntimeEvents: (payload) => client.request("SubscribeRuntimeEvents", payload),
    });
  } catch {
    return disconnectedRuntimeModel("page bridge unavailable");
  }
}

async function loadRuntimeModelFromRuntimeRequests(
  requests: RuntimeRequests,
): Promise<RuntimeModel> {
  const handshake = await requests.handshake(handshakeRequest());
  const items = normalizeRuntimeStreamItems(
    await requests.subscribeRuntimeEvents(runtimeSubscriptionRequest(handshake)),
  );
  const source = supportsCapability(handshake, "source-analyzer")
    ? await requests.analyzeSource(DevtoolsProtocolFixtures.sourceAnalyzerRequest)
    : unavailableSource("Source analyzer bridge is not available");
  const domBinding = supportsCapability(handshake, "dom")
    ? await requests.resolveDomBinding(DevtoolsProtocolFixtures.domBindingRequest)
    : unboundDomBinding("DOM bridge is not available");
  return { domBinding, items, sessionId: handshake.sessionId, source, status: "runtime connected" };
}

interface RuntimeRequests {
  readonly analyzeSource: (payload: SourceAnalyzerRequest) => Promise<SourceAnalyzerResponse>;
  readonly handshake: (
    payload: DevtoolsHandshakeRequest,
  ) => Promise<DevtoolsHandshakeResponse>;
  readonly resolveDomBinding: (payload: DomBindingRequest) => Promise<DomBindingResolution>;
  readonly subscribeRuntimeEvents: (
    payload: RuntimeEventSubscriptionRequest,
  ) => Promise<RuntimeEventStreamItem | readonly RuntimeEventStreamItem[]>;
}

function handshakeRequest(): DevtoolsHandshakeRequest {
  return {
    capabilities: [
      "components",
      "dom",
      "fx",
      "hmr",
      "navigation",
      "otel",
      "refsubjects",
      "source-analyzer",
    ],
    clientId: makeDevtoolsClientId("panel"),
    peer: "extension-panel",
    sessionId: DevtoolsProtocolFixtures.ids.session,
    version: "0.1.0",
  };
}

function runtimeSubscriptionRequest(
  handshake: DevtoolsHandshakeResponse,
): RuntimeEventSubscriptionRequest {
  return {
    capabilities: handshake.acceptedCapabilities.filter(isRuntimeEventCapability),
    replay: true,
    sessionId: handshake.sessionId,
    sinceSequence: 0,
  };
}

function disconnectedRuntimeModel(status = "disconnected"): RuntimeModel {
  return {
    domBinding: unboundDomBinding("Typed DevTools runtime is not connected"),
    items: [],
    sessionId: DevtoolsProtocolFixtures.ids.session,
    source: unavailableSource("Typed DevTools runtime is not connected"),
    status,
  };
}

function unavailableSource(reason: string): SourceAnalyzerResponse {
  return {
    _tag: "Unavailable",
    reason,
    requestedAt: DevtoolsProtocolFixtures.sourceAnalyzerRequest.requestedAt,
  };
}

function unboundDomBinding(reason: string): DomBindingResolution {
  return {
    _tag: "Unbound",
    bindingId: DevtoolsProtocolFixtures.domBindingRequest.bindingId,
    reason,
  };
}

function normalizeRuntimeStreamItems(
  item: RuntimeEventStreamItem | readonly RuntimeEventStreamItem[],
): readonly RuntimeEventStreamItem[] {
  return isRuntimeStreamItemArray(item) ? item : [item];
}

function isRuntimeStreamItemArray(
  item: RuntimeEventStreamItem | readonly RuntimeEventStreamItem[],
): item is readonly RuntimeEventStreamItem[] {
  return Array.isArray(item);
}

function supportsCapability(
  handshake: DevtoolsHandshakeResponse,
  capability: DevtoolsHandshakeResponse["acceptedCapabilities"][number],
): boolean {
  return handshake.acceptedCapabilities.includes(capability);
}

function isRuntimeEventCapability(
  capability: DevtoolsHandshakeResponse["acceptedCapabilities"][number],
): capability is RuntimeEventSubscriptionRequest["capabilities"][number] {
  return (
    capability === "components" ||
    capability === "fx" ||
    capability === "hmr" ||
    capability === "navigation" ||
    capability === "otel" ||
    capability === "refsubjects"
  );
}

function isRuntimeEventStreamEnvelope(
  item: RuntimeEventStreamItem,
): item is RuntimeEventEnvelope {
  return item._tag !== "RuntimeReplayState";
}

function panel(
  tab: PanelTab,
  state: ReturnType<typeof createTypedDevtoolsPanelState>,
  events: readonly RuntimeEventEnvelope[],
  runtimeModel: RuntimeModel,
  actions: TypedDevtoolsPanelActions,
): HTMLElement {
  switch (tab) {
    case "Components":
      return componentsPanel(componentRows(state), runtimeModel, actions);
    case "Templates":
      return listPanel(tab, templateRows(state), (row) => [row.displayName, row.templateHash]);
    case "Fx":
      return listPanel(tab, fxRows(state), (row) => [row.fxNodeId, row.lastPhase]);
    case "RefSubjects":
      return listPanel(tab, refSubjectRows(state), (row) => [row.refSubjectId, `v${row.version}`]);
    case "HMR":
      return listPanel(tab, events.filter(isHmrEvent), (event) => [
        event.boundaryId,
        event.stateful._tag,
      ]);
    case "Navigation":
      return listPanel(tab, events.filter(isNavigationEvent), (event) => [event.type, event.to]);
    case "OTEL":
      return listPanel(tab, events.filter(isOtelEvent), (event) => [
        event.name,
        `${event.traceId}/${event.spanId}`,
      ]);
    case "Sources":
      return sourcesPanel(runtimeModel.source);
  }
}

function componentsPanel(
  rows: readonly ComponentPanelRow[],
  runtimeModel: RuntimeModel,
  actions: TypedDevtoolsPanelActions,
): HTMLElement {
  return titledPanel("Components", [
    rows.length === 0
      ? empty()
      : el(
          "div",
          { class: "grid components-grid" },
          rows.map((row) => componentRow(row, runtimeModel, actions)),
        ),
  ]);
}

function componentRow(
  row: ComponentPanelRow,
  runtimeModel: RuntimeModel,
  actions: TypedDevtoolsPanelActions,
): HTMLElement {
  return el("div", { class: "data-row" }, [
    el("div", { class: "primary" }, row.displayName),
    el("code", {}, row.componentId),
    el("span", {}, row.templateHash ?? "no template"),
    el("span", {}, `${row.fxCount} Fx / ${row.refSubjectCount} refs`),
    rowActions(row, runtimeModel, actions),
  ]);
}

function rowActions(
  row: ComponentPanelRow,
  runtimeModel: RuntimeModel,
  actions: TypedDevtoolsPanelActions,
): HTMLElement {
  const bindingId = componentBindingId(row.componentId, runtimeModel.domBinding);
  const source = componentSourceTarget(row.componentId, runtimeModel.source);
  return el("div", { class: "row-actions" }, [
    actionButton("DOM", `component-action-dom-${testId(row.componentId)}`, !bindingId, () => {
      if (bindingId) void actions.inspectDomBinding?.(bindingId);
    }),
    actionButton("Source", `component-action-source-${testId(row.componentId)}`, !source, () => {
      if (source) void actions.openSource?.(source);
    }),
  ]);
}

function listPanel<T>(
  title: PanelTab,
  rows: readonly T[],
  cells: (row: T) => readonly string[],
): HTMLElement {
  return titledPanel(title, [
    rows.length === 0
      ? empty()
      : el(
          "div",
          { class: "grid" },
          rows.map((row) => dataRow(cells(row))),
        ),
  ]);
}

function sourcesPanel(source: SourceAnalyzerResponse): HTMLElement {
  if (source._tag === "Unavailable")
    return titledPanel("Sources", [el("p", { class: "empty" }, source.reason)]);
  return titledPanel("Sources", [
    el("div", { class: "source-summary" }, [
      el("code", {}, source.resource),
      el("span", {}, `${source.facts.length} facts`),
    ]),
    el(
      "div",
      { class: "grid" },
      source.facts.map((fact) => dataRow(sourceFactCells(fact))),
    ),
  ]);
}

function titledPanel(title: PanelTab, children: readonly Node[]): HTMLElement {
  return el("section", { "data-testid": `panel-${title.toLowerCase()}` }, [
    el("h2", {}, title),
    ...children,
  ]);
}

function dataRow(cells: readonly string[]): HTMLElement {
  return el(
    "div",
    { class: "data-row" },
    cells.map((cell, index) => el(index === 0 ? "code" : "span", {}, cell)),
  );
}

type SourceFact = Extract<
  SourceAnalyzerResponse,
  { readonly _tag: "SourceFacts" }
>["facts"][number];

function sourceFactCells(fact: SourceFact): readonly string[] {
  switch (fact._tag) {
    case "ComponentDefinition":
      return [fact.displayName, fact.sourceLocationId];
    case "FxDefinition":
      return [fact.fxNodeId, fact.sourceLocationId];
    case "RefSubjectDefinition":
      return [fact.refSubjectId, fact.sourceLocationId];
  }
}

function componentBindingId(
  componentId: ComponentId,
  resolution: DomBindingResolution,
): DomBindingId | undefined {
  return resolution._tag === "Resolved" && resolution.component.componentId === componentId
    ? resolution.bindingId
    : undefined;
}

function componentSourceTarget(
  componentId: ComponentId,
  source: SourceAnalyzerResponse,
): SourceTarget | undefined {
  if (source._tag !== "SourceFacts") return undefined;
  const fact = source.facts.find(
    (next) => next._tag === "ComponentDefinition" && next.componentId === componentId,
  );
  if (!fact) return undefined;
  return { ...parseSourceLocation(fact.sourceLocationId), resource: source.resource };
}

function parseSourceLocation(sourceLocationId: string): Omit<SourceTarget, "resource"> {
  const parts = sourceLocationId.split(":");
  const column = Number(parts.at(-1));
  const line = Number(parts.at(-2));
  return {
    ...(Number.isFinite(column) && { column }),
    line: Number.isFinite(line) ? line : 1,
  };
}

function header(runtimeModel: RuntimeModel): HTMLElement {
  return el("header", { class: "toolbar" }, [
    el("strong", {}, "Typed"),
    el("span", { class: "status", "data-testid": "connection-status" }, runtimeModel.status),
    el("span", { class: "session" }, `session ${runtimeModel.sessionId}`),
  ]);
}

function nav(onSelect: (tab: PanelTab) => void): HTMLElement {
  return el(
    "nav",
    { class: "tabs" },
    tabs.map((tab) => {
      const button = el("button", { type: "button", "data-testid": `tab-${tab}` }, tab);
      button.addEventListener("click", () => onSelect(tab));
      return button;
    }),
  );
}

function markActiveTab(root: Element, activeTab: PanelTab): void {
  for (const button of root.querySelectorAll(".tabs button")) {
    button.setAttribute("aria-selected", button.textContent === activeTab ? "true" : "false");
  }
}

function actionButton(
  label: string,
  testIdValue: string,
  disabled: boolean,
  onClick: () => void,
): HTMLElement {
  const button = el("button", { type: "button", "data-testid": testIdValue }, label);
  if (disabled) button.setAttribute("disabled", "true");
  button.addEventListener("click", onClick);
  return button;
}

function chromePanelActions(): TypedDevtoolsPanelActions {
  const chrome = (globalThis as { readonly chrome?: ChromePanelActionApi }).chrome;
  return {
    inspectDomBinding: async (bindingId) => {
      if (chrome?.devtools?.inspectedWindow) {
        await inspectInspectedWindowDomBinding(chrome.devtools.inspectedWindow, bindingId);
      }
    },
    openSource: (target) => {
      chrome?.devtools?.panels?.openResource?.(target.resource, target.line, () => undefined);
    },
  };
}

interface ChromePanelActionApi {
  readonly devtools?: {
    readonly inspectedWindow?: ChromeInspectedWindow;
    readonly panels?: {
      readonly openResource?: (resource: string, lineNumber: number, callback?: () => void) => void;
    };
  };
}

function globalChromeRuntime(): ChromeRuntimeConnectable | undefined {
  const candidate = globalThis as {
    readonly chrome?: { readonly runtime?: ChromeRuntimeConnectable };
  };
  return candidate.chrome?.runtime;
}

function globalChromeInspectedWindow(): ChromeInspectedWindow | undefined {
  const candidate = globalThis as {
    readonly chrome?: { readonly devtools?: { readonly inspectedWindow?: ChromeInspectedWindow } };
  };
  return candidate.chrome?.devtools?.inspectedWindow;
}

function empty(): HTMLElement {
  return el("p", { class: "empty" }, "No events");
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
  children: string | readonly Node[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (typeof children === "string") node.textContent = children;
  else node.append(...children);
  return node;
}

function isHmrEvent(event: RuntimeEventEnvelope) {
  return event._tag === "HmrStatus";
}

function isNavigationEvent(event: RuntimeEventEnvelope) {
  return event._tag === "NavigationEvent";
}

function isOtelEvent(event: RuntimeEventEnvelope) {
  return event._tag === "OtelSpan";
}

function testId(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

function stylesheet(): string {
  return `
    body { margin: 0; font: 12px/1.4 system-ui, sans-serif; color: #202124; background: #f7f8fa; }
    .typed-devtools { min-height: 100vh; display: grid; grid-template-rows: auto auto 1fr; }
    .toolbar { height: 32px; display: flex; align-items: center; gap: 10px; padding: 0 10px; border-bottom: 1px solid #d9dde3; background: #fff; }
    .status { color: #0b6b3a; }
    .session { color: #69717d; margin-left: auto; }
    .tabs { display: flex; align-items: stretch; gap: 0; border-bottom: 1px solid #d9dde3; background: #edf1f5; overflow-x: auto; }
    .tabs button { border: 0; border-right: 1px solid #d9dde3; background: transparent; border-radius: 0; padding: 7px 10px; color: #3c4043; }
    .tabs button[aria-selected="true"] { background: #fff; color: #111827; box-shadow: inset 0 -2px 0 #1a73e8; }
    .panel-body { min-width: 0; padding: 10px; }
    section { max-width: 1180px; }
    h2 { font-size: 13px; margin: 0 0 8px; font-weight: 600; }
    .grid { display: grid; border: 1px solid #d9dde3; background: #fff; }
    .data-row { min-height: 34px; display: grid; grid-template-columns: minmax(130px, 1fr) minmax(190px, 1.4fr) minmax(150px, 1fr) auto; gap: 10px; align-items: center; padding: 6px 8px; border-bottom: 1px solid #edf0f3; }
    .components-grid .data-row { grid-template-columns: minmax(120px, .8fr) minmax(190px, 1.2fr) minmax(160px, 1fr) minmax(110px, .8fr) auto; }
    .data-row:last-child { border-bottom: 0; }
    .primary { font-weight: 600; color: #111827; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #334155; overflow-wrap: anywhere; }
    .row-actions { display: flex; gap: 6px; justify-content: end; }
    button { border: 1px solid #c8ced8; background: #fff; border-radius: 4px; padding: 3px 8px; font: inherit; }
    button:disabled { color: #9aa0a6; background: #f3f4f6; }
    .empty { color: #69717d; margin: 0; }
    .source-summary { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
  `;
}

const root = document.getElementById("typed-devtools-root");
if (root) void renderTypedDevtoolsPanel(root);
