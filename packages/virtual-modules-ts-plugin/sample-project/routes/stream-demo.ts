import { Stream } from "effect";
import * as Route from "@typed/router";

export const route = Route.Parse("stream-demo");
/** Stream-valued handler (non-function). */
export const handler = Stream.succeed("stream-demo");
