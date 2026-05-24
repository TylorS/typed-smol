import type {
  ComponentId,
  DomBindingId,
  DomBindingResolution,
  FxNodeId,
  RefSubjectId,
  TemplateHash,
  TemplatePartId,
} from "@typed/devtools-protocol";
import { makeDomBindingId } from "@typed/devtools-protocol";
import { devtoolsDeepLink } from "./panel/state.js";
import {
  makeInspectedWindowDomResolver,
  type InspectedWindowDomResolver,
} from "./transport/inspectedWindow.js";

export interface ChromeElementsSidebarApi {
  readonly devtools: {
    readonly inspectedWindow?: Parameters<typeof makeInspectedWindowDomResolver>[0];
    readonly panels: {
      readonly elements: {
        readonly createSidebarPane: (
          title: string,
          callback: (sidebar: ChromeExtensionSidebarPane) => void,
        ) => void;
        readonly onSelectionChanged: {
          readonly addListener: (listener: () => void | Promise<void>) => void;
        };
      };
    };
  };
}

export interface ChromeExtensionSidebarPane {
  readonly setObject: (jsonObject: unknown, rootTitle?: string) => void;
  readonly setPage?: (path: string) => void;
}

export interface ElementsSidebarRegistrationOptions {
  readonly pagePath?: string;
  readonly resolver?: InspectedWindowDomResolver;
  readonly title?: string;
}

export type ElementsSidebarModel = ElementsSidebarResolvedModel | ElementsSidebarUnboundModel;

export interface ElementsSidebarResolvedModel {
  readonly _tag: "Resolved";
  readonly bindingId: DomBindingId;
  readonly component: ElementsSidebarComponentModel;
  readonly fx: readonly ElementsSidebarFxModel[];
  readonly refSubjects: readonly ElementsSidebarRefSubjectModel[];
  readonly template?: ElementsSidebarTemplateModel;
}

export interface ElementsSidebarUnboundModel {
  readonly _tag: "Unbound";
  readonly bindingId: DomBindingId;
  readonly reason: string;
}

export interface ElementsSidebarComponentModel {
  readonly componentId: ComponentId;
  readonly deepLink: string;
  readonly displayName: string;
}

export interface ElementsSidebarTemplateModel {
  readonly deepLink: string;
  readonly partId?: TemplatePartId;
  readonly templateHash: TemplateHash;
}

export interface ElementsSidebarFxModel {
  readonly deepLink: string;
  readonly fxNodeId: FxNodeId;
}

export interface ElementsSidebarRefSubjectModel {
  readonly deepLink: string;
  readonly refSubjectId: RefSubjectId;
}

export function registerTypedElementsSidebar(
  chrome: ChromeElementsSidebarApi,
  options: ElementsSidebarRegistrationOptions | InspectedWindowDomResolver = {},
): void {
  const resolvedOptions = resolveOptions(options);
  const resolver =
    resolvedOptions.resolver ??
    (chrome.devtools.inspectedWindow
      ? makeInspectedWindowDomResolver(chrome.devtools.inspectedWindow)
      : undefined);
  if (!resolver) throw new Error("Typed Elements sidebar requires an inspectedWindow resolver");

  chrome.devtools.panels.elements.createSidebarPane(resolvedOptions.title ?? "Typed", (sidebar) => {
    let selectedElementRequest = 0;
    sidebar.setPage?.(resolvedOptions.pagePath ?? "elementsSidebar.html");
    chrome.devtools.panels.elements.onSelectionChanged.addListener(async () => {
      const request = ++selectedElementRequest;
      const resolution = await resolveSelectedElement(resolver);
      if (request !== selectedElementRequest) return;
      sidebar.setObject(elementsSidebarModel(resolution), "Typed");
    });
  });
}

export function elementsSidebarModel(resolution: DomBindingResolution): ElementsSidebarModel {
  if (resolution._tag === "Unbound") return resolution;
  const component = resolution.component;
  return {
    _tag: "Resolved",
    bindingId: resolution.bindingId,
    component: {
      componentId: component.componentId,
      deepLink: devtoolsDeepLink("component", component.componentId),
      displayName: component.displayName,
    },
    fx: component.fxNodeIds.map((fxNodeId) => ({
      deepLink: devtoolsDeepLink("fx", fxNodeId),
      fxNodeId,
    })),
    refSubjects: component.refSubjectIds.map((refSubjectId) => ({
      deepLink: devtoolsDeepLink("refsubject", refSubjectId),
      refSubjectId,
    })),
    ...(component.templateHash && {
      template: {
        deepLink: devtoolsDeepLink("template", component.templateHash),
        ...(resolution.templatePartId && { partId: resolution.templatePartId }),
        templateHash: component.templateHash,
      },
    }),
  };
}

function resolveOptions(
  options: ElementsSidebarRegistrationOptions | InspectedWindowDomResolver,
): ElementsSidebarRegistrationOptions {
  if ("resolveSelectedElement" in options) return { resolver: options };
  return options;
}

async function resolveSelectedElement(
  resolver: InspectedWindowDomResolver,
): Promise<DomBindingResolution> {
  try {
    return await resolver.resolveSelectedElement();
  } catch (error) {
    return {
      _tag: "Unbound",
      bindingId: makeDomBindingId("selected-node"),
      reason: `Typed Elements sidebar selection failed: ${errorMessage(error)}`,
    };
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  if (typeof error === "string" && error.length > 0) return error;
  return "unknown error";
}
