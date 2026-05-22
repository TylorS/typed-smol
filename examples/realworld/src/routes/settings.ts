import { EventHandler, html } from "@typed/template";
import * as Effect from "effect/Effect";
import { UpdateUserRequest } from "../domain/RealWorldApi.js";
import { BrowserAuth } from "../common/BrowserAuth.js";
import {
  decodeForm,
  nullableTextField,
  textField,
} from "../common/formInput.js";
import {
  formFromSubmitEvent,
  renderWorkflowFailure,
  targetForm,
} from "../common/workflowErrors.js";
import { SettingsRoute } from "../common/routes.js";

export const route = SettingsRoute;

const submitSettings = EventHandler.make(
  (event: SubmitEvent) =>
    formFromSubmitEvent(event).pipe(
      Effect.flatMap((form) =>
        updateSettings(form).pipe(Effect.catch((error) => renderWorkflowFailure(form, error))),
      ),
      Effect.asVoid,
      Effect.catch(() => Effect.void),
    ),
  { preventDefault: true },
);

const updateSettings = Effect.fn(function* (form: HTMLFormElement) {
    const input = yield* decodeForm(UpdateUserRequest, {
      user: {
        image: nullableTextField(form, "image"),
        username: textField(form, "username"),
        bio: nullableTextField(form, "bio"),
        email: textField(form, "email"),
        password: nullableTextField(form, "password") ?? undefined,
      },
    });
    const auth = yield* BrowserAuth;
    return yield* auth.updateSettings(input);
});

const logout = EventHandler.make(
  (event: MouseEvent) =>
    performLogout().pipe(
      Effect.catch((error) => renderWorkflowFailure(targetForm(event), error)),
      Effect.asVoid,
    ),
  { preventDefault: true },
);

const performLogout = Effect.fn(function* () {
  const auth = yield* BrowserAuth;
  return yield* auth.logout;
});

export const template = html`<section class="settings-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 offset-md-3 col-xs-12">
        <h1 class="text-xs-center">Your Settings</h1>
        <ul class="error-messages"></ul>
        <form onsubmit=${submitSettings}>
          <fieldset>
            <fieldset class="form-group">
              <input
                class="form-control"
                name="image"
                placeholder="URL of profile picture"
              />
            </fieldset>
            <fieldset class="form-group">
              <input class="form-control form-control-lg" name="username" placeholder="Username" />
            </fieldset>
            <fieldset class="form-group">
              <textarea
                class="form-control form-control-lg"
                name="bio"
                placeholder="Short bio about you"
                rows="8"
              ></textarea>
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
            <button class="btn btn-lg btn-primary pull-xs-right">Update Settings</button>
          </fieldset>
        </form>
        <hr />
        <button class="btn btn-outline-danger" onclick=${logout}>
          Or click here to logout.
        </button>
      </div>
    </div>
  </div>
</section>`;
