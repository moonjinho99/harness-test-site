import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { Card, CardContent } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/link-button"
import { Separator } from "@/components/ui/separator"
import { formatKRW } from "@/lib/cart"
import { getOrderByNumber } from "@/lib/orders"

type SearchParams = Promise<{ orderNumber?: string }>

export const metadata = { title: "주문 완료 | 노바몰" }

export default async function OrderCompletePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { orderNumber } = await searchParams
  const session = await auth()
  if (!session?.user?.id) {
    const cb = orderNumber
      ? `/order/complete?orderNumber=${encodeURIComponent(orderNumber)}`
      : "/order/complete"
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(cb)}`)
  }
  const order = orderNumber
    ? await getOrderByNumber(orderNumber, session.user.id)
    : null

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6">
      <Card>
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-5xl" aria-hidden="true">
              🎉
            </span>
            <h1 className="text-2xl font-semibold">주문이 완료되었습니다</h1>
            <p className="text-sm text-muted-foreground">
              주문해주셔서 감사합니다. 결제 확인 후 빠르게 준비해드릴게요.
            </p>
          </div>

          <div className="rounded-lg bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">주문번호</p>
            <p className="mt-1 font-mono text-sm font-medium">
              {orderNumber ?? "확인 중"}
            </p>
          </div>

          {order ? (
            <>
              <section aria-label="주문 상품">
                <h2 className="mb-3 text-sm font-semibold">주문 상품</h2>
                <ul className="flex flex-col gap-2">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="line-clamp-1 pr-2">
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="shrink-0 font-medium">
                        {formatKRW(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-medium">결제 금액</span>
                <span className="text-lg font-semibold">
                  {formatKRW(order.totalAmount)}
                </span>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              주문 상세 정보를 불러올 수 없어요. 주문 내역에서 확인해주세요.
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <LinkButton href="/products" variant="outline" className="flex-1">
              쇼핑 계속하기
            </LinkButton>
            <LinkButton href="/mypage/orders" className="flex-1">
              주문 내역 보기
            </LinkButton>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}