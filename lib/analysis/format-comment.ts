import { BOT_COMMENT_MARKER } from "@/lib/github/config";
import type { PullRequestAnalysis } from "./types";

export function formatAnalysisComment(analysis: PullRequestAnalysis): string {
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
    "_Automated review by Trace QA. Re-run on every PR update._",
  ];

  return sections.filter((section) => section !== null).join("\n");
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
