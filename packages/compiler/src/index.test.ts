import { describe, expect, it } from "vitest";
import { compilerPackageName } from "./index.js";

describe("@typed/compiler package", () => {
  it("exports the package marker", () => {
    expect(compilerPackageName).toBe("@typed/compiler");
  });
});
