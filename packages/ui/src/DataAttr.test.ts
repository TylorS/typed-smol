import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as DataAttr from "./DataAttr.js";

describe("typed/ui/DataAttr", () => {
  const data = DataAttr.schema({
    open: Schema.Boolean,
    mode: Schema.Union([Schema.Literal("auto"), Schema.Literal("manual")]),
    label: Schema.optionalKey(Schema.String),
  });

  it("encodes whole .data objects into string-backed attrs", () =>
    Effect.gen(function* () {
      const encoded = yield* DataAttr.encode(data, {
        open: true,
        mode: "manual",
        label: "Menu",
      });

      expect(encoded).toEqual({ open: "true", mode: "manual", label: "Menu" });
    }).pipe(Effect.runPromise));

  it("decodes dataset records into typed values", () =>
    Effect.gen(function* () {
      const decoded = yield* DataAttr.decode(data, {
        open: "false",
        mode: "auto",
      });

      expect(decoded).toEqual({ open: false, mode: "auto" });
    }).pipe(Effect.runPromise));

  it("fails invalid values through Schema", async () => {
    const exit = await DataAttr.decode(data, {
      open: "true",
      mode: "sideways",
    }).pipe(Effect.exit, Effect.runPromise);

    expect(exit._tag).toBe("Failure");
  });
});
