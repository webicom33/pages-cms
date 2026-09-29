// Webicom: carica i segreti di .env.production in Google Secret Manager (progetto webicom-cms).
// Uso: node scripts/env-to-secrets.mjs [file]   (default: .env.production)
// Non stampa mai i valori: solo nome del segreto ed esito. I valori passano a gcloud via stdin.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const PROJECT = "webicom-cms";
const KEYS = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "CRYPTO_KEY",
  "GITHUB_APP_ID",
  "GITHUB_APP_NAME",
  "GITHUB_APP_PRIVATE_KEY",
  "GITHUB_APP_WEBHOOK_SECRET",
  "GITHUB_APP_CLIENT_ID",
  "GITHUB_APP_CLIENT_SECRET",
  "SMTP_USER",
  "SMTP_PASSWORD",
];

// Nome del segreto: GITHUB_APP_ID -> cms-github-app-id
const secretName = (key) => `cms-${key.toLowerCase().replace(/_/g, "-")}`;

function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1).replace(/\\n/g, "\n");
    } else if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
      value = value.slice(1, -1);
    }
    env[m[1]] = value;
  }
  return env;
}

const gcloud = (args, input) =>
  spawnSync("gcloud", [...args, `--project=${PROJECT}`], {
    input,
    encoding: "utf8",
    stdio: ["pipe", "ignore", "pipe"],
  });

const file = process.argv[2] || ".env.production";
const env = parseEnv(readFileSync(file, "utf8"));

const missing = KEYS.filter((k) => !env[k]);
if (missing.length) {
  console.error(`Mancano in ${file}: ${missing.join(", ")}`);
  process.exit(1);
}

let failed = 0;
for (const key of KEYS) {
  const name = secretName(key);
  const exists = gcloud(["secrets", "describe", name]).status === 0;
  const res = exists
    ? gcloud(["secrets", "versions", "add", name, "--data-file=-"], env[key])
    : gcloud(["secrets", "create", name, "--replication-policy=automatic", "--data-file=-"], env[key]);
  if (res.status === 0) {
    console.log(`ok   ${name}${exists ? " (nuova versione)" : ""}`);
  } else {
    failed++;
    console.error(`ERR  ${name}: ${(res.stderr || "").trim().split("\n").pop()}`);
  }
}
process.exit(failed ? 1 : 0);
