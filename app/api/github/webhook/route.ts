import { after } from "next/server";
import {
  SIGNATURE_HEADER,
  verifyGitHubWebhookSignature,
  WebhookVerificationError,
} from "@/lib/github/webhook/verify-signature";
import { dispatchGitHubWebhookEvent } from "@/lib/github/webhook/dispatch";
import type { GitHubWebhookPayload } from "@/lib/github/webhook/types";

export const runtime = "nodejs";

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();

  try {
    verifyGitHubWebhookSignature(
      rawBody,
      request.headers.get(SIGNATURE_HEADER),
      process.env.GITHUB_WEBHOOK_SECRET,
    );
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    throw error;
  }

  let payload: GitHubWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as GitHubWebhookPayload;
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  const event = request.headers.get("x-github-event");
  const deliveryId = request.headers.get("x-github-delivery");

  if (!event || !deliveryId) {
    return jsonResponse(
      { error: "Missing required GitHub webhook headers" },
      400,
    );
  }

  console.info("[github:webhook] Received event", {
    event,
    deliveryId,
    repository: payload.repository?.full_name,
    action: payload.action,
  });

  const webhookContext = {
    event,
    deliveryId,
    payload,
  };

  after(async () => {
    try {
      await dispatchGitHubWebhookEvent(webhookContext);
    } catch (error) {
      console.error("[github:webhook] Background handler failed", {
        event,
        deliveryId,
        repository: payload.repository?.full_name,
        error,
      });
    }
  });

  return jsonResponse({ ok: true });
}
