import { Data } from "effect";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { EventHandler } from "@typed/template";

export class FormDecodeError extends Data.TaggedError("FormDecodeError")<{
  readonly reason: string;
}> {}

export class FormTargetError extends Data.TaggedError("FormTargetError")<{
  readonly reason: string;
}> {}

export const formSubmit = <A, E, R>(
  run: (form: HTMLFormElement) => Effect.Effect<A, E, R>,
) =>
  EventHandler.make(
    (event: SubmitEvent) =>
      ignoreWorkflowFailure(formFromSubmitEvent(event).pipe(Effect.flatMap(run))),
    { preventDefault: true },
  );

export const clickIntent = <A, E, R>(run: () => Effect.Effect<A, E, R>) =>
  EventHandler.make(() => ignoreWorkflowFailure(run()), { preventDefault: true });

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

const formFromSubmitEvent = (
  event: SubmitEvent,
): Effect.Effect<HTMLFormElement, FormTargetError> =>
  event.currentTarget instanceof HTMLFormElement
    ? Effect.succeed(event.currentTarget)
    : Effect.fail(new FormTargetError({ reason: "submit target is not a form" }));

const formatThrown = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const ignoreWorkflowFailure = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<void, never, R> =>
  effect.pipe(Effect.asVoid, Effect.catch(() => Effect.void));
