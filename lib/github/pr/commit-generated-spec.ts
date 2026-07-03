import type { Octokit } from "@octokit/rest";

export async function commitGeneratedSpec(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  headRef: string,
  specContent: string,
): Promise<{ path: string; commitSha: string }> {
  const path = `tests/generated/pr-${pullNumber}.spec.ts`;
  const message = `test(trace-qa): add generated Playwright tests for PR #${pullNumber}`;

  let sha: string | undefined;
  try {
    const { data: existing } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: headRef,
    });

    if (!Array.isArray(existing) && existing.type === "file") {
      sha = existing.sha;
    }
  } catch {
    // File does not exist yet.
  }

  const { data: commit } = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(specContent, "utf8").toString("base64"),
    branch: headRef,
    sha,
  });

  return {
    path,
    commitSha: commit.commit.sha ?? headRef,
  };
}
