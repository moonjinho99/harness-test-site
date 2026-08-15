import { auth } from "@/auth";
import { typedDb } from "@/lib/prisma-shapes";
import { ok, fail } from "@/lib/apiResponse";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);

  const { orderId } = await ctx.params;
  const db = typedDb();
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });
  if (!order) return fail("Not found", 404);
  if (order.userId !== session.user.id && session.user.role !== "ADMIN")
    return fail("Forbidden", 403);

  return ok(order);
}