declare module "typed:vite-dev-server" {
  const server: { httpServer?: import("node:http").Server } | undefined;
  export default server;
}
