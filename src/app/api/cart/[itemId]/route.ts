import { z } from "zod";
import { auth } from "@/auth";
import { typedDb } from "@/lib/prisma-shapes";
import { ok, fail } from "@/lib/apiResponse";

const PatchSchema = z.object({
  quantity: z.number().int().min(1).max(999),
});

interface RouteContext {
  params: Promise<{ itemId: string }>;
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);

  const { itemId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues.map((i) => i.message).join(", "));

  const db = typedDb();
  const existing = await db.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true },
  });
  if (!existing || existing.userId !== session.user.id) return fail("Not found", 404);
  if (existing.product && existing.product.stock < parsed.data.quantity)
    return fail("Insufficient stock", 409);

  const updated = await db.cartItem.update({
    where: { id: itemId },
    data: { quantity: parsed.data.quantity },
  });
  return ok(updated);
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);

  const { itemId } = await ctx.params;
  const db = typedDb();
  const existing = await db.cartItem.findUnique({ where: { id: itemId } });
  if (!existing || existing.userId !== session.user.id) return fail("Not found", 404);

  await db.cartItem.delete({ where: { id: itemId } });
  return ok({ deleted: true });
}
