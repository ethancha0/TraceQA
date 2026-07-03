import type { GitHubWebhookContext } from "../types";

export async function handlePushEvent(
  context: GitHubWebhookContext,
): Promise<void> {
  const { payload } = context;

  console.info("[github:push]", {
    repository: payload.repository?.full_name,
    ref: payload.ref,
    before: payload.before,
    after: payload.after,
    commitCount: payload.commits?.length ?? 0,
    pusher: payload.pusher?.name,
    commits: payload.commits?.map((commit) => ({
      id: commit.id,
      message: commit.message.split("\n")[0],
      author: commit.author.name,
    })),
  });

  // Future: inspect changed files for the pushed commits via GitHub API.
}
