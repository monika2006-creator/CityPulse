import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

for (const cwd of [root, path.join(root, "server")]) {
  console.log(`Installing dependencies in ${path.relative(root, cwd) || "project root"}…`);
  const result = spawnSync(npm, ["ci"], { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (result.error) {
    console.error(`Could not run npm ci: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("CityPulse frontend and backend dependencies are ready.");
