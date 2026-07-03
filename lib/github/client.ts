import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { getGitHubAppCredentials } from "./config";

export function createInstallationOctokit(installationId: number): Octokit {
  const credentials = getGitHubAppCredentials();
  if (!credentials) {
    throw new Error(
      "GitHub App credentials missing. Set GITHUB_APP_ID and GITHUB_PRIVATE_KEY.",
    );
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: credentials.appId,
      privateKey: credentials.privateKey,
      installationId,
    },
  });
}
