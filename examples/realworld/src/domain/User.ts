import * as Schema from "effect/Schema";
import { Email, IsoDateTimeString, OpaqueToken, UserId, Username } from "./Ids.js";

export const NullableProfileField = Schema.NullOr(Schema.String);
export type NullableProfileField = Schema.Schema.Type<typeof NullableProfileField>;

export const PublicUser = Schema.Struct({
  username: Username,
  bio: NullableProfileField,
  image: NullableProfileField,
});
export type PublicUser = Schema.Schema.Type<typeof PublicUser>;

export const Profile = Schema.Struct({
  ...PublicUser.fields,
  following: Schema.Boolean,
});
export type Profile = Schema.Schema.Type<typeof Profile>;

export const User = Schema.Struct({
  id: UserId,
  username: Username,
  email: Email,
  bio: NullableProfileField,
  image: NullableProfileField,
  createdAt: IsoDateTimeString,
  updatedAt: IsoDateTimeString,
});
export type User = Schema.Schema.Type<typeof User>;

export const UserResponseUser = Schema.Struct({
  email: Email,
  token: OpaqueToken,
  username: Username,
  bio: NullableProfileField,
  image: NullableProfileField,
});
export type UserResponseUser = Schema.Schema.Type<typeof UserResponseUser>;

export const Session = Schema.Struct({
  id: OpaqueToken,
  userId: UserId,
  token: OpaqueToken,
  createdAt: IsoDateTimeString,
  lastSeenAt: IsoDateTimeString,
});
export type Session = Schema.Schema.Type<typeof Session>;

export const normalizeNullableProfileField = (
  value: string | null | undefined,
): string | null => {
  if (value == null) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};
