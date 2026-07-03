import { BOT_RESULTS_MARKER } from "@/lib/github/config";
import type { PlaywrightRunSummary } from "./analyze-test-failures";

export interface TestRunCommentInput {
  pullNumber: number;
  conclusion: "success" | "failure" | "cancelled" | "skipped" | string;
  workflowUrl: string;
  artifactUrl?: string;
  summary: PlaywrightRunSummary;
  failureAnalysis: string;
  triggeredBy?: string;
}

export function formatTestRunComment(input: TestRunCommentInput): string {
  const icon =
    input.conclusion === "success"
      ? "✅"
      : input.conclusion === "cancelled"
        ? "⚠️"
        : "❌";

  const testLines = input.summary.tests.map((test) => {
    const statusIcon =
      test.status === "passed" ? "✅" : test.status === "skipped" ? "⏭️" : "❌";
    return `- ${statusIcon} ${test.title}`;
  });

  const sections = [
    BOT_RESULTS_MARKER,
    "## Trace QA test results",
    "",
    `${icon} **${input.conclusion.toUpperCase()}** — PR #${input.pullNumber}`,
    input.triggeredBy ? `_Triggered by @${input.triggeredBy}_` : "",
    "",
    `| Passed | Failed | Skipped | Total |`,
    `| --- | --- | --- | --- |`,
    `| ${input.summary.passed} | ${input.summary.failed} | ${input.summary.skipped} | ${input.summary.total} |`,
    "",
    testLines.length > 0 ? "### Tests\n\n" + testLines.join("\n") : "",
    input.summary.failed > 0
      ? ["", "### Failure analysis", "", input.failureAnalysis].join("\n")
      : "",
    "",
    "### Artifacts",
    `- [Workflow run](${input.workflowUrl})`,
    input.artifactUrl
      ? `- [Download report, screenshots, traces](${input.artifactUrl})`
      : "- Artifacts uploaded to the workflow run (screenshots, videos, traces on failure)",
    "",
    "Comment `/run-trace-qa` to re-run tests.",
  ];

  return sections.filter(Boolean).join("\n");
}

export function formatPendingRunComment(
  pullNumber: number,
  triggeredBy: string,
  workflowUrl: string,
): string {
  return [
    BOT_RESULTS_MARKER,
    "## Trace QA test run",
    "",
    `Triggered by @${triggeredBy} for PR #${pullNumber}.`,
    "",
    `- [View workflow run](${workflowUrl})`,
    "",
    "⏳ _Running Playwright tests... This comment will update when the run completes._",
  ].join("\n");
}

export function formatRunSetupFailedComment(
  pullNumber: number,
  triggeredBy: string,
  errorMessage: string,
): string {
  return [
    BOT_RESULTS_MARKER,
    "## Trace QA test run",
    "",
    `❌ **SETUP FAILED** — PR #${pullNumber}`,
    `_Triggered by @${triggeredBy}_`,
    "",
    "Trace QA could not start the GitHub Actions run.",
    "",
    "### Error",
    "",
    `\`${errorMessage}\``,
    "",
    "Most common causes:",
    "",
    "- GitHub App **Actions** permission is not set to **Read & write**",
    "- The app was not reinstalled after permission changes",
    "- `.github/workflows/trace-qa.yml` is missing from the repository default branch",
    "- The generated test is too large for a workflow dispatch input",
    "",
    "Fix the app permissions, reinstall the app on this repo, then comment `/run-trace-qa` again.",
  ].join("\n");
}
