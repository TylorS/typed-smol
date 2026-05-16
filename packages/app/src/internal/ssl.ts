import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { createSecureContext } from "node:tls";

export type TypedHttpServerSslInput =
  | boolean
  | {
      readonly key: string;
      readonly cert: string;
    };

export type TypedHttpServerSsl =
  | { readonly kind: "disabled" }
  | { readonly kind: "generated"; readonly key: string; readonly cert: string }
  | { readonly kind: "provided"; readonly key: string; readonly cert: string };

export interface ResolveTypedHttpServerSslOptions {
  readonly projectRoot: string;
  readonly ssl?: TypedHttpServerSslInput;
}

export function resolveTypedHttpServerSsl(
  options: ResolveTypedHttpServerSslOptions,
): TypedHttpServerSsl {
  if (!options.ssl) return { kind: "disabled" };
  if (options.ssl === true) return ensureGeneratedCerts(options.projectRoot);
  if (!existsSync(options.ssl.key)) throw new Error(`SSL key file does not exist: ${options.ssl.key}`);
  if (!existsSync(options.ssl.cert)) {
    throw new Error(`SSL certificate file does not exist: ${options.ssl.cert}`);
  }
  return { kind: "provided", key: options.ssl.key, cert: options.ssl.cert };
}

function ensureGeneratedCerts(projectRoot: string): TypedHttpServerSsl {
  const certDir = join(projectRoot, "node_modules/.typed/certs");
  const key = join(certDir, "key.pem");
  const cert = join(certDir, "cert.pem");
  mkdirSync(certDir, { recursive: true });
  if (!certPairIsValid(key, cert)) generateSelfSignedCert({ key, cert });
  return { kind: "generated", key, cert };
}

function certPairIsValid(key: string, cert: string): boolean {
  if (!existsSync(key) || !existsSync(cert)) return false;
  try {
    createSecureContext({ key: readFileSync(key), cert: readFileSync(cert) });
    return true;
  } catch {
    return false;
  }
}

function generateSelfSignedCert(paths: { readonly key: string; readonly cert: string }): void {
  rmSync(paths.key, { force: true });
  rmSync(paths.cert, { force: true });
  const result = spawnSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-sha256",
      "-nodes",
      "-keyout",
      paths.key,
      "-out",
      paths.cert,
      "-days",
      "365",
      "-subj",
      "/CN=localhost",
      "-addext",
      "subjectAltName=DNS:localhost,IP:127.0.0.1",
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0 || !certPairIsValid(paths.key, paths.cert)) {
    throw new Error(
      `Failed to generate development SSL certificate with openssl: ${result.stderr || result.stdout}`,
    );
  }
}
