import { Data } from "effect";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

export class FormDecodeError extends Data.TaggedError("FormDecodeError")<{
  readonly reason: string;
}> {}

export const textField = (form: HTMLFormElement, name: string): string =>
  String(new FormData(form).get(name) ?? "");

export const nullableTextField = (form: HTMLFormElement, name: string): string | null => {
  const value = textField(form, name).trim();
  return value.length > 0 ? value : null;
};

export const tagListField = (form: HTMLFormElement): readonly string[] =>
  textField(form, "tagList")
    .split(/\s*,\s*|\s+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

export const decodeForm = <A>(
  schema: Schema.Decoder<A>,
  input: unknown,
): Effect.Effect<A, FormDecodeError> =>
  Effect.try({
    try: () => Schema.decodeUnknownSync(schema)(input),
    catch: (error) => new FormDecodeError({ reason: formatThrown(error) }),
  });

const formatThrown = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
