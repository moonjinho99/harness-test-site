import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/auth"
import { Card, CardContent } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/link-button"
import { Separator } from "@/components/ui/separator"
import { OrderCancelButton } from "@/components/shop/OrderCancelButton"
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge"
import { formatKRW } from "@/lib/cart"
import { getOrderByNumber } from "@/lib/orders"

type Params = Promise<{ orderNumber: string }>

export const metadata = { title: "주문 상세 | 노바몰" }

export default async function OrderDetailPage({ params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/mypage/orders")
  }
  const { orderNumber } = await params
  const order = await getOrderByNumber(orderNumber, session.user.id)
  if (!order) notFound()

  const canCancel = order.status === "PENDING" || order.status === "PAID"

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6">
        <Link
          href="/mypage/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 주문 내역으로
        </Link>
      </div>

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">주문 상세</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {order.orderNumber}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-3 p-6">
            <h2 className="text-sm font-semibold">주문 상품</h2>
            <ul className="flex flex-col gap-3">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  {item.productSlug ? (
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="line-clamp-1 pr-2 hover:text-indigo-600"
                    >
                      {item.productName} × {item.quantity}
                    </Link>
                  ) : (
                    <span className="line-clamp-1 pr-2">
                      {item.productName} × {item.quantity}
                    </span>
                  )}
                  <span className="shrink-0 font-medium">
                    {formatKRW(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm font-medium">결제 금액</span>
              <span className="text-lg font-semibold">
                {formatKRW(order.totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 p-6 text-sm sm:grid-cols-2">
            <h2 className="col-span-full text-sm font-semibold">배송 정보</h2>
            <InfoRow label="받는 분" value={order.shippingRecipient} />
            <InfoRow label="연락처" value={order.shippingPhone} />
            <InfoRow
              label="주소"
              value={order.shippingAddress}
              className="sm:col-span-2"
            />
            <InfoRow
              label="배송 메모"
              value={order.shippingMemo}
              className="sm:col-span-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 p-6 text-sm sm:grid-cols-2">
            <h2 className="col-span-full text-sm font-semibold">결제 정보</h2>
            <InfoRow label="결제 수단" value={order.paymentMethod} />
            <InfoRow
              label="결제 일시"
              value={order.paidAt?.toLocaleString("ko-KR") ?? null}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <LinkButton href="/mypage/orders" variant="ghost">
            목록으로
          </LinkButton>
          {canCancel && <OrderCancelButton orderId={order.id} />}
        </div>
      </div>
    </main>
  )
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string
  value: string | null
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value ?? "-"}</p>
    </div>
  )
}