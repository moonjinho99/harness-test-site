import { db } from "@/lib/db"

// Order/OrderItem may not exist in the generated Prisma client yet.
// Structural types below match the shape backend has committed to; runtime
// access goes through `any` + try/catch so UI builds against a bare schema.
// ponytail: local types; replace when Prisma Order model lands.

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED"
  | "REFUNDED"

export interface OrderItemSummary {
  id: string
  productName: string
  productSlug: string | null
  quantity: number
  price: number
  image: string | null
}

export interface OrderSummary {
  id: string
  orderNumber: string
  status: OrderStatus
  totalAmount: number
  createdAt: Date
  items: OrderItemSummary[]
}

export interface OrderDetail extends OrderSummary {
  shippingRecipient: string | null
  shippingPhone: string | null
  shippingAddress: string | null
  shippingMemo: string | null
  paymentMethod: string | null
  paidAt: Date | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any

const KNOWN_STATUSES: readonly OrderStatus[] = [
  "PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
  "REFUNDED",
]

function normalizeStatus(raw: unknown): OrderStatus {
  return typeof raw === "string" &&
    (KNOWN_STATUSES as readonly string[]).includes(raw)
    ? (raw as OrderStatus)
    : "PENDING"
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(item: any): OrderItemSummary {
  return {
    id: String(item.id ?? ""),
    productName: String(item.productName ?? item.product?.name ?? "상품"),
    productSlug: item.product?.slug ?? null,
    quantity: Number(item.quantity ?? 1),
    price: Number(item.price ?? item.product?.price ?? 0),
    image: item.product?.images?.[0] ?? null,
  }
}

export async function getOrdersForUser(
  userId: string,
  opts: { page?: number; pageSize?: number } = {},
): Promise<{ orders: OrderSummary[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1)
  const pageSize = Math.max(1, Math.min(50, opts.pageSize ?? 10))
  try {
    const client = db as AnyDb
    if (!client.order) return { orders: [], total: 0 }
    const [rows, total] = await Promise.all([
      client.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: { include: { product: true } },
          payment: true,
        },
      }),
      client.order.count({ where: { userId } }),
    ])
    return {
      total,
      orders: rows.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any): OrderSummary => ({
          id: String(r.id),
          orderNumber: String(r.orderNumber),
          status: normalizeStatus(r.status),
          totalAmount: Number(r.totalAmount ?? 0),
          createdAt: new Date(r.createdAt),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: (r.items ?? []).map(mapItem),
        }),
      ),
    }
  } catch {
    return { orders: [], total: 0 }
  }
}

export async function getOrderByNumber(
  orderNumber: string,
  userId?: string,
): Promise<OrderDetail | null> {
  try {
    const client = db as AnyDb
    if (!client.order) return null
    const row = await client.order.findFirst({
      where: {
        orderNumber,
        ...(userId ? { userId } : {}),
      },
      include: {
        items: { include: { product: true } },
        payment: true,
      },
    })
    if (!row) return null
    const address = row.address ?? ""
    const postal = row.postalCode ? `(${row.postalCode}) ` : ""
    const detail = row.addressDetail ? ` ${row.addressDetail}` : ""
    return {
      id: String(row.id),
      orderNumber: String(row.orderNumber),
      status: normalizeStatus(row.status),
      totalAmount: Number(row.totalAmount ?? 0),
      createdAt: new Date(row.createdAt),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (row.items ?? []).map(mapItem),
      shippingRecipient: row.receiverName ?? null,
      shippingPhone: row.receiverPhone ?? null,
      shippingAddress: address ? `${postal}${address}${detail}` : null,
      shippingMemo: row.memo ?? null,
      paymentMethod: row.payment?.method ?? null,
      paidAt: row.payment?.approvedAt ? new Date(row.payment.approvedAt) : null,
    }
  } catch {
    return null
  }
}