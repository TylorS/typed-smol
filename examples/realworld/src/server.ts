import handler, {
  AppLayer,
  renderUrl,
  ServerLayer,
  run,
} from "typed:server?routes=./routes&api=./api&html=../index.html&client=./browser.ts";

export { AppLayer, renderUrl, ServerLayer, handler, run };

export default handler;
