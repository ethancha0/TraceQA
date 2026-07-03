import type { GitHubWebhookContext } from "../types";

export async function handleInstallationEvent(
  context: GitHubWebhookContext,
): Promise<void> {
  const { payload } = context;
  const installationId = payload.installation?.id;
  const accountLogin = payload.installation?.account?.login;
  const repositoryCount = payload.repositories?.length ?? 0;

  console.info("[github:installation]", {
    action: payload.action,
    installationId,
    accountLogin,
    repositoryCount,
    repositories: payload.repositories?.map((repo) => repo.full_name),
  });

  // Future: persist installation credentials and sync accessible repositories.
}
