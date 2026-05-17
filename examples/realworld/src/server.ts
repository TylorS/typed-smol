import { renderShell } from "./main.js";

// @ts-expect-error typed virtual module resolved by @typed/vite-plugin.
import * as Api from "api:./api";

export { Api };

export const render = (): string => renderShell();

export default render;
