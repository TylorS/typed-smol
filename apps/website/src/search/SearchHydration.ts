import { Effect, Layer } from "effect";
import type { SearchResult } from "../docs/Search.js";
import { createSearchSession } from "./SearchSession.js";
import type { SearchState } from "./SearchSession.js";

export interface SearchHydrationOptions {
  readonly document: Document;
  readonly search: (query: string) => Promise<ReadonlyArray<SearchResult>>;
  readonly debounceMillis?: number;
}

const listen = (
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions,
) =>
  Effect.acquireRelease(
    Effect.sync(() => target.addEventListener(type, listener, options)),
    () => Effect.sync(() => target.removeEventListener(type, listener, options)),
  );

const focusable = (value: Element | null): value is HTMLElement =>
  value !== null && "focus" in value && typeof value.focus === "function";

export const searchHydration = ({
  document,
  search,
  debounceMillis = 80,
}: SearchHydrationOptions): Layer.Layer<never> =>
  Layer.effectDiscard(
    Effect.gen(function* () {
      const dialog = document.querySelector<HTMLDialogElement>("[data-search-dialog]");
      const input = document.querySelector<HTMLInputElement>("[data-search-input]");
      const results = document.querySelector<HTMLElement>("[data-search-results]");
      const open = document.querySelector<HTMLElement>("[data-search-open]");
      const close = document.querySelector<HTMLElement>("[data-search-close]");
      if (dialog === null || input === null || results === null || open === null) return;

      let timer: ReturnType<typeof setTimeout> | undefined;
      let returnFocus: HTMLElement | undefined;
      const resultLinks = (): ReadonlyArray<HTMLAnchorElement> => [
        ...results.querySelectorAll<HTMLAnchorElement>("a[href]"),
      ];
      const openSearch = (): void => {
        if (!dialog.open) {
          returnFocus =
            document.activeElement !== document.body && focusable(document.activeElement)
              ? document.activeElement
              : open;
          dialog.showModal();
          open.setAttribute("aria-expanded", "true");
        }
        input.focus();
      };
      const renderState = (state: SearchState): void => {
        results.replaceChildren();
        if (state.status === "loading") {
          results.setAttribute("aria-busy", "true");
          return;
        }
        results.removeAttribute("aria-busy");
        if (state.status === "idle") return;
        if (state.status === "error") {
          const error = document.createElement("p");
          error.className = "search-empty";
          error.textContent = "Search could not be loaded. Check your connection and try again.";
          results.append(error);
          return;
        }
        if (state.matches.length === 0) {
          const empty = document.createElement("p");
          empty.className = "search-empty";
          empty.textContent = `No documentation found for “${state.query}”.`;
          results.append(empty);
          return;
        }
        const list = document.createElement("ol");
        list.className = "search-results-list";
        for (const match of state.matches) {
          const item = document.createElement("li");
          const link = document.createElement("a");
          const kind = document.createElement("small");
          link.href = match.href;
          link.textContent = match.title;
          kind.textContent = match.kind;
          item.append(link, kind);
          list.append(item);
        }
        results.append(list);
      };
      const session = createSearchSession(search, renderState);
      const onOpen = (): void => openSearch();
      const onCloseButton = (): void => dialog.close();
      const onDialogClose = (): void => {
        open.setAttribute("aria-expanded", "false");
        returnFocus?.focus();
        returnFocus = undefined;
      };
      const onDialogClick = (event: Event): void => {
        if (event.target === dialog) dialog.close();
      };
      const onInput = (): void => {
        session.invalidate();
        clearTimeout(timer);
        const query = input.value.trim();
        if (query.length === 0) void session.query("");
        else timer = setTimeout(() => void session.query(query), debounceMillis);
      };
      const onInputKeydown = (event: Event): void => {
        const keyboardEvent = event as KeyboardEvent;
        const links = resultLinks();
        const target = keyboardEvent.key === "ArrowDown" ? links[0] : links.at(-1);
        if ((keyboardEvent.key === "ArrowDown" || keyboardEvent.key === "ArrowUp") && target) {
          keyboardEvent.preventDefault();
          target.focus();
        }
      };
      const onResultsKeydown = (event: Event): void => {
        const keyboardEvent = event as KeyboardEvent;
        const link = (keyboardEvent.target as Element | null)?.closest?.("a[href]");
        if (link === null || link === undefined) return;
        const links = resultLinks();
        const index = links.indexOf(link as HTMLAnchorElement);
        if (index < 0) return;
        const next =
          keyboardEvent.key === "ArrowDown"
            ? links[(index + 1) % links.length]
            : keyboardEvent.key === "ArrowUp"
              ? links[(index - 1 + links.length) % links.length]
              : keyboardEvent.key === "Home"
                ? links[0]
                : keyboardEvent.key === "End"
                  ? links.at(-1)
                  : undefined;
        if (next !== undefined) {
          keyboardEvent.preventDefault();
          next.focus();
        }
      };
      const onDocumentKeydown = (event: Event): void => {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.key === "Escape" && dialog.open) {
          keyboardEvent.preventDefault();
          dialog.close();
          return;
        }
        if (
          (keyboardEvent.metaKey || keyboardEvent.ctrlKey) &&
          keyboardEvent.key.toLowerCase() === "k"
        ) {
          keyboardEvent.preventDefault();
          openSearch();
        }
      };

      open.setAttribute("aria-expanded", "false");
      yield* listen(open, "click", onOpen);
      if (close !== null) yield* listen(close, "click", onCloseButton);
      yield* listen(dialog, "close", onDialogClose);
      yield* listen(dialog, "click", onDialogClick);
      yield* listen(input, "input", onInput);
      yield* listen(input, "keydown", onInputKeydown);
      yield* listen(results, "keydown", onResultsKeydown);
      yield* listen(document, "keydown", onDocumentKeydown);
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          clearTimeout(timer);
          session.invalidate();
        }),
      );
    }),
  );
