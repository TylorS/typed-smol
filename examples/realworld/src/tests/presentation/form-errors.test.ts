// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { FormDecodeError } from "../../common/formInput.js";
import { renderFormErrors, workflowErrorMessages } from "../../common/workflowErrors.js";

describe("realworld browser form errors", () => {
  it("formats RealWorld API error envelopes for visible form messages", () => {
    expect(workflowErrorMessages({
      _tag: "HttpStatus",
      status: 422,
      errors: { errors: { email: ["can't be blank"], password: ["is too short"] } },
    })).toEqual(["email can't be blank", "password is too short"]);
  });

  it("formats auth, network, decode, and form decoding failures", () => {
    expect(workflowErrorMessages({ _tag: "AuthRequired" })).toEqual(["token is missing"]);
    expect(workflowErrorMessages({ _tag: "HttpClientError" })).toEqual([
      "network request failed",
    ]);
    expect(workflowErrorMessages({ _tag: "SchemaError" })).toEqual([
      "response could not be decoded",
    ]);
    expect(workflowErrorMessages(new FormDecodeError({ reason: "Expected string" }))).toEqual([
      "form is invalid",
    ]);
  });

  it("renders messages into the nearest error-messages list as text nodes", () => {
    const form = document.createElement("form");
    const errors = document.createElement("ul");
    errors.className = "error-messages";
    form.append(errors);

    renderFormErrors(form, ["email can't be blank", "password is too short"]);

    expect([...errors.querySelectorAll("li")].map((node) => node.textContent)).toEqual([
      "email can't be blank",
      "password is too short",
    ]);
  });
});
