import { html } from "@typed/template";
import * as Effect from "effect/Effect";
import { CreateArticleRequest } from "../domain/RealWorldApi.js";
import { BrowserAuth } from "../presentation/BrowserAuth.js";
import { decodeForm, formSubmit, tagListField, textField } from "../presentation/FormEvents.js";
import { EditorRoute } from "../routing/Routes.js";

export const route = EditorRoute;

const createArticle = formSubmit(
  Effect.fn(function* (form: HTMLFormElement) {
    const input = yield* decodeForm(CreateArticleRequest, { article: articleForm(form) });
    const auth = yield* BrowserAuth;
    return yield* auth.createArticle(input);
  }),
);

const articleForm = (form: HTMLFormElement) => ({
  title: textField(form, "title"),
  description: textField(form, "description"),
  body: textField(form, "body"),
  tagList: tagListField(form),
});

export const template = html`<section class="editor-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-10 offset-md-1 col-xs-12">
        <h1 class="text-xs-center">Publish Article</h1>
        <ul class="error-messages"></ul>
        <form onsubmit=${createArticle}>
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
              Publish Article
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  </div>
</section>`;
