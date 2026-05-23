import { describe, expectTypeOf, it } from "vitest";
import type { TypedStoryResult } from "./types.js";

describe("TypedStoryResult", () => {
  it("does not advertise raw DOM or string results before explicit rendering support exists", () => {
    expectTypeOf<HTMLElement>().not.toExtend<TypedStoryResult>();
    expectTypeOf<DocumentFragment>().not.toExtend<TypedStoryResult>();
    expectTypeOf<string>().not.toExtend<TypedStoryResult>();
  });
});
