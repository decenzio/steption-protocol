import { createServer } from "node:http";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    dev: { type: "boolean", default: false },
    port: { type: "string", short: "p", default: process.env.PORT || "3000" },
    hostname: { type: "string", short: "H", default: "127.0.0.1" },
  },
});
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("Invalid server port.");
process.env.NODE_ENV = values.dev ? "development" : "production";
const { default: next } = await import("next");
const app = next({
  dev: values.dev,
  hostname: values.hostname,
  port,
  turbopack: values.dev,
});
await app.prepare();
const handle = app.getRequestHandler();
const server = createServer((request, response) => {
  // Next 16 replaces Vary after Proxy runs. Preserve Accept at the final Node
  // response boundary while retaining every RSC/compression field Next adds.
  // Scope this to a single response, not a global framework/Node patch.
  const setHeader = response.setHeader.bind(response);
  response.setHeader = (name, value) => {
    if (name.toLowerCase() === "vary") {
      const fields = String(value)
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean);
      if (
        !fields.some((field) => ["accept", "*"].includes(field.toLowerCase()))
      )
        fields.push("Accept");
      return setHeader(name, fields.join(", "));
    }
    return setHeader(name, value);
  };
  response.setHeader("Vary", "Accept");
  handle(request, response).catch((error) => {
    console.error(error);
    if (!response.headersSent) {
      response.statusCode = 500;
      response.end("Internal server error");
    } else response.destroy();
  });
});
server.on("upgrade", app.getUpgradeHandler());
server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
server.listen(port, values.hostname, () =>
  console.log(
    `Steption ${values.dev ? "development" : "production"} server: http://${values.hostname}:${port}`,
  ),
);

const sockets = new Set();
server.on("connection", (socket) => {
  sockets.add(socket);
  socket.on("close", () => sockets.delete(socket));
});
let shuttingDown = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    const timeout = setTimeout(() => process.exit(1), 8000);
    timeout.unref();
    server.close();
    for (const socket of sockets) socket.destroy();
    await app.close();
    process.exit(0);
  });
