import OpenAI from "openai";
import {
  EMPTY_PULL_REQUEST_ANALYSIS,
  type PullRequestAnalysis,
} from "./types";
import type { PullRequestChangeSummary } from "@/lib/github/pr/fetch-changed-files";
import { getOpenAIConfig } from "@/lib/github/config";

const SYSTEM_PROMPT = `You are a senior QA engineer reviewing pull requests.
Analyze the provided PR diff and return a JSON object with this exact shape:
{
  "summary": "1-2 sentence overview",
  "likelyBugs": [{ "description": "...", "file": "path/to/file", "severity": "high|medium|low" }],
  "missingEdgeCases": [{ "description": "...", "file": "path/to/file" }],
  "affectedUserFlows": [{ "description": "..." }],
  "suggestedPlaywrightTests": [{
    "title": "...",
    "description": "...",
    "steps": ["step 1", "step 2"],
    "relatedFiles": ["path/to/file"]
  }],
  "filesNeedingDeeperInspection": [{ "file": "path/to/file", "reason": "..." }]
}

Be specific and actionable. Focus on user-visible behavior, regressions, auth/data edge cases, and test gaps.
If the diff is insufficient to judge something, say so in filesNeedingDeeperInspection.
Return only valid JSON.`;

export async function analyzePullRequestWithLLM(
  changes: PullRequestChangeSummary,
): Promise<PullRequestAnalysis> {
  const { apiKey, model } = getOpenAIConfig();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const openai = new OpenAI({ apiKey });

  const fileSummary = changes.files
    .map(
      (file) =>
        `- ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})`,
    )
    .join("\n");

  const userPrompt = `PR #${changes.pullNumber}: ${changes.title}

Changed files:
${fileSummary}

Diff:
${changes.diffText}`;

  const response = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return EMPTY_PULL_REQUEST_ANALYSIS;
  }

  return parseAnalysisResponse(content);
}

function parseAnalysisResponse(content: string): PullRequestAnalysis {
  try {
    const parsed = JSON.parse(content) as Partial<PullRequestAnalysis>;
    return {
      summary: parsed.summary ?? "Analysis complete.",
      likelyBugs: parsed.likelyBugs ?? [],
      missingEdgeCases: parsed.missingEdgeCases ?? [],
      affectedUserFlows: parsed.affectedUserFlows ?? [],
      suggestedPlaywrightTests: parsed.suggestedPlaywrightTests ?? [],
      filesNeedingDeeperInspection: parsed.filesNeedingDeeperInspection ?? [],
    };
  } catch (error) {
    console.error("[analysis] Failed to parse LLM JSON response", { error, content });
    return {
      ...EMPTY_PULL_REQUEST_ANALYSIS,
      summary: "Analysis failed to parse model output.",
    };
  }
}
