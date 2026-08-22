import { z } from "zod";
import { auth } from "@/auth";
import { typedDb } from "@/lib/prisma-shapes";
import { ok, fail } from "@/lib/apiResponse";
import { cancelPayment } from "@/lib/tosspayments";

const CancelSchema = z.object({
  orderId: z.string().min(1),
  cancelReason: z.string().min(1).max(200),
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
  const parsed = CancelSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues.map((i) => i.message).join(", "));

  const { orderId, cancelReason } = parsed.data;
  const db = typedDb();

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });
  if (!order) return fail("Order not found", 404);
  if (order.userId !== session.user.id && session.user.role !== "ADMIN")
    return fail("Forbidden", 403);
  if (order.status === "SHIPPED" || order.status === "DELIVERED")
    return fail("배송이 시작된 주문은 취소할 수 없습니다.", 409);

  // PENDING: 결제 미완료 주문 — Toss 호출 없이 바로 취소
  if (order.status === "PENDING") {
    await db.order.update({ where: { id: order.id }, data: { status: "CANCELED" } });
    return ok({ canceled: true });
  }

  if (!order.payment || order.payment.status !== "DONE")
    return fail("Payment not in DONE state", 409);

  const tossResponse = await cancelPayment(order.payment.paymentKey, cancelReason);
  if (tossResponse.code) {
    return fail(tossResponse.message ?? "결제 취소에 실패했습니다.", 402);
  }

  await db.$transaction(async (tx) => {
    // Restore stock — re-read inside tx for isolation.
    const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
    for (const item of items) {
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.payment.update({
      where: { orderId: order.id },
      data: { status: "CANCELED", rawResponse: tossResponse as unknown },
    });
    await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELED" },
    });
  });

  return ok({ canceled: true });
}