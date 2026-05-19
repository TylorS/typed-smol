import { html } from "@typed/template";
import { Link } from "@typed/ui";
import * as Router from "@typed/router";
import * as Effect from "effect/Effect";
import { RegisterUserRequest } from "../domain/RealWorldApi.js";
import { BrowserAuth } from "../presentation/BrowserAuth.js";
import { decodeForm, formSubmit, textField } from "../presentation/FormEvents.js";
import { RegisterRoute } from "../routing/Routes.js";

export const route = RegisterRoute;

export const submitRegister = formSubmit(
  Effect.fn(function* (form: HTMLFormElement) {
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
  }),
);

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
          <button class="btn btn-lg btn-primary pull-xs-right">Sign up</button>
        </form>
      </div>
    </div>
  </div>
</section>`;
