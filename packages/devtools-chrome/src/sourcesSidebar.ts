import type {
  ComponentId,
  FxNodeId,
  RefSubjectId,
  SourceAnalyzerFact,
  SourceAnalyzerRequest,
  SourceAnalyzerResponse,
  SourceLocationId,
} from "@typed/devtools-protocol";
import { devtoolsDeepLink } from "./panel/state.js";
import {
  makeChromeRuntimeRpcClient,
  type ChromeRuntimeConnectable,
  type ChromeRuntimeRpcClient,
} from "./transport/chromeRuntime.js";

export interface ChromeSourcesSidebarApi {
  readonly devtools: {
    readonly panels: {
      readonly sources: {
        readonly createSidebarPane: (
          title: string,
          callback: (sidebar: ChromeSourcesSidebarPane) => void,
        ) => void;
        readonly onSelectionChanged: {
          readonly addListener: (listener: () => void | Promise<void>) => void;
        };
      };
    };
  };
  readonly runtime?: ChromeRuntimeConnectable;
}

export interface ChromeSourcesSidebarPane {
  readonly setObject: (jsonObject: unknown, rootTitle?: string) => void;
  readonly setPage?: (path: string) => void;
}

export interface SourcesAnalyzerClient {
  readonly analyzeSource: (request: SourceAnalyzerRequest) => Promise<SourceAnalyzerResponse>;
}

export type SourceSelectionResult = SourceAnalyzerRequest | SourcesSidebarUnavailableModel;

export interface SourcesSidebarRegistrationOptions {
  readonly analyzer?: SourcesAnalyzerClient;
  readonly pagePath?: string;
  readonly selection?: () => SourceSelectionResult | Promise<SourceSelectionResult>;
  readonly title?: string;
}

export type SourcesSidebarModel = SourcesSidebarFactsModel | SourcesSidebarUnavailableModel;

export interface SourcesSidebarFactsModel {
  readonly _tag: "SourceFacts";
  readonly facts: readonly SourcesSidebarFactModel[];
  readonly requestedAt: number;
  readonly resource: string;
}

export type SourcesSidebarFactModel =
  | SourcesSidebarComponentFactModel
  | SourcesSidebarFxFactModel
  | SourcesSidebarRefSubjectFactModel;

export interface SourcesSidebarComponentFactModel {
  readonly _tag: "ComponentDefinition";
  readonly componentId: ComponentId;
  readonly deepLink: string;
  readonly displayName: string;
  readonly sourceLink: string;
  readonly sourceLocationId: SourceLocationId;
}

export interface SourcesSidebarFxFactModel {
  readonly _tag: "FxDefinition";
  readonly deepLink: string;
  readonly fxNodeId: FxNodeId;
  readonly sourceLink: string;
  readonly sourceLocationId: SourceLocationId;
}

export interface SourcesSidebarRefSubjectFactModel {
  readonly _tag: "RefSubjectDefinition";
  readonly deepLink: string;
  readonly refSubjectId: RefSubjectId;
  readonly sourceLink: string;
  readonly sourceLocationId: SourceLocationId;
}

export type SourcesSidebarUnavailableModel = Extract<
  SourceAnalyzerResponse,
  { readonly _tag: "Unavailable" }
>;

export function registerTypedSourcesSidebar(
  chrome: ChromeSourcesSidebarApi,
  options: SourcesSidebarRegistrationOptions = {},
): void {
  const analyzer = resolveAnalyzer(chrome, options);
  const selection = options.selection ?? unavailableSelection;

  chrome.devtools.panels.sources.createSidebarPane(options.title ?? "Typed", (sidebar) => {
    let selectedSourceRequest = 0;
    sidebar.setPage?.(options.pagePath ?? "sourcesSidebar.html");
    chrome.devtools.panels.sources.onSelectionChanged.addListener(async () => {
      const request = ++selectedSourceRequest;
      const response = await analyzeSelectedSource(selection, analyzer);
      if (request !== selectedSourceRequest) return;
      sidebar.setObject(sourcesSidebarModel(response), "Typed");
    });
  });
}

export function sourcesSidebarModel(response: SourceAnalyzerResponse): SourcesSidebarModel {
  if (response._tag === "Unavailable") return response;
  return {
    _tag: "SourceFacts",
    facts: response.facts.map(sourceFactModel),
    requestedAt: response.requestedAt,
    resource: response.resource,
  };
}

function resolveAnalyzer(
  chrome: ChromeSourcesSidebarApi,
  options: SourcesSidebarRegistrationOptions,
): SourcesAnalyzerClient {
  if (options.analyzer) return options.analyzer;
  if (chrome.runtime) return analyzerFromRuntimeClient(makeChromeRuntimeRpcClient(chrome.runtime));
  return {
    analyzeSource: (request) =>
      Promise.resolve({
        _tag: "Unavailable",
        reason: "Source analyzer bridge is not available",
        requestedAt: request.requestedAt,
      }),
  };
}

function analyzerFromRuntimeClient(client: ChromeRuntimeRpcClient): SourcesAnalyzerClient {
  return {
    analyzeSource: (request) => client.request("AnalyzeSource", request),
  };
}

async function analyzeSelectedSource(
  selection: () => SourceSelectionResult | Promise<SourceSelectionResult>,
  analyzer: SourcesAnalyzerClient,
): Promise<SourceAnalyzerResponse> {
  const selected = await selectedSource(selection);
  if (isUnavailableSelection(selected)) return selected;

  try {
    return await analyzer.analyzeSource(selected);
  } catch (error) {
    return {
      _tag: "Unavailable",
      reason: `Typed Sources analyzer failed: ${errorMessage(error)}`,
      requestedAt: selected.requestedAt,
    };
  }
}

async function selectedSource(
  selection: () => SourceSelectionResult | Promise<SourceSelectionResult>,
): Promise<SourceSelectionResult> {
  try {
    return await selection();
  } catch (error) {
    return {
      _tag: "Unavailable",
      reason: `Typed Sources selection failed: ${errorMessage(error)}`,
      requestedAt: Date.now(),
    };
  }
}

function unavailableSelection(): SourcesSidebarUnavailableModel {
  return {
    _tag: "Unavailable",
    reason: "Source selection is not available",
    requestedAt: Date.now(),
  };
}

function isUnavailableSelection(
  selected: SourceSelectionResult,
): selected is SourcesSidebarUnavailableModel {
  return "_tag" in selected && selected._tag === "Unavailable";
}

function sourceFactModel(fact: SourceAnalyzerFact): SourcesSidebarFactModel {
  switch (fact._tag) {
    case "ComponentDefinition":
      return {
        _tag: "ComponentDefinition",
        componentId: fact.componentId,
        deepLink: devtoolsDeepLink("component", fact.componentId),
        displayName: fact.displayName,
        sourceLink: devtoolsDeepLink("source", fact.sourceLocationId),
        sourceLocationId: fact.sourceLocationId,
      };
    case "FxDefinition":
      return {
        _tag: "FxDefinition",
        deepLink: devtoolsDeepLink("fx", fact.fxNodeId),
        fxNodeId: fact.fxNodeId,
        sourceLink: devtoolsDeepLink("source", fact.sourceLocationId),
        sourceLocationId: fact.sourceLocationId,
      };
    case "RefSubjectDefinition":
      return {
        _tag: "RefSubjectDefinition",
        deepLink: devtoolsDeepLink("refsubject", fact.refSubjectId),
        refSubjectId: fact.refSubjectId,
        sourceLink: devtoolsDeepLink("source", fact.sourceLocationId),
        sourceLocationId: fact.sourceLocationId,
      };
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  if (typeof error === "string" && error.length > 0) return error;
  return "unknown error";
}
