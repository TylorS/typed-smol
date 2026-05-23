import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export class DashboardGreeting extends Context.Service<
  DashboardGreeting,
  { readonly message: string }
>()("public-beta/DashboardGreeting") {}

export default Layer.succeed(DashboardGreeting, {
  message: "Generated route dependency",
});
