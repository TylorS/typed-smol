import assert from "node:assert";
import { describe, it } from "vitest";
import { Effect } from "effect";
import * as Uuid7 from "@typed/id/Uuid7";
import { fromWindow } from "./fromWindow.js";
import { initialMemory, memory } from "./memory.js";
import { Navigation } from "./Navigation.js";
import { Ids } from "@typed/id";

describe("typed/navigation", () => {
  it("fromWindow provides origin and base", () =>
    Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const origin = yield* Navigation.origin;
          const base = yield* Navigation.base;
          assert.equal(origin, "https://example.com");
          assert.equal(base, "/");
        }),
        fromWindow(mockWindow()),
      ).pipe(Effect.provide(Ids.Default)),
    ));

  it("fromWindow layer provides Navigation service", () =>
    Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const n = yield* Navigation;
          const dest = yield* n.currentEntry;
          assert.ok(Uuid7.isUuid7(dest.id), "id should be UUID v7");
          assert.ok(Uuid7.isUuid7(dest.key), "key should be UUID v7");
          assert.equal(dest.url.href, "https://example.com/");
        }),
        fromWindow(mockWindow()),
      ).pipe(Effect.provide(Ids.Default)),
    ));

  describe("memory", () => {
    it("creates memory navigation with initial entries", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const current = yield* Navigation.currentEntry;
            const entries = yield* Navigation.entries;

            assert.equal(current.url.href, "http://localhost/2");
            assert.equal(entries.length, 2);
            assert.equal(entries[0].url.href, "http://localhost/1");
            assert.equal(entries[1].url.href, "http://localhost/2");
          }),
          memory({
            entries: [
              createDestination("http://localhost/1"),
              createDestination("http://localhost/2"),
            ],
            currentIndex: 1,
          }),
        ),
      )
    );

    it("initialMemory creates navigation from URL", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const testUrl = "http://localhost/initial-test";
            const testState = { test: "initial-data" };
            const current = yield* Navigation.currentEntry;
            const entries = yield* Navigation.entries;

            assert.equal(current.url.href, testUrl);
            assert.deepEqual(current.state, testState);
            assert.equal(entries.length, 1);
            assert.equal(entries[0].url.href, testUrl);
          }),
          initialMemory({
            url: "http://localhost/initial-test",
            state: { test: "initial-data" },
          }),
        ),
      )
    );

    it("navigate adds new entry", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const dest = yield* Navigation.navigate("http://localhost/2");
            assert.equal(dest.url.href, "http://localhost/2");

            const current = yield* Navigation.currentEntry;
            assert.equal(current.url.href, "http://localhost/2");

            const entries = yield* Navigation.entries;
            assert.equal(entries.length, 2);
          }),
          memory({
            entries: [createDestination("http://localhost/1")],
            currentIndex: 0,
          }),
        ),
      )
    );

    it("back navigates to previous entry", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const dest = yield* Navigation.back();
            assert.equal(dest.url.href, "http://localhost/1");

            const current = yield* Navigation.currentEntry;
            assert.equal(current.url.href, "http://localhost/1");

            const canGoBack = yield* Navigation.canGoBack;
            assert.equal(canGoBack, false);
          }),
          memory({
            entries: [
              createDestination("http://localhost/1"),
              createDestination("http://localhost/2"),
            ],
            currentIndex: 1,
          }),
        ),
      )
    );

    it("forward navigates to next entry", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const dest = yield* Navigation.forward();
            assert.equal(dest.url.href, "http://localhost/2");

            const current = yield* Navigation.currentEntry;
            assert.equal(current.url.href, "http://localhost/2");

            const canGoForward = yield* Navigation.canGoForward;
            assert.equal(canGoForward, false);
          }),
          memory({
            entries: [
              createDestination("http://localhost/1"),
              createDestination("http://localhost/2"),
            ],
            currentIndex: 0,
          }),
        ),
      )
    );

    it("limits entries to maxEntries when navigating", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const maxEntries = 3;
            yield* Navigation.navigate("http://localhost/2");
            yield* Navigation.navigate("http://localhost/3");
            yield* Navigation.navigate("http://localhost/4");
            yield* Navigation.navigate("http://localhost/5");

            const entries = yield* Navigation.entries;
            assert.equal(entries.length, maxEntries);
            assert.equal(entries[0].url.href, "http://localhost/3");
            assert.equal(entries[1].url.href, "http://localhost/4");
            assert.equal(entries[2].url.href, "http://localhost/5");

            const current = yield* Navigation.currentEntry;
            assert.equal(current.url.href, "http://localhost/5");
          }),
          memory({
            entries: [createDestination("http://localhost/1")],
            currentIndex: 0,
            maxEntries: 3,
          }),
        ),
      )
    );

    it("maintains correct index when entries are limited", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const entries = yield* Navigation.entries;
            assert.equal(entries.length, 2);
            assert.equal(entries[0].url.href, "http://localhost/2");
            assert.equal(entries[1].url.href, "http://localhost/3");

            const current = yield* Navigation.currentEntry;
            assert.equal(current.url.href, "http://localhost/3");

            const index = entries.findIndex((e) => e.key === current.key);
            assert.equal(index, 1);
          }),
          memory({
            entries: [
              createDestination("http://localhost/1"),
              createDestination("http://localhost/2"),
              createDestination("http://localhost/3"),
            ],
            currentIndex: 2,
            maxEntries: 2,
          }),
        ),
      )
    );

    it("can go back after entries are limited", () =>
      Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            yield* Navigation.navigate("http://localhost/2");
            yield* Navigation.navigate("http://localhost/3");

            const canGoBack = yield* Navigation.canGoBack;
            assert.equal(canGoBack, true);

            const dest = yield* Navigation.back();
            assert.equal(dest.url.href, "http://localhost/2");
          }),
          memory({
            entries: [createDestination("http://localhost/1")],
            currentIndex: 0,
            maxEntries: 2,
          }),
        ),
      )
    );
  });
});

function mockWindow(): Window {
  const entry = {
    id: "0",
    key: "0",
    url: "https://example.com/",
    sameDocument: true,
    getState: () => ({}),
  };
  const committed = Promise.resolve(entry);
  const finished = Promise.resolve(entry);
  const navigation = {
    currentEntry: entry,
    entries: () => [entry],
    canGoBack: false,
    canGoForward: false,
    transition: null as unknown,
    addEventListener: () => {},
    removeEventListener: () => {},
    navigate: () => ({ committed, finished }),
    back: () => ({ committed, finished }),
    forward: () => ({ committed, finished }),
    traverseTo: () => ({ committed, finished }),
    updateCurrentEntry: () => {},
    reload: () => ({ committed, finished }),
  };

  let historyState: unknown = null;
  const popstateListeners: Array<() => void> = [];
  const history = {
    get state() {
      return historyState;
    },
    get length() {
      return 1;
    },
    pushState(_state: unknown, _unused: string, url: string) {
      historyState = _state;
      (mockLocation as { href: string }).href = url;
    },
    replaceState(_state: unknown, _unused: string, url: string) {
      historyState = _state;
      (mockLocation as { href: string }).href = url;
    },
    go(_delta: number) {
      popstateListeners.forEach((fn) => fn());
    },
    back() {},
    forward() {},
  };

  const mockLocation = {
    origin: "https://example.com",
    href: "https://example.com/",
    pathname: "/",
    search: "",
    hash: "",
  };

  return {
    location: mockLocation,
    document: { querySelector: () => null },
    navigation,
    history,
    addEventListener: (_type: string, listener: () => void) => {
      if (_type === "popstate") popstateListeners.push(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      if (_type === "popstate") {
        const i = popstateListeners.indexOf(listener);
        if (i !== -1) popstateListeners.splice(i, 1);
      }
    },
  } as unknown as Window;
}

function createDestination(url: string, state: unknown = {}) {
  return {
    id: crypto.randomUUID(),
    key: crypto.randomUUID(),
    url: new URL(url),
    state,
    sameDocument: true,
  };
}
