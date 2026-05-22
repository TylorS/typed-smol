import * as Schema from "effect/Schema";
import { Article, ArticleFilter, ArticlePreview, Comment } from "./Article.js";
import { ErrorResponse } from "./Errors.js";
import { Email, NonEmptyString, OpaqueToken, Slug, TagName, Username } from "./Ids.js";
import { ListQuery } from "./Pagination.js";
import { Profile, UserResponseUser } from "./User.js";

export { ErrorResponse };

export const Password = NonEmptyString.pipe(Schema.brand("Password"));
export type Password = Schema.Schema.Type<typeof Password>;

export const UserResponse = Schema.Struct({
  user: UserResponseUser,
});
export type UserResponse = Schema.Schema.Type<typeof UserResponse>;

export const ProfileResponse = Schema.Struct({
  profile: Profile,
});
export type ProfileResponse = Schema.Schema.Type<typeof ProfileResponse>;

export const SingleArticleResponse = Schema.Struct({
  article: Article,
});
export type SingleArticleResponse = Schema.Schema.Type<typeof SingleArticleResponse>;

export const MultipleArticlesResponse = Schema.Struct({
  articles: Schema.Array(ArticlePreview),
  articlesCount: Schema.Number.pipe(Schema.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0))),
});
export type MultipleArticlesResponse = Schema.Schema.Type<typeof MultipleArticlesResponse>;

export const SingleCommentResponse = Schema.Struct({
  comment: Comment,
});
export type SingleCommentResponse = Schema.Schema.Type<typeof SingleCommentResponse>;

export const MultipleCommentsResponse = Schema.Struct({
  comments: Schema.Array(Comment),
});
export type MultipleCommentsResponse = Schema.Schema.Type<typeof MultipleCommentsResponse>;

export const TagsResponse = Schema.Struct({
  tags: Schema.Array(TagName),
});
export type TagsResponse = Schema.Schema.Type<typeof TagsResponse>;

export const RegisterUserRequest = Schema.Struct({
  user: Schema.Struct({
    username: Username,
    email: Email,
    password: Password,
  }),
});
export type RegisterUserRequest = Schema.Schema.Type<typeof RegisterUserRequest>;

export const LoginUserRequest = Schema.Struct({
  user: Schema.Struct({
    email: Email,
    password: Password,
  }),
});
export type LoginUserRequest = Schema.Schema.Type<typeof LoginUserRequest>;

export const UpdateUserRequest = Schema.Struct({
  user: Schema.Struct({
    email: Schema.optionalKey(Email),
    username: Schema.optionalKey(Username),
    password: Schema.optionalKey(Password),
    bio: Schema.optionalKey(Schema.NullOr(Schema.String)),
    image: Schema.optionalKey(Schema.NullOr(Schema.String)),
  }),
});
export type UpdateUserRequest = Schema.Schema.Type<typeof UpdateUserRequest>;

export const CreateArticleRequest = Schema.Struct({
  article: Schema.Struct({
    title: NonEmptyString,
    description: Schema.String,
    body: NonEmptyString,
    tagList: Schema.optionalKey(Schema.Array(TagName)),
  }),
});
export type CreateArticleRequest = Schema.Schema.Type<typeof CreateArticleRequest>;

export const UpdateArticleRequest = Schema.Struct({
  article: Schema.Struct({
    title: Schema.optionalKey(NonEmptyString),
    description: Schema.optionalKey(Schema.String),
    body: Schema.optionalKey(NonEmptyString),
    tagList: Schema.optionalKey(Schema.Array(TagName)),
  }),
});
export type UpdateArticleRequest = Schema.Schema.Type<typeof UpdateArticleRequest>;

export const CreateCommentRequest = Schema.Struct({
  comment: Schema.Struct({
    body: NonEmptyString,
  }),
});
export type CreateCommentRequest = Schema.Schema.Type<typeof CreateCommentRequest>;

export const ArticleListQuery = Schema.Struct({
  ...ArticleFilter.fields,
  ...ListQuery.fields,
});
export type ArticleListQuery = Schema.Schema.Type<typeof ArticleListQuery>;

export const FeedQuery = ListQuery;
export type FeedQuery = Schema.Schema.Type<typeof FeedQuery>;

export const SlugPath = Schema.Struct({
  slug: Slug,
});
export type SlugPath = Schema.Schema.Type<typeof SlugPath>;

export const TokenStorage = Schema.Struct({
  jwtToken: Schema.optionalKey(OpaqueToken),
});
export type TokenStorage = Schema.Schema.Type<typeof TokenStorage>;
