import { Data } from "effect";
import * as Schema from "effect/Schema";
import { NonEmptyString } from "./Ids.js";

export const ErrorMessages = Schema.Array(NonEmptyString);
export type ErrorMessages = Schema.Schema.Type<typeof ErrorMessages>;

export const ErrorMap = Schema.Record(Schema.String, ErrorMessages);
export type ErrorMap = Schema.Schema.Type<typeof ErrorMap>;

export const ErrorResponse = Schema.Struct({
  errors: ErrorMap,
});
export type ErrorResponse = Schema.Schema.Type<typeof ErrorResponse>;

export class RealWorldError extends Data.TaggedError("RealWorldError")<{
  readonly status: number;
  readonly errors: ErrorMap;
}> {}

export const makeRealWorldError = (
  status: number,
  field: string,
  message: string,
): RealWorldError =>
  new RealWorldError({
    status,
    errors: {
      [field]: [message],
    },
  });
