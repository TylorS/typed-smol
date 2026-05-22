import handler, {
  run,
} from "typed:server?routes=./routes&api=./api&html=./index.html&client=./entry.browser.ts";
import { entry } from "typed:config";
import { NODE_ENV } from "typed:env";

export default handler;
export { run };
export const serverEntry = entry;
export const mode = NODE_ENV;
