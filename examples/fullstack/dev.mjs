import { createServer } from "vite";

const vite = await createServer({
  root: import.meta.dirname,
  appType: "custom",
  server: {
    middlewareMode: true,
    preTransformRequests: false,
  },
});
const { runServer } = await vite.ssrLoadModule("/src/server.ts");
const portIndex = process.argv.indexOf("--port");
const port = portIndex === -1 ? 3000 : Number(process.argv[portIndex + 1]);

runServer({ port, vite });
