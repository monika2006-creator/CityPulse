import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const services = [
  {
    name: "CityPulse API",
    command: process.execPath,
    args: ["src/index.js"],
    cwd: path.join(root, "server"),
  },
  {
    name: "CityPulse frontend",
    command: process.execPath,
    args: [path.join(root, "node_modules/vite/bin/vite.js")],
    cwd: root,
  },
];

const children = services.map(({ name, command, args, cwd }) => {
  console.log(`Starting ${name}…`);
  return spawn(command, args, { cwd, stdio: "inherit" });
});

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  }
}

for (const child of children) {
  child.on("error", (error) => {
    console.error(`Could not start a CityPulse service: ${error.message}`);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code ?? 1);
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
