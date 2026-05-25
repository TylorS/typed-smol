import {
  DevtoolsProtocolFixtures,
  makeNavigationEventId,
  makeDevtoolsClientId,
  type RuntimeEventEnvelope,
  type SourceAnalyzerResponse,
} from "@typed/devtools-protocol";
import {
  makeChromeRuntimeRpcClient,
  type ChromeRuntimeConnectable,
} from "../transport/chromeRuntime.js";
import { createTypedDevtoolsPanelState, applyRuntimeStreamItem } from "./state.js";
import { componentRows, templateRows } from "./views/components.js";
import { fxRows } from "./views/fx.js";
import { refSubjectRows } from "./views/refsubjects.js";

export interface TypedDevtoolsPanelOptions {
  readonly runtime?: ChromeRuntimeConnectable;
}

const tabs = [
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
  const runtimeModel = await loadRuntimeModel(options.runtime ?? globalChromeRuntime());
  const events: readonly RuntimeEventEnvelope[] = [
    ...DevtoolsProtocolFixtures.runtimeEvents,
    {
      _tag: "NavigationEvent",
      navigationEventId: makeNavigationEventId("navigation:home"),
      timestamp: 4,
      to: "/",
      type: "push",
    },
    {
      _tag: "OtelSpan",
      name: "load-root",
      spanId: "span-root",
      traceId: "trace-root",
      typedIds: [DevtoolsProtocolFixtures.ids.component],
    },
  ];
  const state = DevtoolsProtocolFixtures.storybook.runtimeStreamItems.reduce(
    applyRuntimeStreamItem,
    createTypedDevtoolsPanelState(),
  );
  const source = runtimeModel.source;
  const hmr = events.filter((event) => event._tag === "HmrStatus");
  const navigation = events.filter((event) => event._tag === "NavigationEvent");
  const otel = events.filter((event) => event._tag === "OtelSpan");

  root.innerHTML = "";
  root.append(
    el("style", {}, stylesheet()),
    el("main", { class: "typed-devtools" }, [
      el("header", { class: "toolbar" }, [
        el("strong", {}, "Typed"),
        el("span", { class: "status", "data-testid": "connection-status" }, runtimeModel.status),
        el("span", { class: "session" }, `session ${runtimeModel.sessionId}`),
      ]),
      el(
        "nav",
        { class: "tabs" },
        tabs.map((tab) => el("button", { type: "button" }, tab)),
      ),
      section(
        "Components",
        componentRows(state).map((row) => `${row.displayName} ${row.deepLink}`),
      ),
      section(
        "Templates",
        templateRows(state).map((row) => `${row.templateHash} ${row.deepLink}`),
      ),
      section(
        "Fx",
        fxRows(state).map((row) => `${row.fxNodeId} ${row.lastPhase}`),
      ),
      section(
        "RefSubjects",
        refSubjectRows(state).map((row) => `${row.refSubjectId} v${row.version}`),
      ),
      section(
        "HMR",
        hmr.map((event) => `${event.boundaryId} ${event.stateful._tag}`),
      ),
      section(
        "Navigation",
        navigation.map((event) => `${event.type} ${event.to}`),
      ),
      section(
        "OTEL",
        otel.map((event) => `${event.name} ${event.traceId}/${event.spanId}`),
      ),
      section("Sources", sourceRows(source)),
    ]),
  );
}

interface RuntimeModel {
  readonly sessionId: string;
  readonly source: SourceAnalyzerResponse;
  readonly status: string;
}

async function loadRuntimeModel(
  runtime: ChromeRuntimeConnectable | undefined,
): Promise<RuntimeModel> {
  if (!runtime) return fixtureRuntimeModel();
  const client = makeChromeRuntimeRpcClient(runtime);
  try {
    const handshake = await client.request("Handshake", {
      capabilities: [
        "components",
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
    });
    const source = await client.request(
      "AnalyzeSource",
      DevtoolsProtocolFixtures.sourceAnalyzerRequest,
    );
    return {
      sessionId: handshake.sessionId,
      source,
      status: "runtime connected",
    };
  } catch {
    return fixtureRuntimeModel("runtime unavailable");
  } finally {
    client.disconnect();
  }
}

function fixtureRuntimeModel(status = "fixture connected"): RuntimeModel {
  return {
    sessionId: DevtoolsProtocolFixtures.ids.session,
    source: DevtoolsProtocolFixtures.sourceAnalyzerResponse as SourceAnalyzerResponse,
    status,
  };
}

function globalChromeRuntime(): ChromeRuntimeConnectable | undefined {
  const candidate = globalThis as {
    readonly chrome?: { readonly runtime?: ChromeRuntimeConnectable };
  };
  return candidate.chrome?.runtime;
}

function sourceRows(source: SourceAnalyzerResponse): readonly string[] {
  switch (source._tag) {
    case "SourceFacts":
      return [`${source.resource} ${source.facts.length} facts`];
    case "Unavailable":
      return [source.reason];
  }
}

function section(title: string, rows: readonly string[]): HTMLElement {
  return el("section", { "aria-label": title }, [
    el("h2", {}, title),
    rows.length === 0
      ? el("p", { class: "empty" }, "No events")
      : el(
          "ul",
          {},
          rows.map((row) => el("li", {}, row)),
        ),
  ]);
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
  children: string | readonly Node[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (typeof children === "string") {
    node.textContent = children;
  } else {
    node.append(...children);
  }
  return node;
}

function stylesheet(): string {
  return `
    body { margin: 0; font: 12px/1.4 system-ui, sans-serif; color: #202124; background: #fff; }
    .typed-devtools { display: grid; gap: 10px; padding: 10px; }
    .toolbar, .tabs { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .status { color: #0b7; }
    .session { color: #5f6368; }
    button { border: 1px solid #dadce0; background: #f8fafd; border-radius: 4px; padding: 4px 8px; }
    section { border-top: 1px solid #e8eaed; padding-top: 8px; }
    h2 { font-size: 13px; margin: 0 0 4px; }
    ul { margin: 0; padding-left: 18px; }
    .empty { color: #777; margin: 0; }
  `;
}

const root = document.getElementById("typed-devtools-root");
if (root) void renderTypedDevtoolsPanel(root);
