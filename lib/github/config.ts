import { existsSync, readFileSync } from "node:fs";

function normalizePrivateKey(key: string): string {
  let normalized = key.trim();

  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    normalized = normalized.slice(1, -1);
  }

  if (normalized.includes("\\n")) {
    normalized = normalized.replace(/\\n/g, "\n");
  }

  return normalized;
}

function loadPrivateKeyFromEnv(): string | undefined {
  const keyPath = process.env.GITHUB_PRIVATE_KEY_PATH?.trim();
  if (keyPath) {
    if (!existsSync(keyPath)) {
      throw new Error(
        `GITHUB_PRIVATE_KEY_PATH file not found: ${keyPath}. Check the path — downloaded keys usually end in .pem`,
      );
    }

    return readFileSync(keyPath, "utf8");
  }

  return process.env.GITHUB_PRIVATE_KEY?.trim();
}

function validatePrivateKey(privateKey: string): void {
  const looksLikePem =
    privateKey.includes("BEGIN") && privateKey.includes("PRIVATE KEY");

  if (looksLikePem) {
    return;
  }

  if (privateKey.startsWith("SHA256:")) {
    throw new Error(
      "GITHUB_PRIVATE_KEY is set to a SHA256 fingerprint. Download the PEM private key from GitHub App settings → Private keys → Generate a private key.",
    );
  }

  throw new Error(
    "GITHUB_PRIVATE_KEY must be a PEM private key. Download it from GitHub App settings → Private keys, or set GITHUB_PRIVATE_KEY_PATH to the .pem file path.",
  );
}

export interface GitHubAppCredentials {
  appId: number;
  privateKey: string;
}

export function getGitHubAppCredentials(): GitHubAppCredentials | null {
  const appIdRaw = process.env.GITHUB_APP_ID?.trim();
  const privateKeyRaw = loadPrivateKeyFromEnv();

  if (!appIdRaw || !privateKeyRaw) {
    return null;
  }

  const appId = Number(appIdRaw);
  if (!Number.isFinite(appId)) {
    throw new Error("GITHUB_APP_ID must be a number");
  }

  const privateKey = normalizePrivateKey(privateKeyRaw);
  validatePrivateKey(privateKey);

  return {
    appId,
    privateKey,
  };
}

export function getOpenAIConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim(),
    model: process.env.OPENAI_MODEL?.trim() ?? "gpt-4o-mini",
  };
}

export const BOT_COMMENT_MARKER = "<!-- trace-qa-analysis -->";
