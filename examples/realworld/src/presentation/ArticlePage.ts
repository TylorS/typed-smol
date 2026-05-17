import { html } from "@typed/template";
import type { Article, Comment } from "../domain/Article.js";
import { avatarSrc } from "./Layout.js";

export const ArticlePage = (
  article: Article,
  comments: readonly Comment[],
) => html`<section class="article-page">
  <div class="banner">
    <div class="container">
      <h1>${article.title}</h1>
      <div class="article-meta">${ArticleMeta(article)}</div>
    </div>
  </div>
  <div class="container page">
    <div class="article-content"><p>${article.body}</p></div>
    <ul class="tag-list">
      ${article.tagList.map(Tag)}
    </ul>
    <hr />
    <div class="article-actions">
      <button class="btn btn-outline-primary btn-sm">
        Favorite Article (${article.favoritesCount})
      </button>
      <button class="btn btn-outline-primary btn-sm">Follow ${article.author.username}</button>
    </div>
    ${CommentForm} ${comments.map(CommentCard)}
  </div>
</section>`;

const ArticleMeta = (article: Article) => html`<a href=${`/profile/${article.author.username}`}>
  <img src=${avatarSrc(article.author.image)} />
</a>
<div class="info">
  <a class="author" href=${`/profile/${article.author.username}`}>${article.author.username}</a>
  <span class="date">${article.createdAt}</span>
</div>`;

const CommentForm = html`<form class="card comment-form">
  <div class="card-block">
    <textarea class="form-control" placeholder="Write a comment..." rows="3"></textarea>
  </div>
  <div class="card-footer">
    <button class="btn btn-sm btn-primary">Post Comment</button>
  </div>
</form>`;

const CommentCard = (comment: Comment) => html`<div class="card">
  <div class="card-block"><p class="card-text">${comment.body}</p></div>
  <div class="card-footer">
    <a class="comment-author" href=${`/profile/${comment.author.username}`}>
      <img class="comment-author-img" src=${avatarSrc(comment.author.image)} />
      ${comment.author.username}
    </a>
    <span class="mod-options"><i class="ion-trash-a"></i></span>
  </div>
</div>`;

const Tag = (tag: string) =>
  html`<li class="tag-default tag-pill tag-outline">${tag}</li>`;
