/**
 * @typed/cli — Vite 7 CLI with server-side capabilities for typed-smol apps.
 * Commands: typed dev | typed build | typed preview | typed check | typed test | typed run
 */
export { typed } from "./commands/typed.js";
export {
  dev,
  serve,
  build,
  preview,
  check,
  test,
  lint,
  format,
  run,
  create,
} from "./commands/index.js";
