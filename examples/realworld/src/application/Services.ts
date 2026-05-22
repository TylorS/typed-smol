import { Layer } from "effect";
import { Articles } from "./Articles.js";
import { Comments } from "./Comments.js";
import { Profiles } from "./Profiles.js";
import { Tags } from "./Tags.js";
import { Users } from "./Users.js";

export { Articles } from "./Articles.js";
export { Comments } from "./Comments.js";
export { Profiles } from "./Profiles.js";
export { Tags } from "./Tags.js";
export { Users } from "./Users.js";

export const ApplicationServices = Layer.mergeAll(
  Users.Live,
  Profiles.Live,
  Articles.Live,
  Comments.Live,
  Tags.Live,
);
