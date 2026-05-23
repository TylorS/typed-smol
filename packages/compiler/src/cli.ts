#!/usr/bin/env node

import ts from "typescript";
import { runVmcCli } from "@typed/virtual-modules-compiler";
import { createTypedCompilerExtension } from "./vmcExtension.js";

const exitCode = runVmcCli({
  args: process.argv.slice(2),
  commandName: "@typed/compiler",
  extensions: [createTypedCompilerExtension()],
  ts,
});

if (typeof exitCode === "number") {
  process.exit(exitCode);
}
