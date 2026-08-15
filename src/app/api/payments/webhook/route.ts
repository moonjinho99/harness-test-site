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

export async function POST(req: Request) {
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
    // Unknown payment — acknowledge to prevent retries but log.
    console.warn("[payments.webhook] unknown paymentKey", paymentKey);
    return ok({ acknowledged: true });
  }

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

  return ok({ acknowledged: true });
}