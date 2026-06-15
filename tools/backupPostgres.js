const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const databaseUrl = process.env.DATABASE_URL || "postgres://cashflow:cashflow@localhost:15432/cashflow_online";
const backupDir = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, "..", "backups"));
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputFile = path.join(backupDir, `cashflow-online-${stamp}.dump`);

fs.mkdirSync(backupDir, { recursive: true });

const child = spawn("pg_dump", [
  "--format=custom",
  "--no-owner",
  "--no-privileges",
  "--file",
  outputFile,
  databaseUrl
], { stdio: "inherit" });

child.on("error", (error) => {
  console.error(`Failed to run pg_dump: ${error.message}`);
  console.error("Install PostgreSQL client tools and make sure pg_dump is available in PATH.");
  process.exitCode = 1;
});

child.on("exit", (code) => {
  if (code === 0) {
    console.log(`Backup written to ${outputFile}`);
    return;
  }
  process.exitCode = code || 1;
});
