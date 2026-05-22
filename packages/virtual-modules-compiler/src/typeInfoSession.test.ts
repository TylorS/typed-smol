import { describe, expect, it } from "vitest";
import { createLazyTypeInfoApiSession } from "./typeInfoSession.js";

describe("createLazyTypeInfoApiSession", () => {
  it("defers preliminary program creation until a TypeInfo session is requested", () => {
    let programCount = 0;
    let sessionFactoryCount = 0;
    const session = {
      api: {} as never,
      consumeDependencies: () => [],
    };

    const createSession = createLazyTypeInfoApiSession({
      ts: {} as never,
      createProgram: () => {
        programCount += 1;
        return {} as never;
      },
      createSessionFactory: () => {
        sessionFactoryCount += 1;
        return () => session;
      },
    });

    expect(programCount).toBe(0);
    expect(sessionFactoryCount).toBe(0);
    expect(createSession({ id: "virtual:one", importer: "/src/one.ts" })).toBe(session);
    expect(createSession({ id: "virtual:two", importer: "/src/two.ts" })).toBe(session);
    expect(programCount).toBe(1);
    expect(sessionFactoryCount).toBe(1);
  });
});
