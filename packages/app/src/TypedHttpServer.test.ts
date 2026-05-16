import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";
import { createSecureContext } from "node:tls";
import { afterEach, describe, expect, it } from "vitest";
import { NodeHttpServer } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HttpClient, HttpRouter } from "effect/unstable/http";
import {
  inferStaticAssetRoot,
  resolveTypedHttpServerMode,
  resolveTypedHttpServerSsl,
  TypedHttpServer,
} from "./index.js";

const tempDirs: string[] = [];

function tempRoot() {
  const root = mkdtempSync(join(process.cwd(), "tmp-typed-http-server-"));
  tempDirs.push(root);
  return root;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir && existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
});

describe("TypedHttpServer", () => {
  it("selects the vavite-backed dev server in dev mode", () => {
    const vaviteHandler = () => undefined;

    expect(resolveTypedHttpServerMode({ dev: true, vaviteHandler })).toEqual({
      kind: "dev",
      handler: vaviteHandler,
    });
  });

  it("selects Node HTTP mode outside dev", () => {
    expect(resolveTypedHttpServerMode({ dev: false })).toEqual({ kind: "node" });
  });

  it("infers static asset root from build output conventions", () => {
    expect(inferStaticAssetRoot({ projectRoot: "/app", buildOutDir: "dist" })).toBe(
      "/app/dist/client",
    );
  });

  it("uses configured client build output when provided", () => {
    expect(inferStaticAssetRoot({ projectRoot: "/app", clientOutDir: "public/app" })).toBe(
      "/app/public/app",
    );
  });

  it("generates parseable development certificates under node_modules/.typed/certs", () => {
    const root = tempRoot();
    const ssl = resolveTypedHttpServerSsl({ projectRoot: root, ssl: true });

    expect(ssl).toEqual({
      kind: "generated",
      key: join(root, "node_modules/.typed/certs/key.pem"),
      cert: join(root, "node_modules/.typed/certs/cert.pem"),
    });
    expect(existsSync(ssl.key)).toBe(true);
    expect(existsSync(ssl.cert)).toBe(true);
    expect(readFileSync(ssl.key, "utf8")).toContain("BEGIN PRIVATE KEY");
    expect(readFileSync(ssl.cert, "utf8")).toContain("BEGIN CERTIFICATE");
    expect(() =>
      createSecureContext({
        key: readFileSync(ssl.key),
        cert: readFileSync(ssl.cert),
      }),
    ).not.toThrow();
  });

  it("validates provided SSL certificate paths", () => {
    const root = tempRoot();
    const key = join(root, "key.pem");
    const cert = join(root, "cert.pem");
    writeFileSync(key, "key", "utf8");
    writeFileSync(cert, "cert", "utf8");

    expect(resolveTypedHttpServerSsl({ projectRoot: root, ssl: { key, cert } })).toEqual({
      kind: "provided",
      key,
      cert,
    });
  });

  it("fails clearly when provided SSL paths are missing", () => {
    const root = tempRoot();

    expect(() =>
      resolveTypedHttpServerSsl({
        projectRoot: root,
        ssl: { key: join(root, "missing-key.pem"), cert: join(root, "missing-cert.pem") },
      }),
    ).toThrow("SSL key file does not exist");
  });

  it("exposes a concrete Effect Layer for non-dev Node HTTP serving", () => {
    const root = tempRoot();

    const layer = TypedHttpServer.layer({
      projectRoot: root,
      dev: false,
      buildOutDir: "dist",
      host: "127.0.0.1",
      port: 3000,
    });

    expect(Layer.isLayer(layer)).toBe(true);
  });

  it("serves inferred static assets outside dev mode", () => {
    const root = tempRoot();
    const assetRoot = join(root, "assets/browser");
    mkdirSync(assetRoot, { recursive: true });
    writeFileSync(join(assetRoot, "hello.txt"), "hello static", "utf8");

    const live = TypedHttpServer.staticAssets({
      projectRoot: root,
      clientOutDir: "assets/browser",
      dev: false,
    }).pipe(HttpRouter.serve, Layer.provideMerge(NodeHttpServer.layerTest));

    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/hello.txt").pipe(Effect.flatMap((r) => r.text));
      expect(response).toBe("hello static");
    }).pipe(Effect.provide(live), Effect.scoped, Effect.runPromise);
  });

  it("does not mount production static assets in dev mode", () => {
    const root = tempRoot();

    expect(
      Layer.isLayer(
        TypedHttpServer.staticAssets({
          projectRoot: root,
          dev: true,
        }),
      ),
    ).toBe(true);
  });

  it("creates a node:http-compatible handler from an Effect HTTP app layer", async () => {
    const root = tempRoot();
    const assetRoot = join(root, "dist/client");
    mkdirSync(assetRoot, { recursive: true });
    writeFileSync(join(assetRoot, "asset.txt"), "from node handler", "utf8");
    const appLayer = TypedHttpServer.staticAssets({
      projectRoot: root,
      dev: false,
    });
    const nodeHandler = TypedHttpServer.toNodeHandler(appLayer);
    const server = createServer(nodeHandler);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("expected tcp server address");

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/asset.txt`);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("from node handler");
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await nodeHandler.dispose();
    }
  });
});
