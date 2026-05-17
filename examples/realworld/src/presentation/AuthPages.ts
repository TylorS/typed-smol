import { html } from "@typed/template";
import * as Effect from "effect/Effect";
import { LoginUserRequest, RegisterUserRequest } from "../domain/RealWorldApi.js";
import { BrowserAuth } from "./BrowserAuth.js";
import { decodeForm, formSubmit, textField } from "./FormEvents.js";

const submitLogin = formSubmit((form) =>
  decodeForm(LoginUserRequest, {
    user: {
      email: textField(form, "email"),
      password: textField(form, "password"),
    },
  }).pipe(Effect.flatMap((input) => BrowserAuth.use((auth) => auth.login(input)))),
);

const submitRegister = formSubmit((form) =>
  decodeForm(RegisterUserRequest, {
    user: {
      username: textField(form, "username"),
      email: textField(form, "email"),
      password: textField(form, "password"),
    },
  }).pipe(
    Effect.flatMap((input) => BrowserAuth.use((auth) => auth.register(input))),
  ),
);

export const LoginPage = html`<section class="auth-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 offset-md-3 col-xs-12">
        <h1 class="text-xs-center">Sign in</h1>
        <p class="text-xs-center"><a href="/register">Need an account?</a></p>
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

export const RegisterPage = html`<section class="auth-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 offset-md-3 col-xs-12">
        <h1 class="text-xs-center">Sign up</h1>
        <p class="text-xs-center"><a href="/login">Have an account?</a></p>
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
