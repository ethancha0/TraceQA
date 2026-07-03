import type { Octokit } from "@octokit/rest";
import {
  BOT_COMMENT_MARKER,
  BOT_RESULTS_MARKER,
} from "@/lib/github/config";

export async function upsertPullRequestComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
  marker: string = BOT_COMMENT_MARKER,
): Promise<void> {
  const existingComment = await findCommentByMarker(
    octokit,
    owner,
    repo,
    pullNumber,
    marker,
  );

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

export async function upsertResultsComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
): Promise<void> {
  return upsertPullRequestComment(
    octokit,
    owner,
    repo,
    pullNumber,
    body,
    BOT_RESULTS_MARKER,
  );
}

async function findCommentByMarker(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  marker: string,
) {
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number: pullNumber,
    per_page: 100,
  });

  return comments.find((comment) => comment.body?.includes(marker));
}
