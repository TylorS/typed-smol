declare module "typed:vite-dev-server" {
  import { ViteDevServer } from "vite";
  declare const server: ViteDevServer | undefined;
  export default server;
}
