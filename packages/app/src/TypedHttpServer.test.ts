import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
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

  it("generates development certificates under node_modules/.typed/certs", () => {
    const root = tempRoot();
    const ssl = resolveTypedHttpServerSsl({ projectRoot: root, ssl: true });

    expect(ssl).toEqual({
      kind: "generated",
      key: join(root, "node_modules/.typed/certs/key.pem"),
      cert: join(root, "node_modules/.typed/certs/cert.pem"),
    });
    expect(existsSync(ssl.key)).toBe(true);
    expect(existsSync(ssl.cert)).toBe(true);
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

  it("exposes a layer descriptor with mode, static assets, and SSL", () => {
    const root = tempRoot();

    expect(
      TypedHttpServer.layer({
        projectRoot: root,
        dev: false,
        buildOutDir: "dist",
        host: "127.0.0.1",
        port: 3000,
      }),
    ).toEqual({
      _tag: "TypedHttpServerLayer",
      host: "127.0.0.1",
      port: 3000,
      mode: { kind: "node" },
      staticAssetRoot: join(root, "dist/client"),
      ssl: { kind: "disabled" },
    });
  });
});
