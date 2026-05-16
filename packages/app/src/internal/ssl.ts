import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
  if (!existsSync(key)) writeFileSync(key, DEV_KEY, "utf8");
  if (!existsSync(cert)) writeFileSync(cert, DEV_CERT, "utf8");
  return { kind: "generated", key, cert };
}

const DEV_KEY = [
  "-----BEGIN PRIVATE KEY-----",
  "typed-dev-placeholder-key",
  "-----END PRIVATE KEY-----",
  "",
].join("\n");

const DEV_CERT = [
  "-----BEGIN CERTIFICATE-----",
  "typed-dev-placeholder-cert",
  "-----END CERTIFICATE-----",
  "",
].join("\n");
