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

const formFromSubmitEvent = (event: SubmitEvent): Effect.Effect<HTMLFormElement, FormTargetError> =>
  event.currentTarget instanceof HTMLFormElement
    ? Effect.succeed(event.currentTarget)
    : Effect.fail(new FormTargetError({ reason: "submit target is not a form" }));

const formatThrown = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const workflowErrorMessages = (error: WorkflowError): readonly string[] => {
  if (isErrorResponse(error)) {
    return formatApiErrors(error);
  }

  if (error._tag === "AuthRequired") return ["token is missing"];
  if (error._tag === "FormDecodeError" || error._tag === "FormTargetError") {
    return ["form is invalid"];
  }
  if (error._tag === "HttpClientError") {
    return ["network request failed"];
  }
  if (error._tag === "SchemaError") {
    return ["response could not be decoded"];
  }

  return ["request failed"];
};

export const renderFormErrors = (
  form: HTMLFormElement | null,
  messages: readonly string[],
): void => {
  const list = form?.querySelector(".error-messages");
  if (!(list instanceof HTMLElement)) return;
  list.replaceChildren(...messages.map(errorMessageItem));
};

const renderWorkflowFailure = (form: HTMLFormElement | null, error: WorkflowError) =>
  Effect.sync(() => renderFormErrors(form, workflowErrorMessages(error)));

const targetForm = (event: MouseEvent): HTMLFormElement | null =>
  event.currentTarget instanceof HTMLElement ? event.currentTarget.closest("form") : null;

const formatApiErrors = (response: ErrorResponse): readonly string[] => {
  const errors = errorFields(response);
  const messages = Object.entries(errors).flatMap(([field, fieldErrors]) =>
    Array.isArray(fieldErrors) ? fieldErrors.map((message) => `${field} ${message}`) : [],
  );

  return messages.length > 0 ? messages : ["request failed"];
};

const isErrorResponse = (error: WorkflowError): error is ErrorResponse => "errors" in error;

const errorFields = (response: ErrorResponse) =>
  "errors" in response.errors && !Array.isArray(response.errors.errors)
    ? response.errors.errors
    : response.errors;

const errorMessageItem = (message: string): HTMLLIElement => {
  const item = document.createElement("li");
  item.textContent = message;
  return item;
};
