import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const children = [];
const start = (name, command, args, cwd) => {
  console.log(`Starting ${name}…`);
  const child = spawn(command, args, { cwd, stdio: "inherit" });
  children.push(child);
  return child;
};

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

const main = async () => {
  const port = process.env.PORT || "8787";
  let apiIsRunning = false;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(800) });
    apiIsRunning = response.ok;
  } catch { /* start the API below */ }

  if (apiIsRunning) console.log(`Reusing CityPulse API at http://127.0.0.1:${port}.`);
  else start("CityPulse API", process.execPath, ["src/index.js"], path.join(root, "server"));
  start("CityPulse frontend", process.execPath, [path.join(root, "node_modules/vite/bin/vite.js")], root);
};

main().catch((error) => {
  console.error(`Could not start CityPulse: ${error.message}`);
  stop(1);
});
