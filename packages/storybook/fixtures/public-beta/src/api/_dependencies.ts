import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export class ApiMessage extends Context.Service<
  ApiMessage,
  { readonly message: string }
>()("public-beta/ApiMessage") {}

export default Layer.succeed(ApiMessage, {
  message: "Default API dependency",
});
