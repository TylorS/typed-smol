// oxlint-disable require-yield
import { Fx, RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import * as Effect from "effect/Effect";
import { UpdateArticleRequest } from "../domain/RealWorldApi.js";
import { BrowserAuth } from "../common/BrowserAuth.js";
import { decodeForm, tagListField, textField } from "../common/formInput.js";
import { formFromSubmitEvent, renderWorkflowFailure } from "../common/workflowErrors.js";
import { EditorSlugRoute } from "../common/routes.js";
import type { Handler } from "./$route-types";

export const route = EditorSlugRoute;
export const template = Fx.fn("EditorSlug")(function* (params) {
  const { slug } = RefSubject.proxy(params);

  return html`<section class="editor-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-10 offset-md-1 col-xs-12">
          <h1 class="text-xs-center">Edit Article</h1>
          <ul class="error-messages"></ul>
          <form onsubmit=${updateArticle(slug)}>
            <fieldset>
              <fieldset class="form-group">
                <input
                  class="form-control form-control-lg"
                  name="title"
                  placeholder="Article Title"
                />
              </fieldset>
              <fieldset class="form-group">
                <input
                  class="form-control"
                  name="description"
                  placeholder="What's this article about?"
                />
              </fieldset>
              <fieldset class="form-group">
                <textarea
                  class="form-control"
                  name="body"
                  placeholder="Write your article (in markdown)"
                  rows="8"
                ></textarea>
              </fieldset>
              <fieldset class="form-group">
                <input class="form-control" name="tagList" placeholder="Enter tags" />
              </fieldset>
              <button class="btn btn-lg pull-xs-right btn-primary">Update Article</button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </section>`;
}) satisfies Handler;

const updateArticle = (slug: RefSubject.Computed<string>) =>
  EventHandler.make(
    (event: SubmitEvent) =>
      formFromSubmitEvent(event).pipe(
        Effect.flatMap((form) =>
          updateArticleFromForm(slug, form).pipe(
            Effect.catch((error) => renderWorkflowFailure(form, error)),
          ),
        ),
        Effect.asVoid,
        Effect.catch(() => Effect.void),
      ),
    { preventDefault: true },
  );

const updateArticleFromForm = Effect.fn(function* (
  slug: RefSubject.Computed<string>,
  form: HTMLFormElement,
) {
  const currentSlug = yield* slug;
  const input = yield* decodeForm(UpdateArticleRequest, { article: articleForm(form) });
  const auth = yield* BrowserAuth;
  return yield* auth.updateArticle(currentSlug, input);
});

const articleForm = (form: HTMLFormElement) => ({
  title: textField(form, "title"),
  description: textField(form, "description"),
  body: textField(form, "body"),
  tagList: tagListField(form),
});
