import * as Schema from "effect/Schema";
import { OpaqueToken } from "./Ids.js";

export const BearerToken = OpaqueToken;
export type BearerToken = Schema.Schema.Type<typeof BearerToken>;

export const AuthHeader = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^Token [^\s]+$/)),
  Schema.brand("AuthHeader"),
);
export type AuthHeader = Schema.Schema.Type<typeof AuthHeader>;
