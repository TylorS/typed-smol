import * as Schema from "effect/Schema";

export const UserProfile = Schema.Struct({
  name: Schema.String,
  role: Schema.Union([
    Schema.Literal("admin"),
    Schema.Literal("editor"),
    Schema.Literal("viewer"),
  ]),
});
export type UserProfile = typeof UserProfile.Type;
