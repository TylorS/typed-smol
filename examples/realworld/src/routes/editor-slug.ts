import { RefSubject } from "@typed/fx";
import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import type { Route } from "@typed/router";
import { html } from "@typed/template";
import * as Effect from "effect/Effect";
import { UpdateArticleRequest } from "../domain/RealWorldApi.js";
import { BrowserAuth } from "../presentation/BrowserAuth.js";
import { decodeForm, formSubmit, tagListField, textField } from "../presentation/FormEvents.js";
import { EditorSlugRoute } from "../routing/Routes.js";

export const route = EditorSlugRoute;
export const template = (params: RefSubjectType<Route.Type<typeof route>>) => {
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
};

const updateArticle = (slug: RefSubject.Computed<string>) =>
  formSubmit(
    Effect.fn(function* (form: HTMLFormElement) {
      const currentSlug = yield* slug;
      const input = yield* decodeForm(UpdateArticleRequest, { article: articleForm(form) });
      const auth = yield* BrowserAuth;
      return yield* auth.updateArticle(currentSlug, input);
    }),
  );

const articleForm = (form: HTMLFormElement) => ({
  title: textField(form, "title"),
  description: textField(form, "description"),
  body: textField(form, "body"),
  tagList: tagListField(form),
});
