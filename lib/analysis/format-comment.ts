import {
  BOT_COMMENT_MARKER,
  RUN_TESTS_COMMAND,
  TRACE_QA_WORKFLOW_FILE,
} from "@/lib/github/config";
import type { PullRequestAnalysis } from "./types";

export interface AnalysisCommentContext {
  owner: string;
  repo: string;
  pullNumber: number;
}

export function formatAnalysisComment(
  analysis: PullRequestAnalysis,
  context?: AnalysisCommentContext,
): string {
  const runSection = context
    ? formatRunTestsSection(context)
    : formatRunTestsSectionFallback();

  const sections = [
    BOT_COMMENT_MARKER,
    "## Trace QA analysis",
    "",
    analysis.summary,
    "",
    formatListSection("Likely bugs", analysis.likelyBugs, (item) => {
      const severity = item.severity ? ` **(${item.severity})**` : "";
      const file = item.file ? ` — \`${item.file}\`` : "";
      return `- ${item.description}${severity}${file}`;
    }),
    formatListSection("Missing edge cases", analysis.missingEdgeCases, (item) => {
      const file = item.file ? ` — \`${item.file}\`` : "";
      return `- ${item.description}${file}`;
    }),
    formatListSection("Affected user flows", analysis.affectedUserFlows, (item) =>
      `- ${item.description}`,
    ),
    formatPlaywrightTestsSection(analysis),
    formatListSection(
      "Files needing deeper inspection",
      analysis.filesNeedingDeeperInspection,
      (item) => `- \`${item.file}\`: ${item.reason}`,
    ),
    "",
    runSection,
    "",
    "_Automated review by Trace QA. Re-run analysis on every PR update._",
  ];

  return sections.filter((section) => section !== null).join("\n");
}

function formatRunTestsSection(context: AnalysisCommentContext): string {
  const actionsUrl = `https://github.com/${context.owner}/${context.repo}/actions/workflows/${TRACE_QA_WORKFLOW_FILE}`;

  return [
    "### ▶ Run suggested tests",
    "",
    "To generate Playwright tests and execute them in GitHub Actions:",
    "",
    `1. **Comment \`${RUN_TESTS_COMMAND}\`** on this PR (recommended)`,
    `2. Or open [Actions → Trace QA Tests](${actionsUrl}) → **Run workflow** → enter PR #${context.pullNumber}`,
    "",
    "The bot will send generated tests to GitHub Actions as temporary workflow input, run Playwright in CI, and post pass/fail results with artifact links. No test file is committed to your branch.",
  ].join("\n");
}

function formatRunTestsSectionFallback(): string {
  return [
    "### ▶ Run suggested tests",
    "",
    `Comment \`${RUN_TESTS_COMMAND}\` on this PR to generate and run Playwright tests in GitHub Actions.`,
  ].join("\n");
}

function formatListSection<T>(
  title: string,
  items: T[],
  formatItem: (item: T) => string,
): string | null {
  if (items.length === 0) {
    return null;
  }

  return [`### ${title}`, "", ...items.map(formatItem)].join("\n");
}

function formatPlaywrightTestsSection(analysis: PullRequestAnalysis): string | null {
  if (analysis.suggestedPlaywrightTests.length === 0) {
    return null;
  }

  const tests = analysis.suggestedPlaywrightTests.flatMap((test) => {
    const files =
      test.relatedFiles.length > 0
        ? `\n  - Related files: ${test.relatedFiles.map((file) => `\`${file}\``).join(", ")}`
        : "";
    const steps =
      test.steps.length > 0
        ? `\n  - Steps:\n${test.steps.map((step, index) => `    ${index + 1}. ${step}`).join("\n")}`
        : "";

    return [`- **${test.title}** — ${test.description}${files}${steps}`];
  });

  return [`### Suggested Playwright tests`, "", ...tests].join("\n");
}
