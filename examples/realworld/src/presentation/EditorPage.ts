import { html } from "@typed/template";
import { Fx, RefSubject } from "@typed/fx";
import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { CreateArticleRequest, UpdateArticleRequest } from "../domain/RealWorldApi.js";
import { BrowserAuth } from "./BrowserAuth.js";
import { decodeForm, formSubmit, tagListField, textField } from "./FormEvents.js";

export interface EditorPageInput {
  readonly slug?: RefSubject.Computed<string, never, Scope.Scope>;
}

export const EditorPage = (input: EditorPageInput = {}) => {
  const title = input.slug ? Fx.succeed("Edit Article") : "Publish Article";
  const buttonLabel = input.slug ? Fx.succeed("Update Article") : "Publish Article";
  const submit = formSubmit((form) =>
    input.slug
      ? Effect.flatMap(input.slug, (slug) => updateArticle(slug, form))
      : createArticle(form));

  return html`<section class="editor-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-10 offset-md-1 col-xs-12">
          <h1 class="text-xs-center">${title}</h1>
          <ul class="error-messages"></ul>
          <form onsubmit=${submit}>
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
              <button class="btn btn-lg pull-xs-right btn-primary">
                ${buttonLabel}
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </section>`;
};

const createArticle = (form: HTMLFormElement) =>
  decodeForm(CreateArticleRequest, { article: articleForm(form) }).pipe(
    Effect.flatMap((request) => BrowserAuth.use((auth) => auth.createArticle(request))),
  );

const updateArticle = (slug: string, form: HTMLFormElement) =>
  decodeForm(UpdateArticleRequest, { article: articleForm(form) }).pipe(
    Effect.flatMap((request) => BrowserAuth.use((auth) => auth.updateArticle(slug, request))),
  );

const articleForm = (form: HTMLFormElement) => ({
  title: textField(form, "title"),
  description: textField(form, "description"),
  body: textField(form, "body"),
  tagList: tagListField(form),
});
