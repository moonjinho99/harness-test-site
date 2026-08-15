import { z } from "zod";
import { auth } from "@/auth";
import { typedDb, type PrismaProduct } from "@/lib/prisma-shapes";
import { ok, fail } from "@/lib/apiResponse";
import { generateOrderNumber } from "@/lib/orderNumber";

const OrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(999),
});

const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1),
  receiverName: z.string().min(1).max(50),
  receiverPhone: z.string().min(1).max(20),
  postalCode: z.string().min(1).max(10),
  address: z.string().min(1).max(200),
  addressDetail: z.string().max(200).optional(),
  memo: z.string().max(500).optional(),
  shippingFee: z.number().int().min(0).default(0),
  discountAmount: z.number().int().min(0).default(0),
});

const SHIPPING_DEFAULT = 3000;
const FREE_SHIPPING_THRESHOLD = 50000;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);
  const db = typedDb();
  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: { items: true, payment: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(orders);
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
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues.map((i) => i.message).join(", "));

  const data = parsed.data;
  const db = typedDb();

  try {
    const order = await db.$transaction(async (tx) => {
      const productIds = data.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
      });
      const productById = new Map<string, PrismaProduct>(products.map((p) => [p.id, p]));

      let itemsSubtotal = 0;
      const orderItemsData: Array<{
        productId: string;
        productName: string;
        unitPrice: number;
        quantity: number;
      }> = [];

      for (const line of data.items) {
        const product = productById.get(line.productId);
        if (!product) throw new Error(`PRODUCT_NOT_FOUND:${line.productId}`);

        // Server-authoritative stock decrement using conditional update.
        const dec = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (dec.count === 0) throw new Error(`OUT_OF_STOCK:${product.id}`);

        itemsSubtotal += product.price * line.quantity;
        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: line.quantity,
        });
      }

      const computedShipping =
        data.shippingFee > 0
          ? data.shippingFee
          : itemsSubtotal >= FREE_SHIPPING_THRESHOLD
            ? 0
            : SHIPPING_DEFAULT;
      const totalAmount = itemsSubtotal + computedShipping - data.discountAmount;
      if (totalAmount < 0) throw new Error("INVALID_TOTAL");

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session.user.id,
          status: "PENDING",
          totalAmount,
          shippingFee: computedShipping,
          discountAmount: data.discountAmount,
          receiverName: data.receiverName,
          receiverPhone: data.receiverPhone,
          postalCode: data.postalCode,
          address: data.address,
          addressDetail: data.addressDetail ?? null,
          memo: data.memo ?? null,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });

      // Clear ordered products from cart (best-effort within tx).
      await tx.cartItem.deleteMany({
        where: { userId: session.user.id, productId: { in: productIds } },
      });

      return created;
    });

    return ok(order, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ORDER_FAILED";
    if (msg.startsWith("OUT_OF_STOCK")) return fail("재고가 부족한 상품이 있습니다.", 409);
    if (msg.startsWith("PRODUCT_NOT_FOUND")) return fail("상품을 찾을 수 없습니다.", 404);
    if (msg === "INVALID_TOTAL") return fail("결제 금액이 올바르지 않습니다.");
    console.error("[orders.POST]", err);
    return fail("주문 생성 중 오류가 발생했습니다.", 500);
  }
}
