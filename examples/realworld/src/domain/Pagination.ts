import * as Schema from "effect/Schema";
import { NonNegativeInt, PositiveInt } from "./Ids.js";

export const Limit = NonNegativeInt.pipe(Schema.brand("Limit"));
export type Limit = Schema.Schema.Type<typeof Limit>;

export const Offset = NonNegativeInt.pipe(Schema.brand("Offset"));
export type Offset = Schema.Schema.Type<typeof Offset>;

export const Page = PositiveInt.pipe(Schema.brand("Page"));
export type Page = Schema.Schema.Type<typeof Page>;

export const defaultLimit = 10;

export const ListQuery = Schema.Struct({
  limit: Schema.optionalKey(Limit),
  offset: Schema.optionalKey(Offset),
});
export type ListQuery = Schema.Schema.Type<typeof ListQuery>;
