import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as FormData from "./FormData.js";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

describe("FormData", () => {
  it("decodes nested form values through Schema", async () => {
    const Request = Schema.Struct({
      article: Schema.Struct({
        title: Schema.NonEmptyString,
        description: Schema.String,
        tagList: Schema.Array(Schema.String),
      }),
    });
    const codec = FormData.schema(
      Request,
      FormData.struct({
        article: FormData.struct({
          title: FormData.text("title"),
          description: FormData.text("description"),
          tagList: FormData.split("tagList"),
        }),
      }),
    );
    type _codec = Expect<
      Equals<
        FormData.Type<typeof codec>,
        {
          readonly article: {
            readonly title: string;
            readonly description: string;
            readonly tagList: readonly string[];
          };
        }
      >
    >;

    const source = new globalThis.FormData();
    source.set("title", "Build Typed");
    source.set("description", "Keep forms boring");
    source.set("tagList", "typed, forms schema");

    await expect(Effect.runPromise(FormData.decode(codec, source))).resolves.toEqual({
      article: {
        title: "Build Typed",
        description: "Keep forms boring",
        tagList: ["typed", "forms", "schema"],
      },
    });
  });

  it("normalizes empty text fields without requiring app-local helpers", async () => {
    const codec = FormData.struct({
      bio: FormData.nullableText("bio"),
      password: FormData.optionalText("password"),
    });
    const source = new globalThis.FormData();
    source.set("bio", "  ");
    source.set("password", "");

    await expect(Effect.runPromise(FormData.decode(codec, source))).resolves.toEqual({
      bio: null,
      password: undefined,
    });
  });
});
