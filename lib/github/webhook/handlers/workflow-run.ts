import {
  analyzeTestFailuresWithLLM,
} from "@/lib/analysis/analyze-test-failures";
import { formatTestRunComment } from "@/lib/analysis/format-test-results";
import { createInstallationOctokit } from "@/lib/github/client";
import { upsertResultsComment } from "@/lib/github/pr/post-comment";
import type { GitHubWebhookContext } from "../types";

const TRACE_QA_WORKFLOW_PATH = ".github/workflows/trace-qa.yml";

export async function handleWorkflowRunEvent(
  context: GitHubWebhookContext,
): Promise<void> {
  const { payload } = context;
  const action = payload.action;
  const workflowRun = payload.workflow_run;
  const repository = payload.repository;
  const installationId = payload.installation?.id;

  if (
    action !== "completed" ||
    !workflowRun ||
    !repository ||
    !installationId ||
    workflowRun.path !== TRACE_QA_WORKFLOW_PATH
  ) {
    return;
  }

  const pullNumber = parsePullNumberFromRunName(workflowRun.name);
  if (!pullNumber) {
    console.warn("[github:workflow_run] Could not parse PR number from run name", {
      runName: workflowRun.name,
    });
    return;
  }

  const octokit = createInstallationOctokit(installationId);
  const owner = repository.owner.login;
  const repo = repository.name;

  console.info("[github:workflow_run] Processing completed run", {
    repository: repository.full_name,
    pullNumber,
    conclusion: workflowRun.conclusion,
    runId: workflowRun.id,
  });

  const summary =
    workflowRun.conclusion === "success"
      ? {
          total: 1,
          passed: 1,
          failed: 0,
          skipped: 0,
          tests: [{ title: "Playwright test suite", status: "passed" as const }],
        }
      : {
          total: 1,
          passed: 0,
          failed: 1,
          skipped: 0,
          tests: [
            {
              title: "Playwright test suite",
              status: "failed" as const,
              error:
                "One or more tests failed. Download artifacts from the workflow run for screenshots, videos, and traces.",
            },
          ],
        };

  let artifactUrl: string | undefined;
  try {
    const { data: artifacts } =
      await octokit.rest.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: workflowRun.id,
      });

    const reportArtifact = artifacts.artifacts.find((artifact) =>
      artifact.name.startsWith("trace-qa-report"),
    );
    artifactUrl = reportArtifact?.archive_download_url;
  } catch (error) {
    console.warn("[github:workflow_run] Could not fetch artifacts", { error });
  }

  const failureAnalysis = await analyzeTestFailuresWithLLM(summary);

  const commentBody = formatTestRunComment({
    pullNumber,
    conclusion: workflowRun.conclusion ?? "unknown",
    workflowUrl: workflowRun.html_url,
    artifactUrl,
    summary,
    failureAnalysis,
  });

  await upsertResultsComment(octokit, owner, repo, pullNumber, commentBody);

  console.info("[github:workflow_run] Posted results comment", {
    repository: repository.full_name,
    pullNumber,
    conclusion: workflowRun.conclusion,
  });
}

function parsePullNumberFromRunName(runName: string | undefined): number | null {
  if (!runName) {
    return null;
  }

  const match = runName.match(/PR\s+#(\d+)/i);
  if (!match?.[1]) {
    return null;
  }

  return Number(match[1]);
}
