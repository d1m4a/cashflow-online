const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const databaseUrl = process.env.DATABASE_URL || "postgres://cashflow:cashflow@localhost:15432/cashflow_online";
const backupFile = process.argv[2];

if (!backupFile) {
  console.error("Usage: npm run db:restore -- path/to/backup.dump");
  process.exit(1);
}

const resolvedBackup = path.resolve(backupFile);
if (!fs.existsSync(resolvedBackup)) {
  console.error(`Backup file does not exist: ${resolvedBackup}`);
  process.exit(1);
}

const child = spawn("pg_restore", [
  "--clean",
  "--if-exists",
  "--no-owner",
  "--no-privileges",
  "--dbname",
  databaseUrl,
  resolvedBackup
], { stdio: "inherit" });

child.on("error", (error) => {
  console.error(`Failed to run pg_restore: ${error.message}`);
  console.error("Install PostgreSQL client tools and make sure pg_restore is available in PATH.");
  process.exitCode = 1;
});

child.on("exit", (code) => {
  if (code === 0) {
    console.log(`Backup restored from ${resolvedBackup}`);
    return;
  }
  process.exitCode = code || 1;
});
