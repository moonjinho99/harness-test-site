import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { typedDb, type PaymentStatus } from "@/lib/prisma-shapes";
import { ok, fail } from "@/lib/apiResponse";

// Toss webhook: PAYMENT_STATUS_CHANGED and similar events.
// Docs: https://docs.tosspayments.com/reference/using-api/webhook
interface TossWebhookPayload {
  eventType?: string;
  data?: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
  };
}

const STATUS_MAP: Record<string, PaymentStatus> = {
  READY: "READY",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELED: "CANCELED",
  PARTIAL_CANCELED: "CANCELED",
  ABORTED: "FAILED",
  EXPIRED: "FAILED",
  WAITING_FOR_DEPOSIT: "IN_PROGRESS",
};

function verifyTossSignature(request: Request): boolean {
  const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("TOSS_WEBHOOK_SECRET must be configured in production");
    }
    return true; // dev-only
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Basic ${Buffer.from(`${webhookSecret}:`).toString("base64")}`;
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(authHeader);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export async function POST(req: Request) {
  if (!verifyTossSignature(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: TossWebhookPayload;
  try {
    payload = (await req.json()) as TossWebhookPayload;
  } catch {
    return fail("Invalid JSON body");
  }

  const paymentKey = payload.data?.paymentKey;
  const tossStatus = payload.data?.status;
  if (!paymentKey || !tossStatus) return fail("Missing paymentKey or status");

  const mapped = STATUS_MAP[tossStatus] ?? "IN_PROGRESS";
  const db = typedDb();

  const payment = await db.payment.findUnique({ where: { paymentKey } });
  if (!payment) {
    // Unknown paymentKey — acknowledge with 200 so Toss stops retrying.
    console.warn("[payments.webhook] unknown paymentKey", paymentKey);
    return ok({ acknowledged: true });
  }

  if (payment.status === mapped) {
    return ok({ acknowledged: true, skipped: "already_in_state" });
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { paymentKey },
        data: { status: mapped, rawResponse: payload as unknown },
      });
      if (mapped === "CANCELED") {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "CANCELED" },
        });
      } else if (mapped === "DONE") {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "PAID" },
        });
      }
    });
  } catch (err) {
    console.error("[payments.webhook] processing failed", err);
    return fail("Webhook processing failed", 500);
  }

  return ok({ acknowledged: true });
}