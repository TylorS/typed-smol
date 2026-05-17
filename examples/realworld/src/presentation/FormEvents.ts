import { Data } from "effect";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { EventHandler } from "@typed/template";
import type { ErrorResponse } from "../domain/RealWorldApi.js";
import type { AuthWorkflowError } from "./State.js";

export type WorkflowError = AuthWorkflowError | FormDecodeError | FormTargetError;

export class FormDecodeError extends Data.TaggedError("FormDecodeError")<{
  readonly reason: string;
}> {}

export class FormTargetError extends Data.TaggedError("FormTargetError")<{
  readonly reason: string;
}> {}

export const formSubmit = <A, E extends WorkflowError, R>(
  run: (form: HTMLFormElement) => Effect.Effect<A, E, R>,
) =>
  EventHandler.make(
    (event: SubmitEvent) =>
      formFromSubmitEvent(event).pipe(
        Effect.flatMap((form) =>
          run(form).pipe(Effect.catch((error) => renderWorkflowFailure(form, error))),
        ),
        Effect.asVoid,
        Effect.catch(() => Effect.void),
      ),
    { preventDefault: true },
  );

export const clickIntent = <A, E extends WorkflowError, R>(run: () => Effect.Effect<A, E, R>) =>
  EventHandler.make(
    (event: MouseEvent) =>
      run().pipe(
        Effect.catch((error) => renderWorkflowFailure(targetForm(event), error)),
        Effect.asVoid,
      ),
    { preventDefault: true },
  );

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

export const workflowErrorMessages = (
  error: WorkflowError,
): readonly string[] => {
  switch (error._tag) {
    case "AuthRequired":
      return ["token is missing"];
    case "Decode":
      return ["response could not be decoded"];
    case "FormDecodeError":
    case "FormTargetError":
      return ["form is invalid"];
    case "HttpStatus":
      return formatApiErrors(error.errors);
    case "Network":
      return ["network request failed"];
  }
};

export const renderFormErrors = (
  form: HTMLFormElement | null,
  messages: readonly string[],
): void => {
  const list = form?.querySelector(".error-messages");
  if (!(list instanceof HTMLElement)) return;
  list.replaceChildren(...messages.map(errorMessageItem));
};

const renderWorkflowFailure = (
  form: HTMLFormElement | null,
  error: WorkflowError,
) =>
  Effect.sync(() => renderFormErrors(form, workflowErrorMessages(error)));

const targetForm = (event: MouseEvent): HTMLFormElement | null =>
  event.currentTarget instanceof HTMLElement ? event.currentTarget.closest("form") : null;

const formatApiErrors = (response: ErrorResponse | null): readonly string[] => {
  if (response == null) return ["request failed"];

  const messages = Object.entries(response.errors).flatMap(([field, errors]) =>
    errors.map((message) => `${field} ${message}`));

  return messages.length > 0 ? messages : ["request failed"];
};

const errorMessageItem = (message: string): HTMLLIElement => {
  const item = document.createElement("li");
  item.textContent = message;
  return item;
};
