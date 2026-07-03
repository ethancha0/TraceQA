import type { Octokit } from "@octokit/rest";
import { BOT_COMMENT_MARKER } from "@/lib/github/config";

export async function upsertPullRequestComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
): Promise<void> {
  const existingComment = await findBotComment(octokit, owner, repo, pullNumber);

  if (existingComment) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existingComment.id,
      body,
    });
    return;
  }

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });
}

async function findBotComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
) {
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number: pullNumber,
    per_page: 100,
  });

  return comments.find((comment) => comment.body?.includes(BOT_COMMENT_MARKER));
}
