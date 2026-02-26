/**
 * Resolves the server entry file path.
 * Precedence: 1) CLI --entry, 2) Convention (server.ts, server.js, server.mts)
 */
import { Effect, Option } from "effect";
import * as fs from "node:fs";
import * as path from "node:path";

export class ServerEntryNotFoundError extends Error {
  readonly _tag = "ServerEntryNotFoundError";
  constructor(
    message: string,
    readonly projectRoot: string,
    readonly attemptedPaths: readonly string[],
  ) {
    super(message);
    this.name = "ServerEntryNotFoundError";
  }
}

const CONVENTION_ENTRIES = ["server.ts", "server.js", "server.mts"] as const;

const fileExistsSync = (p: string): boolean => {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
};

/**
 * Resolves server entry path.
 * - CLI entry (from Option) takes precedence
 * - Falls back to convention: server.ts, server.js, server.mts at projectRoot
 */
export const resolveServerEntry = (
  cliEntry: Option.Option<string>,
  projectRoot: string,
): Effect.Effect<string, ServerEntryNotFoundError> =>
  Effect.gen(function* () {
    const fromCli = Option.getOrUndefined(cliEntry);
    if (fromCli) {
      const resolved = path.isAbsolute(fromCli)
        ? fromCli
        : path.resolve(projectRoot, fromCli);
      if (fileExistsSync(resolved)) return resolved;
      return yield* Effect.fail(
        new ServerEntryNotFoundError(
          `Server entry not found: ${resolved}`,
          projectRoot,
          [resolved],
        ),
      );
    }

    const attempted: string[] = [];
    for (const name of CONVENTION_ENTRIES) {
      const candidate = path.join(projectRoot, name);
      attempted.push(candidate);
      if (fileExistsSync(candidate)) return candidate;
    }

    return yield* Effect.fail(
      new ServerEntryNotFoundError(
        `No server entry found. Tried: ${CONVENTION_ENTRIES.join(", ")}`,
        projectRoot,
        attempted,
      ),
    );
  });
