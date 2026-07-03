import { RUN_TESTS_COMMAND } from "@/lib/github/config";
import { createInstallationOctokit } from "@/lib/github/client";
import { triggerTestRun } from "@/lib/github/pr/trigger-test-run";
import type { GitHubWebhookContext } from "../types";

export async function handleIssueCommentEvent(
  context: GitHubWebhookContext,
): Promise<void> {
  const { payload } = context;
  const commentBody = payload.comment?.body?.trim() ?? "";
  const issue = payload.issue;
  const repository = payload.repository;
  const installationId = payload.installation?.id;

  console.info("[github:issue_comment]", {
    action: payload.action,
    repository: repository?.full_name,
    issueNumber: issue?.number,
    commentAuthor: payload.comment?.user?.login,
    commentPreview: commentBody.slice(0, 120),
  });

  if (
    payload.action !== "created" ||
    !issue?.number ||
    !repository ||
    !installationId ||
    !payload.issue?.pull_request ||
    payload.sender?.type === "Bot"
  ) {
    return;
  }

  if (!commentBody.toLowerCase().includes(RUN_TESTS_COMMAND)) {
    return;
  }

  const owner = repository.owner.login;
  const repo = repository.name;
  const pullNumber = issue.number;
  const triggeredBy = payload.comment?.user?.login ?? payload.sender?.login ?? "unknown";

  const octokit = createInstallationOctokit(installationId);

  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  await triggerTestRun({
    installationId,
    owner,
    repo,
    pullNumber,
    headRef: pullRequest.head.ref,
    triggeredBy,
  });
}
