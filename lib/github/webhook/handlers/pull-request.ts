import type { GitHubWebhookContext } from "../types";

export async function handlePullRequestEvent(
  context: GitHubWebhookContext,
): Promise<void> {
  const { payload } = context;
  const pullRequest = payload.pull_request;

  console.info("[github:pull_request]", {
    action: payload.action,
    repository: payload.repository?.full_name,
    number: pullRequest?.number,
    title: pullRequest?.title,
    state: pullRequest?.state,
    headRef: pullRequest?.head.ref,
    headSha: pullRequest?.head.sha,
    baseRef: pullRequest?.base.ref,
    author: pullRequest?.user?.login,
    url: pullRequest?.html_url,
  });

  // Future: fetch PR diff and changed files via GitHub API using installation token.
}
