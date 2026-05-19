import { assert, describe, it } from "vitest";
import { Effect } from "effect";
import * as Layer from "effect/Layer";
import { Fx } from "@typed/fx";
import { CurrentPath } from "@typed/navigation";
import * as Matcher from "@typed/router/Matcher";
import { TestRouter } from "@typed/router/Router";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import { BrowserAuth } from "../../presentation/BrowserAuth.js";
import type { AuthStore } from "../../presentation/State.js";
import { Email, OpaqueToken, Username } from "../../domain/Ids.js";
import type { UserResponse } from "../../domain/RealWorldApi.js";
import { template as loginTemplate } from "../../routes/login.js";
import { template as registerTemplate } from "../../routes/register.js";
import { HomeRoute, LoginRoute, RegisterRoute } from "../../routing/Routes.js";

describe("realworld auth route navigation", () => {
  it("navigates home after successful registration", () =>
    withRenderedAuthRoute("/register", (window) =>
      Effect.gen(function* () {
        const form = findForm(window);
        setInput(window, form, "username", "reader");
        setInput(window, form, "email", "reader@example.com");
        setInput(window, form, "password", "password123");

        form.dispatchEvent(
          new window.SubmitEvent("submit", { bubbles: true, cancelable: true }),
        );
        yield* Effect.sleep("50 millis");

        assert.equal(yield* CurrentPath, "/");
        assert.equal(window.document.querySelector("h1")?.textContent, "Home");
      })));

  it("navigates home after successful login", () =>
    withRenderedAuthRoute("/login", (window) =>
      Effect.gen(function* () {
        const form = findForm(window);
        setInput(window, form, "email", "reader@example.com");
        setInput(window, form, "password", "password123");

        form.dispatchEvent(
          new window.SubmitEvent("submit", { bubbles: true, cancelable: true }),
        );
        yield* Effect.sleep("50 millis");

        assert.equal(yield* CurrentPath, "/");
        assert.equal(window.document.querySelector("h1")?.textContent, "Home");
      })));
});

const withRenderedAuthRoute = (
  path: string,
  test: (window: Window) => Effect.Effect<void, never, BrowserAuth>,
) => {
  const window = new Window({ url: `http://localhost${path}` });
  const layer = DomRenderTemplate.using(window.document).pipe(
    Layer.merge(TestRouter({ url: `http://localhost${path}` })),
  );
  const routes = Matcher.empty
    .match(RegisterRoute, registerTemplate)
    .match(LoginRoute, loginTemplate)
    .match(HomeRoute, html`<h1>Home</h1>`);

  return Effect.gen(function* () {
    yield* installFormGlobals(window);
    yield* Fx.observe(render(routes, window.document.body), () => Effect.void).pipe(
      Effect.forkScoped,
    );
    yield* Effect.sleep("50 millis");
    yield* test(window);
  }).pipe(
    Effect.provideService(BrowserAuth, authStore),
    Effect.provide(layer),
    Effect.scoped,
    Effect.runPromise,
  );
};

const userResponse: UserResponse = {
  user: {
    email: Email.make("reader@example.com"),
    token: OpaqueToken.make("token-reader"),
    username: Username.make("reader"),
    bio: null,
    image: null,
  },
};

const unexpected = (name: string) => Effect.dieMessage(`Unexpected auth workflow: ${name}`);

const authStore: AuthStore = {
  createArticle: () => unexpected("createArticle"),
  createComment: () => unexpected("createComment"),
  deleteArticle: () => unexpected("deleteArticle"),
  deleteComment: () => unexpected("deleteComment"),
  favoriteArticle: () => unexpected("favoriteArticle"),
  followProfile: () => unexpected("followProfile"),
  initialize: Effect.void,
  login: () => Effect.succeed(userResponse),
  logout: Effect.void,
  register: () => Effect.succeed(userResponse),
  updateArticle: () => unexpected("updateArticle"),
  updateSettings: () => unexpected("updateSettings"),
  getToken: Effect.succeed(userResponse.user.token),
  getAuthState: Effect.succeed("authenticated"),
  getCurrentUser: Effect.succeed(userResponse.user),
};

const findForm = (window: Window): HTMLFormElement => {
  const form = window.document.querySelector("form");
  assert(form instanceof window.HTMLFormElement);
  return form;
};

const setInput = (window: Window, form: HTMLFormElement, name: string, value: string): void => {
  const input = form.elements.namedItem(name);
  assert(input instanceof window.HTMLInputElement);
  input.value = value;
};

const installFormGlobals = (window: Window) =>
  Effect.acquireRelease(
    Effect.sync(() => {
      const previous = {
        FormData: Reflect.get(globalThis, "FormData"),
        HTMLFormElement: Reflect.get(globalThis, "HTMLFormElement"),
      };
      Reflect.set(globalThis, "FormData", window.FormData);
      Reflect.set(globalThis, "HTMLFormElement", window.HTMLFormElement);
      return previous;
    }),
    (previous) =>
      Effect.sync(() => {
        Reflect.set(globalThis, "FormData", previous.FormData);
        Reflect.set(globalThis, "HTMLFormElement", previous.HTMLFormElement);
      }),
  );
