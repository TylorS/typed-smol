import { Data } from "effect";
import * as Effect from "effect/Effect";
import type { ErrorResponse } from "../domain/RealWorldApi.js";
import type { AuthWorkflowError } from "./State.js";
import type { FormDecodeError } from "./formInput.js";

export type WorkflowError = AuthWorkflowError | FormDecodeError | FormTargetError;

export class FormTargetError extends Data.TaggedError("FormTargetError")<{
  readonly reason: string;
}> {}

export const formFromSubmitEvent = (
  event: SubmitEvent,
): Effect.Effect<HTMLFormElement, FormTargetError> =>
  event.currentTarget instanceof HTMLFormElement
    ? Effect.succeed(event.currentTarget)
    : Effect.fail(new FormTargetError({ reason: "submit target is not a form" }));

export const targetForm = (event: MouseEvent): HTMLFormElement | null =>
  event.currentTarget instanceof HTMLElement ? event.currentTarget.closest("form") : null;

export const renderWorkflowFailure = (
  form: HTMLFormElement | null,
  error: WorkflowError,
): Effect.Effect<void> =>
  Effect.sync(() => renderFormErrors(form, workflowErrorMessages(error)));

export const workflowErrorMessages = (error: WorkflowError): readonly string[] => {
  if (isErrorResponse(error)) return formatApiErrors(error);
  if (error._tag === "AuthRequired") return ["token is missing"];
  if (error._tag === "FormDecodeError" || error._tag === "FormTargetError") {
    return ["form is invalid"];
  }
  if (error._tag === "HttpClientError") return ["network request failed"];
  if (error._tag === "SchemaError") return ["response could not be decoded"];
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
