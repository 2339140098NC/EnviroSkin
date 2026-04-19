import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const candidates = [
  path.join(repoRoot, ".venv", "Scripts", "python.exe"),
  path.join(repoRoot, ".venv", "bin", "python"),
];

const resolved = candidates.find((p) => existsSync(p)) || "python";
console.log(`Using Python at: ${resolved}`);

const args = [
  "-m", "uvicorn",
  "agent.server:app",
  "--host", "0.0.0.0",
  "--port", "8000",
  "--reload",
];

const child = spawn(resolved, args, { cwd: repoRoot, stdio: "inherit", shell: false });

child.on("error", (err) => {
  console.error(`Failed to spawn Python (${resolved}): ${err.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
