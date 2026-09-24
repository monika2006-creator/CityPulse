import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const children = [];
const start = (name, command, args, cwd, env = process.env) => {
  console.log(`Starting ${name}…`);
  const child = spawn(command, args, { cwd, stdio: "inherit", env });
  children.push(child);
  child.on("error", (error) => {
    console.error(`Could not start ${name}: ${error.message}`);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code ?? 1);
  });
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

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

async function supportsWeatherRoute(port) {
  try {
    // Invalid coordinates should be rejected by the current API as JSON before
    // any upstream weather request. Older running API processes return an HTML 404.
    const response = await fetch(`http://127.0.0.1:${port}/api/weather?lat=invalid&lng=0&city=Jaipur`, { signal: AbortSignal.timeout(800) });
    return response.status === 400 && (response.headers.get("content-type") || "").includes("application/json");
  } catch { return false; }
}

const main = async () => {
  const preferredPort = Number(process.env.PORT || "8787");
  let port = preferredPort;
  let apiIsCurrent = await supportsWeatherRoute(port);

  if (!apiIsCurrent) {
    // A previous CityPulse backend can answer /health but lack newer routes.
    // Avoid colliding with it; run this checkout on the next free local port.
    for (let offset = 0; offset < 20; offset += 1) {
      const candidate = preferredPort + offset;
      if (await supportsWeatherRoute(candidate)) {
        port = candidate;
        apiIsCurrent = true;
        break;
      }
      try {
        await fetch(`http://127.0.0.1:${candidate}/api/health`, { signal: AbortSignal.timeout(300) });
      } catch {
        port = candidate;
        break;
      }
    }
  }

  if (apiIsCurrent) console.log(`Reusing CityPulse API at http://127.0.0.1:${port}.`);
  else start("CityPulse API", process.execPath, ["src/index.js"], path.join(root, "server"), { ...process.env, PORT: String(port) });
  const webEnv = { ...process.env, CITYPULSE_API_PORT: String(port) };
  start("CityPulse frontend", process.execPath, [path.join(root, "node_modules/vite/bin/vite.js")], root, webEnv);
};

main().catch((error) => {
  console.error(`Could not start CityPulse: ${error.message}`);
  stop(1);
});
