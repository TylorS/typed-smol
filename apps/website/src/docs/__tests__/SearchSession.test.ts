import { describe, expect, it } from "vitest";
import type { SearchResult } from "../Search.js";
import { createSearchSession } from "../../search/SearchSession.js";

const result = { id: "fx", title: "Fx" } as SearchResult;

describe("createSearchSession", () => {
  it("invalidates an in-flight query as soon as input changes", async () => {
    let resolve!: (results: ReadonlyArray<SearchResult>) => void;
    const pending = new Promise<ReadonlyArray<SearchResult>>((done) => {
      resolve = done;
    });
    const states: Array<string> = [];
    const session = createSearchSession(
      async () => pending,
      (state) => states.push(state.status),
    );

    const first = session.query("Fx");
    session.invalidate();
    resolve([result]);
    await first;

    expect(states).toEqual(["loading"]);
  });

  it("leaves loading state for empty input and failed search", async () => {
    const states: Array<string> = [];
    const session = createSearchSession(
      async () => {
        throw new Error("offline");
      },
      (state) => states.push(state.status),
    );

    await session.query("Fx");
    await session.query("");

    expect(states).toEqual(["loading", "error", "idle"]);
  });
});
