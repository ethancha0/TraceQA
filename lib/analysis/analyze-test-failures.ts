import OpenAI from "openai";
import { getOpenAIConfig } from "@/lib/github/config";

export interface PlaywrightTestResult {
  title: string;
  status: "passed" | "failed" | "skipped" | "timedOut";
  error?: string;
}

export interface PlaywrightRunSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  tests: PlaywrightTestResult[];
}

export async function analyzeTestFailuresWithLLM(
  summary: PlaywrightRunSummary,
  diffSnippet?: string,
): Promise<string> {
  const failedTests = summary.tests.filter((test) => test.status === "failed");
  if (failedTests.length === 0) {
    return "All tests passed. No fixes suggested.";
  }

  const { apiKey, model } = getOpenAIConfig();
  if (!apiKey) {
    return failedTests
      .map((test) => `- **${test.title}**: ${test.error ?? "Unknown failure"}`)
      .join("\n");
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a senior engineer helping fix failing Playwright tests. Provide concise failure explanations and suggested fixes.",
      },
      {
        role: "user",
        content: `Failed tests:
${failedTests.map((test) => `- ${test.title}\n  Error: ${test.error ?? "unknown"}`).join("\n")}

${diffSnippet ? `Recent PR diff context:\n${diffSnippet.slice(0, 20_000)}` : ""}

Summarize likely root causes and suggested fixes in markdown bullet points.`,
      },
    ],
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content?.trim() ?? "Unable to analyze failures.";
}

export function parsePlaywrightJsonReport(report: unknown): PlaywrightRunSummary {
  const empty: PlaywrightRunSummary = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: [],
  };

  if (!report || typeof report !== "object") {
    return empty;
  }

  const suites = (report as { suites?: unknown[] }).suites ?? [];
  const tests: PlaywrightTestResult[] = [];

  for (const suite of suites) {
    collectTests(suite, tests);
  }

  return {
    total: tests.length,
    passed: tests.filter((test) => test.status === "passed").length,
    failed: tests.filter((test) => test.status === "failed").length,
    skipped: tests.filter((test) => test.status === "skipped").length,
    tests,
  };
}

function collectTests(suite: unknown, tests: PlaywrightTestResult[]): void {
  if (!suite || typeof suite !== "object") {
    return;
  }

  const suiteObj = suite as {
    title?: string;
    specs?: Array<{
      title?: string;
      tests?: Array<{
        results?: Array<{
          status?: string;
          error?: { message?: string };
        }>;
      }>;
    }>;
    suites?: unknown[];
  };

  for (const spec of suiteObj.specs ?? []) {
    const result = spec.tests?.[0]?.results?.[0];
    const status = normalizeStatus(result?.status);
    tests.push({
      title: [suiteObj.title, spec.title].filter(Boolean).join(" › "),
      status,
      error: result?.error?.message,
    });
  }

  for (const child of suiteObj.suites ?? []) {
    collectTests(child, tests);
  }
}

function normalizeStatus(
  status: string | undefined,
): PlaywrightTestResult["status"] {
  if (status === "passed") return "passed";
  if (status === "skipped") return "skipped";
  if (status === "timedOut") return "timedOut";
  return "failed";
}
