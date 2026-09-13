import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
// Poll source files to avoid macOS file-descriptor exhaustion in large parent workspaces.
const child = spawn(
  process.execPath,
  [
    fileURLToPath(new URL("./server.mjs", import.meta.url)),
    "--dev",
    "--hostname",
    "127.0.0.1",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      WATCHPACK_POLLING: process.env.WATCHPACK_POLLING || "1000",
    },
  },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
