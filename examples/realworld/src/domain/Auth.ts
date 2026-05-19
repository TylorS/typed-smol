import { Option } from "effect";
import * as Schema from "effect/Schema";
import { OpaqueToken } from "./Ids.js";

export const BearerToken = OpaqueToken;
export type BearerToken = Schema.Schema.Type<typeof BearerToken>;

export const AuthHeader = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^Token [^\s]+$/)),
  Schema.brand("AuthHeader"),
);
export type AuthHeader = Schema.Schema.Type<typeof AuthHeader>;

export const parseAuthorizationHeader = (
  header: string | null | undefined,
): Option.Option<BearerToken> => {
  const match = /^Token ([^\s]+)$/.exec(header ?? "");
  if (!match) return Option.none();
  return Schema.decodeOption(BearerToken)(match[1]);
};
