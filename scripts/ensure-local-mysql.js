/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: ".env" });
const fs = require("fs");
const path = require("path");
const { execFileSync, spawn } = require("child_process");
const mysql = require("mysql2/promise");

function parseDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured in .env");
  }

  const url = new URL(databaseUrl);
  return {
    host: url.hostname || "127.0.0.1",
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || "root"),
    password: decodeURIComponent(url.password || ""),
    database: url.pathname.replace(/^\//, "") || "spotify_data",
  };
}

const config = parseDatabaseUrl();
const dataDir =
  process.env.MYSQL_DATA_DIR ?? path.join(process.cwd(), "mysql-data");
const logFile = process.env.MYSQL_LOG_FILE ?? path.join(dataDir, "error.log");
const mysqldPath =
  process.env.MYSQLD_PATH ??
  [
    "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe",
    "C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqld.exe",
  ].find((candidate) => fs.existsSync(candidate));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function canConnect(database) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      ...(database ? { database } : {}),
      connectTimeout: 2000,
    });
    await connection.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    if (connection) {
      await connection.end().catch(() => {});
    }
  }
}

async function startLocalMysql() {
  if (!mysqldPath) {
    throw new Error("mysqld.exe not found. Set MYSQLD_PATH in .env if needed.");
  }

  if (!fs.existsSync(path.join(dataDir, "mysql"))) {
    throw new Error(`MySQL data directory is missing at ${dataDir}`);
  }

  fs.mkdirSync(path.dirname(logFile), { recursive: true });

  const args = [
    `--datadir=${dataDir}`,
    `--port=${config.port}`,
    `--bind-address=127.0.0.1`,
    `--log-error=${logFile}`,
  ];

  if (process.platform === "win32") {
    const quotedPath = mysqldPath.replace(/'/g, "''");
    const quotedArgs = args
      .map((arg) => `'${arg.replace(/'/g, "''")}'`)
      .join(", ");

    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-WindowStyle",
        "Hidden",
        "-Command",
        `Start-Process -FilePath '${quotedPath}' -ArgumentList @(${quotedArgs}) -WindowStyle Hidden`,
      ],
      { windowsHide: true, stdio: "ignore" },
    );
    return;
  }

  const child = spawn(mysqldPath, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });

  child.unref();
}

async function waitUntilReady() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await canConnect()) {
      return;
    }
    await sleep(1000);
  }

  throw new Error(
    `MySQL did not become ready on ${config.host}:${config.port}. Check ${logFile}`,
  );
}

async function main() {
  if (await canConnect(config.database)) {
    console.log(
      `MySQL is ready on ${config.host}:${config.port}/${config.database}`,
    );
    return;
  }

  if (await canConnect()) {
    console.log(
      `MySQL server is running on ${config.host}:${config.port}, but database ${config.database} is not ready yet.`,
    );
    return;
  }

  if (!(config.host === "127.0.0.1" || config.host === "localhost")) {
    throw new Error(`Cannot auto-start remote MySQL host ${config.host}`);
  }

  console.log(
    `Starting local MySQL for ${config.database} on ${config.host}:${config.port}...`,
  );
  await startLocalMysql();
  await waitUntilReady();
  console.log(`Local MySQL is running on ${config.host}:${config.port}`);
}

main().catch((error) => {
  console.error("Failed to ensure local MySQL:", error.message);
  process.exit(1);
});
