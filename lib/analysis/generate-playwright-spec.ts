import OpenAI from "openai";
import type { PullRequestChangeSummary } from "@/lib/github/pr/fetch-changed-files";
import type { PullRequestAnalysis } from "./types";
import { getOpenAIConfig } from "@/lib/github/config";

const SYSTEM_PROMPT = `You are a senior QA engineer writing Playwright tests in TypeScript.
Given a PR diff and test suggestions, output a single Playwright spec file.

Requirements:
- Use @playwright/test imports
- Use test.describe and test() blocks
- Prefer getByRole, getByLabel, getByText locators
- Include meaningful test titles
- Do not use test.only or test.skip unless justified in a comment
- Return ONLY the TypeScript file contents, no markdown fences`;

export async function generatePlaywrightSpec(
  changes: PullRequestChangeSummary,
  analysis: PullRequestAnalysis,
): Promise<string> {
  const { apiKey, model } = getOpenAIConfig();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const openai = new OpenAI({ apiKey });

  const suggestions = analysis.suggestedPlaywrightTests
    .map(
      (test) =>
        `- ${test.title}: ${test.description}\n  Steps: ${test.steps.join(" → ")}`,
    )
    .join("\n");

  const userPrompt = `PR #${changes.pullNumber}: ${changes.title}

Suggested tests:
${suggestions || "Generate smoke tests for the changed user flows."}

Diff summary:
${changes.diffText.slice(0, 60_000)}

Write tests/generated/pr-${changes.pullNumber}.spec.ts content for these changes.`;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
  });

  let content = response.choices[0]?.message?.content?.trim() ?? "";
  content = content.replace(/^```(?:typescript|ts)?\n?/i, "").replace(/\n?```$/i, "");

  if (!content.includes("@playwright/test")) {
    return buildFallbackSpec(changes.pullNumber, analysis);
  }

  return content;
}

function buildFallbackSpec(
  pullNumber: number,
  analysis: PullRequestAnalysis,
): string {
  const titles = analysis.suggestedPlaywrightTests.map(
    (test) => test.title.replace(/'/g, "\\'"),
  );

  const tests =
    titles.length > 0
      ? titles
          .map(
            (title) => `  test('${title}', async ({ page }) => {
    // TODO: implement steps from Trace QA analysis comment
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });`,
          )
          .join("\n\n")
      : `  test('PR #${pullNumber} smoke test', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });`;

  return `import { test, expect } from '@playwright/test';

test.describe('Trace QA generated tests — PR #${pullNumber}', () => {
${tests}
});
`;
}
