import { handleWorkflowRunEvent } from "./handlers/workflow-run";
import { handleInstallationEvent } from "./handlers/installation";
import { handleIssueCommentEvent } from "./handlers/issue-comment";
import { handlePullRequestEvent } from "./handlers/pull-request";
import { handlePushEvent } from "./handlers/push";
import type { GitHubWebhookContext } from "./types";

type EventHandler = (context: GitHubWebhookContext) => Promise<void>;

const eventHandlers: Record<string, EventHandler> = {
  installation: handleInstallationEvent,
  pull_request: handlePullRequestEvent,
  push: handlePushEvent,
  issue_comment: handleIssueCommentEvent,
  workflow_run: handleWorkflowRunEvent,
};

export async function dispatchGitHubWebhookEvent(
  context: GitHubWebhookContext,
): Promise<void> {
  const handler = eventHandlers[context.event];

  if (!handler) {
    console.info("[github:webhook] Unhandled event type", {
      event: context.event,
      deliveryId: context.deliveryId,
      repository: context.payload.repository?.full_name,
      action: context.payload.action,
    });
    return;
  }

  await handler(context);
}
