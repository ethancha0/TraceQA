function normalizePrivateKey(key: string): string {
  if (key.includes("\\n")) {
    return key.replace(/\\n/g, "\n");
  }

  return key;
}

export interface GitHubAppCredentials {
  appId: number;
  privateKey: string;
}

export function getGitHubAppCredentials(): GitHubAppCredentials | null {
  const appIdRaw = process.env.GITHUB_APP_ID?.trim();
  const privateKeyRaw = process.env.GITHUB_PRIVATE_KEY?.trim();

  if (!appIdRaw || !privateKeyRaw) {
    return null;
  }

  const appId = Number(appIdRaw);
  if (!Number.isFinite(appId)) {
    throw new Error("GITHUB_APP_ID must be a number");
  }

  return {
    appId,
    privateKey: normalizePrivateKey(privateKeyRaw),
  };
}

export function getOpenAIConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim(),
    model: process.env.OPENAI_MODEL?.trim() ?? "gpt-4o-mini",
  };
}

export const BOT_COMMENT_MARKER = "<!-- trace-qa-analysis -->";
