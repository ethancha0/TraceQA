import type { Octokit } from "@octokit/rest";
import { TRACE_QA_WORKFLOW_FILE } from "@/lib/github/config";

type WorkflowRunWithDisplayTitle = Awaited<
  ReturnType<Octokit["rest"]["actions"]["listWorkflowRuns"]>
>["data"]["workflow_runs"][number] & {
  display_title?: string;
};

export async function dispatchTraceQATestRun(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  headRef: string,
  specContent: string,
): Promise<number> {
  await octokit.rest.actions.createWorkflowDispatch({
    owner,
    repo,
    workflow_id: TRACE_QA_WORKFLOW_FILE,
    ref: headRef,
    inputs: {
      pr_number: String(pullNumber),
      spec_base64: Buffer.from(specContent, "utf8").toString("base64"),
    },
  });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const { data: runs } = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: TRACE_QA_WORKFLOW_FILE,
      branch: headRef,
      event: "workflow_dispatch",
      per_page: 5,
    });

    const run = runs.workflow_runs.find((workflowRun) =>
      getWorkflowRunTitle(workflowRun).includes(`PR #${pullNumber}`),
    );

    if (run?.id) {
      return run.id;
    }
  }

  throw new Error("Failed to locate dispatched Trace QA workflow run");
}

function getWorkflowRunTitle(workflowRun: WorkflowRunWithDisplayTitle): string {
  return workflowRun.display_title ?? workflowRun.name ?? "";
}
