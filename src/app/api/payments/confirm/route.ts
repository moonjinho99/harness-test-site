import { z } from "zod";
import { auth } from "@/auth";
import { typedDb } from "@/lib/prisma-shapes";
import { ok, fail } from "@/lib/apiResponse";
import { confirmPayment } from "@/lib/tosspayments";

const ConfirmSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1), // Toss uses our Order.orderNumber as its orderId
  amount: z.number().int().positive(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = ConfirmSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues.map((i) => i.message).join(", "));

  const { paymentKey, orderId, amount } = parsed.data;
  const db = typedDb();

  const order = await db.order.findUnique({ where: { orderNumber: orderId } });
  if (!order) return fail("Order not found", 404);
  if (order.userId !== session.user.id) return fail("Forbidden", 403);
  if (order.status !== "PENDING") return fail("Order not in PENDING state", 409);
  if (order.totalAmount !== amount) return fail("Amount mismatch", 400);

  const tossResponse = await confirmPayment(paymentKey, orderId, amount);

  // Toss failure — response contains a `code` field on error.
  if (tossResponse.code) {
    await db.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          paymentKey,
          amount,
          status: "FAILED",
          failureCode: tossResponse.code ?? null,
          failureMessage: tossResponse.message ?? null,
          rawResponse: tossResponse as unknown,
        },
        update: {
          status: "FAILED",
          failureCode: tossResponse.code ?? null,
          failureMessage: tossResponse.message ?? null,
          rawResponse: tossResponse as unknown,
        },
      });
    });
    return fail(tossResponse.message ?? "결제 승인에 실패했습니다.", 402);
  }

  const approvedAt = tossResponse.approvedAt ? new Date(tossResponse.approvedAt) : new Date();

  const result = await db.$transaction(async (tx) => {
    const payment = await tx.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        paymentKey,
        method: tossResponse.method ?? null,
        amount,
        status: "DONE",
        approvedAt,
        rawResponse: tossResponse as unknown,
      },
      update: {
        paymentKey,
        method: tossResponse.method ?? null,
        status: "DONE",
        approvedAt,
        rawResponse: tossResponse as unknown,
      },
    });
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
      include: { items: true },
    });
    return { payment, order: updatedOrder };
  });

  return ok(result);
}
