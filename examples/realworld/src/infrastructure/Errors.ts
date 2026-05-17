import { Data } from "effect";

export class FileSystemError extends Data.TaggedError("FileSystemError")<{
  readonly operation: "mkdir" | "rm";
  readonly path: string;
  readonly reason: string;
}> {}

export const formatThrown = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);
