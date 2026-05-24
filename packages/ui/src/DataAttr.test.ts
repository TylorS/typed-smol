import { assert, describe, it } from "vitest";
import { Effect, Exit } from "effect";
import * as Schema from "effect/Schema";
import * as DataAttr from "./DataAttr.js";

describe("typed/ui/DataAttr", () => {
  it("encodes and decodes boolean fields", () =>
    Effect.gen(function* () {
      const data = DataAttr.schema({ open: Schema.Boolean });
      assert.deepStrictEqual(yield* DataAttr.encode(data, { open: true }), { open: "true" });
      assert.deepStrictEqual(yield* DataAttr.decode(data, { open: "false" }), { open: false });
    }).pipe(Effect.runPromise));

  it("encodes literal union fields", () =>
    Effect.gen(function* () {
      const data = DataAttr.schema({
        placement: Schema.Literals(["top", "right", "bottom", "left"]),
      });
      assert.deepStrictEqual(yield* DataAttr.encode(data, { placement: "bottom" }), {
        placement: "bottom",
      });
      assert.deepStrictEqual(yield* DataAttr.decode(data, { placement: "top" }), {
        placement: "top",
      });
    }).pipe(Effect.runPromise));

  it("omits optional fields when undefined", () =>
    Effect.gen(function* () {
      const data = DataAttr.schema({ label: Schema.optional(Schema.String) });
      assert.deepStrictEqual(yield* DataAttr.encode(data, { label: undefined }), {});
    }).pipe(Effect.runPromise));

  it("decodes optional fields as whole data objects", () =>
    Effect.gen(function* () {
      const data = DataAttr.schema({
        open: Schema.Boolean,
        mode: Schema.Literals(["auto", "manual"]),
        label: Schema.optionalKey(Schema.String),
      });

      assert.deepStrictEqual(yield* DataAttr.decode(data, { open: "false", mode: "auto" }), {
        open: false,
        mode: "auto",
      });
    }).pipe(Effect.runPromise));

  it("encodes and decodes whole data objects", () =>
    Effect.gen(function* () {
      const data = DataAttr.schema({
        open: Schema.Boolean,
        placement: Schema.Literals(["top", "bottom"]),
      });
      assert.deepStrictEqual(yield* DataAttr.encode(data, { open: true, placement: "bottom" }), {
        open: "true",
        placement: "bottom",
      });
      assert.deepStrictEqual(yield* DataAttr.decode(data, { open: "false", placement: "top" }), {
        open: false,
        placement: "top",
      });
    }).pipe(Effect.runPromise));

  it("fails invalid decodes", () =>
    Effect.gen(function* () {
      const data = DataAttr.schema({ open: Schema.Boolean });
      const exit = yield* DataAttr.decode(data, { open: "sometimes" }).pipe(Effect.exit);
      assert.strictEqual(Exit.isFailure(exit), true);
    }).pipe(Effect.runPromise));

  it("encodes schema fields as data-* template props", () =>
    Effect.gen(function* () {
      const data = DataAttr.schema({
        open: Schema.Boolean,
        mode: Schema.Literals(["auto", "manual"]),
      });

      assert.deepStrictEqual(yield* DataAttr.props(data, { open: true, mode: "auto" }), {
        "data-open": "true",
        "data-mode": "auto",
      });
    }).pipe(Effect.runPromise));

  it("uses schema encode as the snapshot operation", () =>
    Effect.gen(function* () {
      const data = DataAttr.schema({ open: Schema.Boolean });

      assert.deepStrictEqual(yield* DataAttr.snapshot(data, { open: true }), {
        open: "true",
      });
    }).pipe(Effect.runPromise));

  it("restores decoded data fields by merging them into existing state", () => {
    assert.deepStrictEqual(
      DataAttr.restore({ id: "dialog", open: false }, { open: true }),
      { id: "dialog", open: true },
    );
  });

  it("merges encoded data attr maps while omitting undefined values", () => {
    assert.deepStrictEqual(
      DataAttr.mergeEncoded(
        { open: "true", mode: undefined },
        { component: "typed/ui/Popover", open: "false" },
      ),
      { component: "typed/ui/Popover", open: "false" },
    );
  });
});
