import { EventHandler, html } from "@typed/template";
import { Button, Link } from "@typed/ui";
import * as Router from "@typed/router";
import * as Effect from "effect/Effect";
import { RegisterUserRequest } from "../domain/RealWorldApi.js";
import { BrowserAuth } from "../common/BrowserAuth.js";
import { decodeForm, textField } from "../common/formInput.js";
import { formFromSubmitEvent, renderWorkflowFailure } from "../common/workflowErrors.js";
import { RegisterRoute } from "../common/routes.js";

export const route = RegisterRoute;

export const submitRegister = EventHandler.make(
  (event: SubmitEvent) =>
    formFromSubmitEvent(event).pipe(
      Effect.flatMap((form) =>
        register(form).pipe(Effect.catch((error) => renderWorkflowFailure(form, error))),
      ),
      Effect.asVoid,
      Effect.catch(() => Effect.void),
    ),
  { preventDefault: true },
);

const register = Effect.fn(function* (form: HTMLFormElement) {
  const input = yield* decodeForm(RegisterUserRequest, {
    user: {
      username: textField(form, "username"),
      email: textField(form, "email"),
      password: textField(form, "password"),
    },
  });
  const auth = yield* BrowserAuth;
  const response = yield* auth.register(input);
  yield* Router.push("/");
  return response;
});

export const template = html`<section class="auth-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 offset-md-3 col-xs-12">
        <h1 class="text-xs-center">Sign up</h1>
        <p class="text-xs-center">${Link({ href: "/login", content: "Have an account?" })}</p>
        <ul class="error-messages"></ul>
        <form onsubmit=${submitRegister}>
          <fieldset class="form-group">
            <input class="form-control form-control-lg" name="username" placeholder="Username" />
          </fieldset>
          <fieldset class="form-group">
            <input class="form-control form-control-lg" name="email" placeholder="Email" />
          </fieldset>
          <fieldset class="form-group">
            <input
              class="form-control form-control-lg"
              name="password"
              placeholder="Password"
              type="password"
            />
          </fieldset>
          ${Button.Button({
            content: "Sign up",
            props: { class: "btn btn-lg btn-primary pull-xs-right" },
            type: "submit",
          })}
        </form>
      </div>
    </div>
  </div>
</section>`;
