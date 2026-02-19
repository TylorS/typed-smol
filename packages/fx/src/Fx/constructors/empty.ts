import { void as void_ } from "effect/Effect";
import type { Fx } from "../Fx.js";
import { make } from "./make.js";

/**
 * An Fx that emits no values and completes immediately.
 * @since 1.0.0
 * @category constructors
 */
export const empty: Fx<never, never, never> = make<never, never, never>(() => void_);
