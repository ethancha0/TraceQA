import { analyzePullRequestWithLLM } from "@/lib/analysis/analyze-pr";
import { formatAnalysisComment } from "@/lib/analysis/format-comment";
import { createInstallationOctokit } from "@/lib/github/client";
import { fetchPullRequestChanges } from "@/lib/github/pr/fetch-changed-files";
import { upsertPullRequestComment } from "@/lib/github/pr/post-comment";

export interface AnalyzePullRequestInput {
  installationId: number;
  owner: string;
  repo: string;
  pullNumber: number;
  title: string;
}

export async function analyzePullRequest(
  input: AnalyzePullRequestInput,
): Promise<void> {
  const octokit = createInstallationOctokit(input.installationId);

  console.info("[github:pull_request] Fetching changed files", {
    repository: `${input.owner}/${input.repo}`,
    pullNumber: input.pullNumber,
  });

  const changes = await fetchPullRequestChanges(
    octokit,
    input.owner,
    input.repo,
    input.pullNumber,
    input.title,
  );

  console.info("[github:pull_request] Running LLM analysis", {
    repository: `${input.owner}/${input.repo}`,
    pullNumber: input.pullNumber,
    changedFileCount: changes.files.length,
  });

  const analysis = await analyzePullRequestWithLLM(changes);
  const commentBody = formatAnalysisComment(analysis, {
    owner: input.owner,
    repo: input.repo,
    pullNumber: input.pullNumber,
  });

  await upsertPullRequestComment(
    octokit,
    input.owner,
    input.repo,
    input.pullNumber,
    commentBody,
  );

  console.info("[github:pull_request] Posted analysis comment", {
    repository: `${input.owner}/${input.repo}`,
    pullNumber: input.pullNumber,
    likelyBugs: analysis.likelyBugs.length,
    suggestedTests: analysis.suggestedPlaywrightTests.length,
  });
}
