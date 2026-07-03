import type { GitHubWebhookContext } from "../types";

export async function handleIssueCommentEvent(
  context: GitHubWebhookContext,
): Promise<void> {
  const { payload } = context;

  console.info("[github:issue_comment]", {
    action: payload.action,
    repository: payload.repository?.full_name,
    issueNumber: payload.issue?.number,
    issueTitle: payload.issue?.title,
    commentId: payload.comment?.id,
    commentAuthor: payload.comment?.user?.login,
    commentPreview: payload.comment?.body?.slice(0, 120),
    issueUrl: payload.issue?.html_url,
    commentUrl: payload.comment?.html_url,
  });

  // Future: react to bot commands in issue/PR comments.
}
