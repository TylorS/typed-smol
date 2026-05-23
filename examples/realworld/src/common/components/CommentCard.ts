import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { Fx, RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import { Button, Link } from "@typed/ui";
import * as Effect from "effect/Effect";
import type { Comment } from "../../domain/Article.js";
import { safeTextPreview } from "../../domain/Markdown.js";
import { avatarSrc } from "../Layout.js";
import { BrowserAuth } from "../BrowserAuth.js";
import { FormTargetError, renderWorkflowFailure, targetForm } from "../workflowErrors.js";

export const CommentCard = Fx.fn("CommentCard")(<E, R>(input: {
  readonly slug: RefSubject.Computed<string, E, R>;
  readonly comment: RefSubjectType<Comment>;
}) => {
  const comment = RefSubject.proxy(input.comment);
  const author = RefSubject.proxy(comment.author);
  const body = RefSubject.map(comment.body, safeTextPreview);
  const profileHref = RefSubject.map(author.username, (value) => `/profile/${value}`);
  const avatar = RefSubject.map(author.image, avatarSrc);
  const displayName = RefSubject.map(author.username, safeTextPreview);

  return html`<div class="card">
    <div class="card-block">
      <p class="card-text">${body}</p>
    </div>
    <div class="card-footer">
      ${Link({
        class: "comment-author",
        href: profileHref,
        content: html`<img class="comment-author-img" src=${avatar} /> ${displayName}`,
      })}
      <span class="mod-options">
        ${Button.Button({
          content: html`<i class="ion-trash-a"></i>`,
          onclick: deleteComment(input.slug, comment.id),
          props: { class: "btn btn-sm btn-outline-danger" },
        })}
      </span>
    </div>
  </div>`;
});

const deleteComment = <A extends number, E, R>(
  slug: RefSubject.Computed<string, E, R>,
  id: RefSubject.Computed<A>,
) =>
  EventHandler.make(
    (event: MouseEvent) =>
      removeComment(slug, id).pipe(
        Effect.catch((error) => renderWorkflowFailure(targetForm(event), error)),
        Effect.asVoid,
      ),
    { preventDefault: true },
  );

const removeComment = Effect.fn(function* <A extends number, E, R>(
  slug: RefSubject.Computed<string, E, R>,
  id: RefSubject.Computed<A>,
) {
  const currentSlug = yield* readActionValue(slug);
  const commentId = yield* id;
  const auth = yield* BrowserAuth;
  return yield* auth.deleteComment(currentSlug, commentId);
});

const readActionValue = <A, E, R>(
  value: RefSubject.Computed<A, E, R>,
): Effect.Effect<A, FormTargetError, R> =>
  value.pipe(
    Effect.mapError(() => new FormTargetError({ reason: "reactive value is unavailable" })),
  );
