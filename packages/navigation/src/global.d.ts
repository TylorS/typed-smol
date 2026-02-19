/**
 * Global type declarations for the Navigation API (window.navigation).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API
 */
declare global {
  interface Window {
    readonly navigation: Navigation;
  }

  interface NavigationNavigateOptions {
    readonly state?: unknown;
    readonly info?: unknown;
    readonly history?: "auto" | "push" | "replace";
  }

  interface NavigationReloadOptions {
    readonly state?: unknown;
    readonly info?: unknown;
  }

  interface NavigationOptions {
    readonly info?: unknown;
  }

  interface NavigationHistoryEntry {
    readonly id: string;
    readonly key: string;
    readonly url: URL | null;
    readonly index: number;
    readonly sameDocument: boolean;
    getState(): unknown;
  }

  interface NavigateEvent extends Event {
    readonly navigationType: "push" | "reload" | "replace" | "traverse";
    readonly canIntercept: boolean;
    readonly destination: NavigationDestination;
    readonly hashChange: boolean;
    readonly signal: AbortSignal;
    readonly userInitiated: boolean;
    readonly formData: FormData | null;
    readonly downloadRequest: string | null;
    readonly info: unknown;
    intercept(options?: NavigationInterceptOptions): void;
  }

  interface NavigationDestination {
    readonly url: string;
    readonly key: string | null;
    readonly id: string | null;
    readonly index: number;
    readonly sameDocument: boolean;
    getState(): unknown;
  }

  interface NavigationInterceptOptions {
    handler?: () => void | Promise<void>;
    focusReset?: "after-transition" | "manual";
    scroll?: "after-transition" | "manual";
  }

  interface NavigationResult {
    readonly committed: Promise<NavigationHistoryEntry>;
    readonly finished: Promise<void>;
  }

  interface Navigation {
    readonly currentEntry: NavigationHistoryEntry | null;
    readonly transition: TransitionEvent | null;
    readonly canGoBack: boolean;
    readonly canGoForward: boolean;
    entries(): NavigationHistoryEntry[];
    navigate(url: string | URL, options?: NavigationNavigateOptions): NavigationResult;
    reload(options?: NavigationReloadOptions): NavigationResult;
    traverseTo(key: string, options?: NavigationOptions): NavigationResult;
    back(options?: NavigationOptions): NavigationResult;
    forward(options?: NavigationOptions): NavigationResult;
    addEventListener(
      type: "navigate",
      listener: (event: NavigateEvent) => void,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener(
      type: "navigate",
      listener: (event: NavigateEvent) => void,
      options?: boolean | EventListenerOptions,
    ): void;
  }

  interface TransitionEvent extends Event {
    readonly navigationType: "push" | "reload" | "replace" | "traverse";
    readonly from: NavigationHistoryEntry;
    readonly finished: Promise<void>;
  }

  const Navigation: {
    prototype: Navigation;
    new (): Navigation;
  };
}

export {};
