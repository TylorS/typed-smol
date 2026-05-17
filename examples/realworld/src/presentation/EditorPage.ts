import { html } from "@typed/template";
import * as Effect from "effect/Effect";
import { CreateArticleRequest, UpdateArticleRequest } from "../domain/RealWorldApi.js";
import { BrowserAuth } from "./BrowserAuth.js";
import { decodeForm, formSubmit, tagListField, textField } from "./FormEvents.js";

export interface EditorPageInput {
  readonly slug?: string;
}

export const EditorPage = (input: EditorPageInput = {}) => {
  const slug = input.slug;
  const submit = slug == null
    ? formSubmit((form) =>
        decodeForm(CreateArticleRequest, { article: articleForm(form) }).pipe(
          Effect.flatMap((request) => BrowserAuth.use((auth) => auth.createArticle(request))),
        ))
    : formSubmit((form) =>
        decodeForm(UpdateArticleRequest, { article: articleForm(form) }).pipe(
          Effect.flatMap((request) =>
            BrowserAuth.use((auth) => auth.updateArticle(slug, request))),
        ));

  return html`<section class="editor-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-10 offset-md-1 col-xs-12">
          <h1 class="text-xs-center">${input.slug ? "Edit Article" : "Publish Article"}</h1>
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
                ${input.slug ? "Update Article" : "Publish Article"}
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </section>`;
};

const articleForm = (form: HTMLFormElement) => ({
  title: textField(form, "title"),
  description: textField(form, "description"),
  body: textField(form, "body"),
  tagList: tagListField(form),
});
