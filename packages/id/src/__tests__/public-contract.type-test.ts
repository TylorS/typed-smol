import type * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import type * as Layer from "effect/Layer";
import type { Cuid } from "../Cuid.js";
import { Ids } from "../Ids.js";
import type { Ksuid } from "../Ksuid.js";
import type { NanoId } from "../NanoId.js";
import type { Ulid } from "../Ulid.js";
import type { Uuid4 } from "../Uuid4.js";
import type { Uuid5, Uuid5Namespace } from "../Uuid5.js";
import type { Uuid7 } from "../Uuid7.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type _IdsCuid = Assert<Equal<typeof Ids.cuid, Effect.Effect<Cuid, never, Ids>>>;
type _IdsKsuid = Assert<
  Equal<typeof Ids.ksuid, Effect.Effect<Ksuid, Cause.IllegalArgumentError, Ids>>
>;
type _IdsNanoId = Assert<Equal<typeof Ids.nanoId, Effect.Effect<NanoId, never, Ids>>>;
type _IdsUlid = Assert<
  Equal<typeof Ids.ulid, Effect.Effect<Ulid, Cause.IllegalArgumentError, Ids>>
>;
type _IdsUuid4 = Assert<Equal<typeof Ids.uuid4, Effect.Effect<Uuid4, never, Ids>>>;
type _IdsUuid7 = Assert<
  Equal<typeof Ids.uuid7, Effect.Effect<Uuid7, Cause.IllegalArgumentError, Ids>>
>;

declare const namespace: Uuid5Namespace;
declare const name: string;

const curriedUuid5 = Ids.uuid5(namespace);
const directUuid5 = Ids.uuid5(name, namespace);

type _CurriedUuid5 = Assert<
  Equal<typeof curriedUuid5, (name: string) => Effect.Effect<Uuid5, Cause.IllegalArgumentError, Ids>>
>;
type _DirectUuid5 = Assert<
  Equal<typeof directUuid5, Effect.Effect<Uuid5, Cause.IllegalArgumentError, Ids>>
>;

type _IdsDefault = Assert<
  Equal<typeof Ids.Default, Layer.Layer<Ids | import("../DateTimes.js").DateTimes | import("../RandomValues.js").RandomValues>>
>;
type _IdsTest = Assert<
  Equal<
    ReturnType<typeof Ids.Test>,
    Layer.Layer<
      Ids | import("../DateTimes.js").DateTimes | import("../RandomValues.js").RandomValues | import("effect/testing").TestClock.TestClock,
      Cause.IllegalArgumentError
    >
  >
>;
