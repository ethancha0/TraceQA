import { generatePlaywrightSpec } from "@/lib/analysis/generate-playwright-spec";
import { analyzePullRequestWithLLM } from "@/lib/analysis/analyze-pr";
import { formatRunSetupFailedComment } from "@/lib/analysis/format-test-results";
import { dispatchTraceQATestRun } from "@/lib/github/actions/dispatch-test-run";
import { createInstallationOctokit } from "@/lib/github/client";
import { fetchPullRequestChanges } from "@/lib/github/pr/fetch-changed-files";
import { upsertResultsComment } from "@/lib/github/pr/post-comment";

export interface TriggerTestRunInput {
  installationId: number;
  owner: string;
  repo: string;
  pullNumber: number;
  headRef: string;
  triggeredBy: string;
}

export async function triggerTestRun(input: TriggerTestRunInput): Promise<void> {
  const octokit = createInstallationOctokit(input.installationId);

  console.info("[trace-qa:run] Starting test run", {
    repository: `${input.owner}/${input.repo}`,
    pullNumber: input.pullNumber,
    triggeredBy: input.triggeredBy,
  });

  await upsertResultsComment(
    octokit,
    input.owner,
    input.repo,
    input.pullNumber,
    [
      "<!-- trace-qa-results -->",
      "## Trace QA test run",
      "",
      `Triggered by @${input.triggeredBy}. Generating ephemeral Playwright tests and starting GitHub Actions...`,
      "",
      "⏳ _This comment will update when the run completes._",
    ].join("\n"),
  );

  try {
    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner: input.owner,
      repo: input.repo,
      pull_number: input.pullNumber,
    });

    const changes = await fetchPullRequestChanges(
      octokit,
      input.owner,
      input.repo,
      input.pullNumber,
      pullRequest.title,
    );

    const analysis = await analyzePullRequestWithLLM(changes);
    const specContent = await generatePlaywrightSpec(changes, analysis);

    const runId = await dispatchTraceQATestRun(
      octokit,
      input.owner,
      input.repo,
      input.pullNumber,
      input.headRef,
      specContent,
    );

    await upsertResultsComment(
      octokit,
      input.owner,
      input.repo,
      input.pullNumber,
      [
        "<!-- trace-qa-results -->",
        "## Trace QA test run",
        "",
        `Triggered by @${input.triggeredBy}.`,
        "",
        "- Generated spec: ephemeral workflow input (not committed to the repo)",
        `- Workflow run: [View on GitHub](https://github.com/${input.owner}/${input.repo}/actions/runs/${runId})`,
        "",
        "⏳ _Running Playwright tests... This comment will update when the run completes._",
      ].join("\n"),
    );

    console.info("[trace-qa:run] Dispatched workflow", {
      repository: `${input.owner}/${input.repo}`,
      pullNumber: input.pullNumber,
      runId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await upsertResultsComment(
      octokit,
      input.owner,
      input.repo,
      input.pullNumber,
      formatRunSetupFailedComment(input.pullNumber, input.triggeredBy, message),
    );

    throw error;
  }
}
