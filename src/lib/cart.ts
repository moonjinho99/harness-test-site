import { db } from "@/lib/db"

// Cart/Order models may not exist in Prisma yet — keep this file resilient so
// the UI builds against a bare schema. Types intentionally mirror the shape
// the backend has promised in _workspace/01_feature_cart_checkout.md.
// ponytail: local structural types; swap to generated Prisma types when Cart/Order models land.

export interface CartLineProduct {
  id: string
  slug: string
  name: string
  price: number
  images: string[]
}

export interface CartLine {
  id: string
  productId: string
  quantity: number
  product: CartLineProduct
}

export interface CartTotals {
  subtotal: number
  shippingFee: number
  total: number
  itemCount: number
}

export const FREE_SHIPPING_THRESHOLD = 50000
export const SHIPPING_FEE = 3000

export function formatKRW(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`
}

export function calculateTotals(lines: readonly CartLine[]): CartTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0)
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0)
  const shippingFee =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  return { subtotal, shippingFee, total: subtotal + shippingFee, itemCount }
}

// Prisma model access via `any` — CartItem may not be in the generated client yet.
// The runtime catch keeps the UI usable during scaffolding.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any

export async function getCartLines(userId: string): Promise<CartLine[]> {
  try {
    const client = db as AnyDb
    if (!client.cartItem) return []
    const rows = await client.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    })
    return rows.map(
      (r: {
        id: string
        productId: string
        quantity: number
        product: {
          id: string
          slug: string
          name: string
          price: number
          images: string[]
        }
      }): CartLine => ({
        id: r.id,
        productId: r.productId,
        quantity: r.quantity,
        product: {
          id: r.product.id,
          slug: r.product.slug,
          name: r.product.name,
          price: r.product.price,
          images: r.product.images ?? [],
        },
      }),
    )
  } catch {
    return []
  }
}