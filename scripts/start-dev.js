const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const distDir = ".next-dev";
const nextDir = path.join(process.cwd(), distDir);
fs.rmSync(nextDir, { recursive: true, force: true });
process.env.NEXT_DIST_DIR = distDir;

const nextCommand = process.platform === "win32" ? "next.cmd" : "next";
const child = spawn(nextCommand, ["dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error("Unable to start Next.js development server:", error.message);
  process.exit(1);
});
