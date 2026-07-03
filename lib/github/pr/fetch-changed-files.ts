import type { Octokit } from "@octokit/rest";

export interface PullRequestChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface PullRequestChangeSummary {
  owner: string;
  repo: string;
  pullNumber: number;
  title: string;
  files: PullRequestChangedFile[];
  diffText: string;
}

const MAX_DIFF_CHARS = 120_000;

export async function fetchPullRequestChanges(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  title: string,
): Promise<PullRequestChangeSummary> {
  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  });

  const changedFiles: PullRequestChangedFile[] = files.map((file) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch,
  }));

  const diffText = buildDiffText(changedFiles);

  return {
    owner,
    repo,
    pullNumber,
    title,
    files: changedFiles,
    diffText,
  };
}

function buildDiffText(files: PullRequestChangedFile[]): string {
  const sections = files.map((file) => {
    const header = `File: ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})`;
    const patch = file.patch ?? "[Patch omitted by GitHub — file may be binary or too large]";
    return `${header}\n${patch}`;
  });

  let diffText = sections.join("\n\n---\n\n");

  if (diffText.length > MAX_DIFF_CHARS) {
    diffText =
      diffText.slice(0, MAX_DIFF_CHARS) +
      "\n\n[Diff truncated for LLM context limits]";
  }

  return diffText;
}
