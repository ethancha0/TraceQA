import { analyzePullRequest } from "@/lib/github/pr/analyze-pull-request";
import type { GitHubWebhookContext } from "../types";

const ANALYZE_ACTIONS = new Set(["opened", "synchronize", "reopened"]);

export async function handlePullRequestEvent(
  context: GitHubWebhookContext,
): Promise<void> {
  const { payload } = context;
  const pullRequest = payload.pull_request;
  const repository = payload.repository;
  const installationId = payload.installation?.id;

  console.info("[github:pull_request]", {
    action: payload.action,
    repository: repository?.full_name,
    number: pullRequest?.number,
    title: pullRequest?.title,
    state: pullRequest?.state,
    headRef: pullRequest?.head.ref,
    headSha: pullRequest?.head.sha,
    baseRef: pullRequest?.base.ref,
    author: pullRequest?.user?.login,
    url: pullRequest?.html_url,
  });

  if (!payload.action || !ANALYZE_ACTIONS.has(payload.action)) {
    console.info("[github:pull_request] Skipping unsupported action", {
      action: payload.action,
    });
    return;
  }

  if (
    !installationId ||
    !repository ||
    !pullRequest?.number ||
    !pullRequest.title
  ) {
    console.warn("[github:pull_request] Missing data required for analysis", {
      installationId,
      repository: repository?.full_name,
      pullNumber: pullRequest?.number,
    });
    return;
  }

  await analyzePullRequest({
    installationId,
    owner: repository.owner.login,
    repo: repository.name,
    pullNumber: pullRequest.number,
    title: pullRequest.title,
  });
}
