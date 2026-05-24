export interface TypedDevtoolsPageOptions {
  readonly iconPath?: string;
  readonly pagePath?: string;
  readonly title?: string;
}

export interface ChromeDevtoolsPageApi {
  readonly devtools: {
    readonly panels: {
      readonly create: (
        title: string,
        iconPath: string,
        pagePath: string,
        callback?: (panel: unknown) => void,
      ) => void;
    };
  };
}

export function registerTypedDevtoolsPage(
  chrome: ChromeDevtoolsPageApi,
  options: TypedDevtoolsPageOptions = {},
): void {
  chrome.devtools.panels.create(
    options.title ?? "Typed",
    options.iconPath ?? "icons/typed-devtools-32.png",
    options.pagePath ?? "panel.html",
  );
}
