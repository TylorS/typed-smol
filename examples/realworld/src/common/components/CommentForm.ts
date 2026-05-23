import { Fx, RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import { Button } from "@typed/ui";
import * as Effect from "effect/Effect";
import { BrowserAuth } from "../BrowserAuth.js";
import { textField } from "../formInput.js";
import { FormTargetError, formFromSubmitEvent, renderWorkflowFailure } from "../workflowErrors.js";

export const CommentForm = Fx.fn("CommentForm")(
  <E, R>(slug: RefSubject.Computed<string, E, R>) => html`<form
    class="card comment-form"
    onsubmit=${postComment(slug)}
  >
    <div class="card-block">
      <textarea
        class="form-control"
        name="body"
        placeholder="Write a comment..."
        rows="3"
      ></textarea>
    </div>
    <div class="card-footer">
      ${Button.Button({
        content: "Post Comment",
        props: { class: "btn btn-sm btn-primary" },
        type: "submit",
      })}
    </div>
  </form>`,
);

const postComment = <E, R>(slug: RefSubject.Computed<string, E, R>) =>
  EventHandler.make(
    (event: SubmitEvent) =>
      formFromSubmitEvent(event).pipe(
        Effect.flatMap((form) =>
          createComment(slug, form).pipe(
            Effect.catch((error) => renderWorkflowFailure(form, error)),
          ),
        ),
        Effect.asVoid,
        Effect.catch(() => Effect.void),
      ),
    { preventDefault: true },
  );

const createComment = Effect.fn(function* <E, R>(
  slug: RefSubject.Computed<string, E, R>,
  form: HTMLFormElement,
) {
  const currentSlug = yield* readActionValue(slug);
  const auth = yield* BrowserAuth;
  return yield* auth.createComment(currentSlug, { comment: { body: textField(form, "body") } });
});

const readActionValue = <A, E, R>(
  value: RefSubject.Computed<A, E, R>,
): Effect.Effect<A, FormTargetError, R> =>
  value.pipe(
    Effect.mapError(() => new FormTargetError({ reason: "reactive value is unavailable" })),
  );
