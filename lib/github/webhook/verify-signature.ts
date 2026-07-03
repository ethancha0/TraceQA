import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_HEADER = "x-hub-signature-256";
const SIGNATURE_PREFIX = "sha256=";

export class WebhookVerificationError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 401 | 500,
  ) {
    super(message);
    this.name = "WebhookVerificationError";
  }
}

function normalizeSignatureHeader(
  signatureHeader: string | null,
): string | null {
  if (!signatureHeader) {
    return null;
  }

  const trimmed = signatureHeader.trim();
  if (!trimmed.toLowerCase().startsWith(SIGNATURE_PREFIX)) {
    return null;
  }

  return trimmed.slice(SIGNATURE_PREFIX.length);
}

export function verifyGitHubWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | undefined,
): void {
  if (!secret) {
    throw new WebhookVerificationError(
      "GITHUB_WEBHOOK_SECRET is not configured",
      500,
    );
  }

  const providedSignature = normalizeSignatureHeader(signatureHeader);
  if (!providedSignature) {
    throw new WebhookVerificationError(
      "Missing or malformed X-Hub-Signature-256 header",
      400,
    );
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const providedBuffer = Buffer.from(providedSignature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new WebhookVerificationError("Invalid webhook signature", 401);
  }
}

export { SIGNATURE_HEADER };
