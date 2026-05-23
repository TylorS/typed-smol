#!/usr/bin/env node

import ts from "typescript";
import { runVmcCli } from "./runVmcCli.js";

const exitCode = runVmcCli({
  args: process.argv.slice(2),
  commandName: "vmc",
  ts,
});

if (typeof exitCode === "number") {
  process.exit(exitCode);
}
