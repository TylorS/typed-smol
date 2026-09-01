import { afterEach, describe, expect, it, vi } from "vitest";
import type { SearchResult } from "../../docs/Search.js";

const { search, registerWebMcp } = vi.hoisted(() => ({
  search: vi.fn<(query: string) => Promise<ReadonlyArray<SearchResult>>>(),
  registerWebMcp: vi.fn(),
}));

vi.mock("../../agent/WebMcp.js", () => ({ registerWebMcp }));
vi.mock("../OnDemandSearch.js", () => ({ createOnDemandSearch: () => search }));

type Listener = (event: Event) => void;

interface FakeElement {
  readonly attributes: Map<string, string>;
  readonly listeners: Map<string, Listener>;
  children: Array<FakeElement>;
  className: string;
  href: string;
  textContent: string;
  value: string;
  addEventListener(type: string, listener: Listener): void;
  append(...children: ReadonlyArray<FakeElement>): void;
  focus(): void;
  removeAttribute(name: string): void;
  replaceChildren(...children: ReadonlyArray<FakeElement>): void;
  setAttribute(name: string, value: string): void;
}

const createElement = (): FakeElement => {
  const element: FakeElement = {
    attributes: new Map(),
    listeners: new Map(),
    children: [],
    className: "",
    href: "",
    textContent: "",
    value: "",
    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    },
    append(...children) {
      this.children.push(...children);
    },
    focus() {},
    removeAttribute(name) {
      this.attributes.delete(name);
    },
    replaceChildren(...children) {
      this.children = [...children];
    },
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
  };
  return element;
};

const dispatch = (element: FakeElement, type: string): void => {
  element.listeners.get(type)?.({} as Event);
};

const setupClient = async () => {
  const dialog = { ...createElement(), open: false, showModal: vi.fn() };
  const input = createElement();
  const results = createElement();
  const open = createElement();
  const close = createElement();
  const elements = new Map<string, FakeElement>([
    ["[data-search-dialog]", dialog],
    ["[data-search-input]", input],
    ["[data-search-results]", results],
    ["[data-search-open]", open],
    ["[data-search-close]", close],
  ]);

  vi.stubGlobal("document", {
    addEventListener: vi.fn(),
    createElement: () => createElement(),
    querySelector: (selector: string) => elements.get(selector) ?? null,
  } as unknown as Document);
  await import("../../client.js");
  return { input, results };
};

describe("client search", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    search.mockReset();
    registerWebMcp.mockReset();
  });

  it("clears busy state before an invalidated search resolves", async () => {
    vi.useFakeTimers();
    let resolve!: (results: ReadonlyArray<SearchResult>) => void;
    search.mockImplementation(
      () =>
        new Promise<ReadonlyArray<SearchResult>>((done) => {
          resolve = done;
        }),
    );
    const { input, results } = await setupClient();

    input.value = "Fx";
    dispatch(input, "input");
    await vi.advanceTimersByTimeAsync(80);
    expect(results.attributes.get("aria-busy")).toBe("true");

    input.value = "";
    dispatch(input, "input");
    expect(results.attributes.has("aria-busy")).toBe(false);

    resolve([]);
    await Promise.resolve();
    expect(results.children).toEqual([]);
  });

  it("renders a load error and accepts a later retry", async () => {
    vi.useFakeTimers();
    search.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([
      {
        id: "guide:fx",
        title: "Fx: work arrives",
        kind: "guide",
        text: "push based reactivity",
        href: "/explore/fx-push-reactivity",
        score: 1,
      },
    ]);
    const { input, results } = await setupClient();

    input.value = "Fx";
    dispatch(input, "input");
    await vi.advanceTimersByTimeAsync(80);
    expect(results.attributes.has("aria-busy")).toBe(false);
    expect(results.children[0]?.textContent).toBe(
      "Search could not be loaded. Check your connection and try again.",
    );

    dispatch(input, "input");
    await vi.advanceTimersByTimeAsync(80);
    expect(results.children[0]?.children[0]?.children[0]?.textContent).toBe("Fx: work arrives");
  });
});
