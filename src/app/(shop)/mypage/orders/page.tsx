import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { Card, CardContent } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/link-button"
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge"
import { formatKRW } from "@/lib/cart"
import { getOrdersForUser } from "@/lib/orders"

type SearchParams = Promise<{ page?: string }>

export const metadata = { title: "주문 내역 | 노바몰" }

const PAGE_SIZE = 10

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/mypage/orders")
  }

  const { page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage) || 1)
  const { orders, total } = await getOrdersForUser(session.user.id, {
    page,
    pageSize: PAGE_SIZE,
  })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="mb-8 flex items-baseline justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">My Page</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            주문 내역
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          총 <strong className="text-foreground">{total}</strong>건
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card px-6 py-16 text-center">
          <span className="text-4xl" aria-hidden="true">
            📦
          </span>
          <p className="mt-3 text-sm text-muted-foreground">
            아직 주문 내역이 없어요.
          </p>
          <LinkButton href="/products" className="mt-4">
            쇼핑하러 가기
          </LinkButton>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Card>
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={order.status} />
                      <time
                        dateTime={order.createdAt.toISOString()}
                        className="text-xs text-muted-foreground"
                      >
                        {order.createdAt.toLocaleDateString("ko-KR")}
                      </time>
                    </div>
                    <Link
                      href={`/mypage/orders/${encodeURIComponent(order.orderNumber)}`}
                      className="text-sm font-medium hover:text-indigo-600"
                    >
                      {order.items[0]?.productName ?? "주문 상품"}
                      {order.items.length > 1 &&
                        ` 외 ${order.items.length - 1}건`}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">
                      {order.orderNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                    <span className="text-base font-semibold">
                      {formatKRW(order.totalAmount)}
                    </span>
                    <LinkButton
                      href={`/mypage/orders/${encodeURIComponent(order.orderNumber)}`}
                      variant="ghost"
                      size="sm"
                    >
                      상세 보기 →
                    </LinkButton>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="페이지네이션"
          className="mt-8 flex items-center justify-center gap-2"
        >
          {page > 1 && (
            <LinkButton
              href={`/mypage/orders?page=${page - 1}`}
              variant="outline"
              size="sm"
            >
              이전
            </LinkButton>
          )}
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <LinkButton
              href={`/mypage/orders?page=${page + 1}`}
              variant="outline"
              size="sm"
            >
              다음
            </LinkButton>
          )}
        </nav>
      )}
    </main>
  )
}