import * as Schema from "effect/Schema";
import {
  Email,
  IsoDateTimeString,
  Slug,
  TagName,
  Username,
} from "../../domain/Ids.js";
import { Password } from "../../domain/RealWorldApi.js";

export const email = Schema.decodeUnknownSync(Email);
export const isoDateTime = Schema.decodeUnknownSync(IsoDateTimeString);
export const password = Schema.decodeUnknownSync(Password);
export const slug = Schema.decodeUnknownSync(Slug);
export const tagName = Schema.decodeUnknownSync(TagName);
export const username = Schema.decodeUnknownSync(Username);
