import { z } from "zod";
import { auth } from "@/auth";
import { typedDb } from "@/lib/prisma-shapes";
import { ok, fail } from "@/lib/apiResponse";

const AddSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(999),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);
  const db = typedDb();
  const items = await db.cartItem.findMany({
    where: { userId: session.user.id },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues.map((i) => i.message).join(", "));

  const { productId, quantity } = parsed.data;
  const db = typedDb();

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) return fail("Product not found", 404);
  if (product.stock < quantity) return fail("Insufficient stock", 409);

  const item = await db.cartItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: { userId: session.user.id, productId, quantity },
    update: { quantity: { increment: quantity } },
  });
  return ok(item, 201);
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);
  const db = typedDb();
  const result = await db.cartItem.deleteMany({ where: { userId: session.user.id } });
  return ok({ deleted: result.count });
}
