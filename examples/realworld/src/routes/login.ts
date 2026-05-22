import { EventHandler, html } from "@typed/template";
import { Link } from "@typed/ui";
import * as Router from "@typed/router";
import * as Effect from "effect/Effect";
import { LoginUserRequest } from "../domain/RealWorldApi.js";
import { BrowserAuth } from "../common/BrowserAuth.js";
import { decodeForm, textField } from "../common/formInput.js";
import { formFromSubmitEvent, renderWorkflowFailure } from "../common/workflowErrors.js";
import { LoginRoute } from "../common/routes.js";

export const route = LoginRoute;

export const submitLogin = EventHandler.make(
  (event: SubmitEvent) =>
    formFromSubmitEvent(event).pipe(
      Effect.flatMap((form) =>
        login(form).pipe(Effect.catch((error) => renderWorkflowFailure(form, error))),
      ),
      Effect.asVoid,
      Effect.catch(() => Effect.void),
    ),
  { preventDefault: true },
);

const login = Effect.fn(function* (form: HTMLFormElement) {
    const input = yield* decodeForm(LoginUserRequest, {
      user: {
        email: textField(form, "email"),
        password: textField(form, "password"),
      },
    });
    const auth = yield* BrowserAuth;
    const response = yield* auth.login(input);
    yield* Router.push("/");
    return response;
});

export const template = html`<section class="auth-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 offset-md-3 col-xs-12">
        <h1 class="text-xs-center">Sign in</h1>
        <p class="text-xs-center">${Link({ href: "/register", content: "Need an account?" })}</p>
        <ul class="error-messages"></ul>
        <form onsubmit=${submitLogin}>
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
          <button class="btn btn-lg btn-primary pull-xs-right">Sign in</button>
        </form>
      </div>
    </div>
  </div>
</section>`;
