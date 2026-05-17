export { renderUrl } from "./ssr.js";

import handler, {
  AppLayer,
  ServerLayer,
  run,
} from "typed:server?routes=./routes&api=./api&html=../index.html&client=./browser.ts";

export { AppLayer, ServerLayer, handler, run };

export default handler;
