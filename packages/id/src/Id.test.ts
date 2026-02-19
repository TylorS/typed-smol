import * as Effect from "effect/Effect";
import { assert, describe, expect, it } from "vitest";
import * as Cuid from "./Cuid.js";
import { Ids } from "./Ids.js";
import * as Ksuid from "./Ksuid.js";
import * as NanoId from "./NanoId.js";
import * as Ulid from "./Ulid.js";
import * as Uuid4 from "./Uuid4.js";
import * as Uuid5 from "./Uuid5.js";
import * as Uuid7 from "./Uuid7.js";
import { Random } from "effect";
import { TestClock } from "effect/testing";

const run = <A, E>(effect: Effect.Effect<A, E, Ids>) =>
  Effect.runPromise(Effect.provide(effect, Ids.Test()));

describe("@typed/id", () => {
  describe("type guards", () => {
    describe("isUuid4", () => {
      it("accepts valid UUID v4", () => {
        expect(Uuid4.isUuid4("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
        expect(Uuid4.isUuid4("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      });
      it("rejects invalid formats", () => {
        expect(Uuid4.isUuid4("")).toBe(false);
        expect(Uuid4.isUuid4("not-a-uuid")).toBe(false);
        expect(Uuid4.isUuid4("f47ac10b-58cc-4372-a567-0e02b2c3d479".replace(/-/g, ""))).toBe(false);
        expect(Uuid4.isUuid4("g47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(false); // invalid hex
      });
      it("rejects UUID v5 as UUID v4", () => {
        expect(Uuid4.isUuid4("886313e1-3b8a-5372-9b90-0c9aee199e5d")).toBe(false);
      });
    });

    describe("isUuid5", () => {
      it("accepts valid UUID v5", () => {
        expect(Uuid5.isUuid5("886313e1-3b8a-5372-9b90-0c9aee199e5d")).toBe(true);
        expect(Uuid5.isUuid5("c2ee5f2e-5b2e-5f2e-8b2e-5b2e5f2e8b2e")).toBe(true);
      });
      it("rejects invalid formats", () => {
        expect(Uuid5.isUuid5("")).toBe(false);
        expect(Uuid5.isUuid5("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(false); // v4
      });
    });

    describe("isUuid7", () => {
      it("accepts valid UUID v7", () => {
        expect(Uuid7.isUuid7("018eebb4-1f2c-7c3a-8b4d-123456789abc")).toBe(true);
      });
      it("rejects invalid formats", () => {
        expect(Uuid7.isUuid7("")).toBe(false);
        expect(Uuid7.isUuid7("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(false); // v4
      });
    });

    describe("isCuid", () => {
      it("accepts valid CUID-like strings (lowercase letter + base36)", () => {
        expect(Cuid.isCuid("c1234567890abcdefghijklmn")).toBe(true);
        expect(Cuid.isCuid("a0")).toBe(true);
      });
      it("rejects invalid formats", () => {
        expect(Cuid.isCuid("")).toBe(false);
        expect(Cuid.isCuid("A123")).toBe(false); // must start with lowercase
        expect(Cuid.isCuid("1abc")).toBe(false); // must start with letter
        expect(Cuid.isCuid("c123-456")).toBe(false); // no hyphen
      });
    });

    describe("isKsuid", () => {
      it("accepts 27-char base62 strings", () => {
        assert(Ksuid.isKsuid("0123456789ABCDEFGHIJKLMNOPQ"));
        assert(Ksuid.isKsuid("000000000000000000000000000"));
      });
      it("rejects invalid formats", () => {
        expect(Ksuid.isKsuid("")).toBe(false);
        expect(Ksuid.isKsuid("short")).toBe(false);
        expect(Ksuid.isKsuid("0ujsszwN8NRYtYaMBZrYCVp4O1!")).toBe(false); // 28 chars, invalid char
      });
    });

    describe("isNanoId", () => {
      it("accepts strings with only 0-9a-zA-Z_-", () => {
        assert(NanoId.isNanoId("V1StGXR8_Z5jdHi6B-myT"));
        assert(NanoId.isNanoId("abc123"));
        assert(NanoId.isNanoId("_-_"));
      });
      it("rejects invalid characters", () => {
        expect(NanoId.isNanoId("")).toBe(false);
        expect(NanoId.isNanoId("   ")).toBe(false);
        expect(NanoId.isNanoId("!@#$%")).toBe(false);
      });
    });

    describe("isUlid", () => {
      it("accepts valid ULIDs (26 chars, Effect alphabet 0-9A-HJKMNP-TV-Z)", () => {
        expect(Ulid.isUlid("01D78XYFJ1PRM1WPBCBT3VHMNV")).toBe(true);
      });
      it("rejects invalid formats", () => {
        expect(Ulid.isUlid("")).toBe(false);
        expect(Ulid.isUlid("01ARZ3NDEKTSV4RRFFQ69G5FA")).toBe(false); // wrong length
        expect(Ulid.isUlid("01ARZ3NDEKTSV4RRFFQ69G5FAV0")).toBe(false); // wrong length
        expect(Ulid.isUlid("01ARZ3NDEKTSV4RRFFQ69G5FAI")).toBe(false); // I not in Crockford base32
      });
    });
  });

  describe("Ids service", () => {
    it("uuid4 produces valid UUID v4", async () => {
      const id = await run(Ids.uuid4);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(Uuid4.isUuid4(id)).toBe(true);
    });

    it("uuid5 produces valid UUID v5", async () => {
      const id = await run(Ids.uuid5("hello", Uuid5.Uuid5Namespace.DNS));
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(Uuid5.isUuid5(id)).toBe(true);
    });

    it("uuid5 is deterministic for same name and namespace", async () => {
      const a = await run(Ids.uuid5("test", Uuid5.Uuid5Namespace.URL));
      const b = await run(Ids.uuid5("test", Uuid5.Uuid5Namespace.URL));
      expect(a).toBe(b);
    });

    it("uuid5 differs for different names", async () => {
      const a = await run(Ids.uuid5("a", Uuid5.Uuid5Namespace.DNS));
      const b = await run(Ids.uuid5("b", Uuid5.Uuid5Namespace.DNS));
      expect(a).not.toBe(b);
    });

    it("uuid5 predefined namespaces work", async () => {
      const dns = await run(Ids.uuid5.dns("example.com"));
      const url = await run(Ids.uuid5.url("https://example.com"));
      const oid = await run(Ids.uuid5.oid("1.2.3"));
      const x500 = await run(Ids.uuid5.x500("cn=test"));
      expect(Uuid5.isUuid5(dns)).toBe(true);
      expect(Uuid5.isUuid5(url)).toBe(true);
      expect(Uuid5.isUuid5(oid)).toBe(true);
      expect(Uuid5.isUuid5(x500)).toBe(true);
      expect(new Set([dns, url, oid, x500]).size).toBe(4);
    });

    it("uuid7 produces valid UUID v7", async () => {
      const id = await run(Ids.uuid7);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(Uuid7.isUuid7(id)).toBe(true);
    });

    it("cuid produces valid CUID", async () => {
      const id = await run(Ids.cuid);
      expect(Cuid.isCuid(id)).toBe(true);
      expect(id).toMatch(/^[a-z][0-9a-z]+$/);
    });

    it("ksuid produces valid KSUID", async () => {
      const id = await run(Ids.ksuid);
      expect(Ksuid.isKsuid(id)).toBe(true);
      expect(id).toHaveLength(27);
      expect(id).toMatch(/^[0-9a-zA-Z]{27}$/);
    });

    it("nanoId produces valid NanoId", async () => {
      const id = await run(Ids.nanoId);
      expect(NanoId.isNanoId(id)).toBe(true);
      expect(id).toMatch(/^[0-9a-zA-Z_-]+$/);
      expect(id).toHaveLength(21);
    });

    it("ulid produces valid ULID", async () => {
      const id = await run(Ids.ulid);
      expect(Ulid.isUlid(id)).toBe(true);
      expect(id).toHaveLength(26);
      expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    });

    it("Ids.Test with fixed time yields deterministic time-based prefixes", async () => {
      const runFixed = <A, E>(effect: Effect.Effect<A, E, Ids>) =>
        effect.pipe(
          Effect.provide(Ids.Test({})),
          Effect.provide(TestClock.layer({})),
          Random.withSeed(42),
          Effect.runPromise,
        );

      const [ulid1, ulid2, ksuid1, ksuid2] = await runFixed(
        Effect.all([Ids.ulid, Ids.ulid, Ids.ksuid, Ids.ksuid], { concurrency: "unbounded" }),
      );
      expect(ulid1.slice(0, 10)).toBe(ulid2.slice(0, 10));
      expect(ksuid1.slice(0, 5)).toBe(ksuid2.slice(0, 5));
    });
  });

  describe("Ids.Default", () => {
    it("runs all generators with default layer", async () => {
      const program = Effect.gen(function* () {
        const ids = yield* Ids;
        const u4 = yield* ids.uuid4;
        const u5 = yield* ids.uuid5("default-test", Uuid5.Uuid5Namespace.DNS);
        const u7 = yield* ids.uuid7;
        const c = yield* ids.cuid;
        const k = yield* ids.ksuid;
        const n = yield* ids.nanoId;
        const u = yield* ids.ulid;
        return { u4, u5, u7, c, k, n, u };
      });
      const result = await Effect.runPromise(Effect.provide(program, Ids.Default));
      expect(Uuid4.isUuid4(result.u4)).toBe(true);
      expect(Uuid5.isUuid5(result.u5)).toBe(true);
      expect(Uuid7.isUuid7(result.u7)).toBe(true);
      expect(Cuid.isCuid(result.c)).toBe(true);
      expect(Ksuid.isKsuid(result.k)).toBe(true);
      expect(NanoId.isNanoId(result.n)).toBe(true);
      expect(Ulid.isUlid(result.u)).toBe(true);
    });
  });
});
