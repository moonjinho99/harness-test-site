"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/link-button"
import { Separator } from "@/components/ui/separator"
import {
  calculateTotals,
  formatKRW,
  FREE_SHIPPING_THRESHOLD,
  type CartLine,
} from "@/lib/cart"

import { CartLineRow } from "./CartLineRow"

type Props = {
  initialLines: CartLine[]
}

export function CartView({ initialLines }: Props) {
  const [lines, setLines] = useState<CartLine[]>(initialLines)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const totals = useMemo(() => calculateTotals(lines), [lines])
  const shippingHint =
    totals.subtotal > 0 && totals.subtotal < FREE_SHIPPING_THRESHOLD
      ? `${formatKRW(FREE_SHIPPING_THRESHOLD - totals.subtotal)} 더 담으면 무료배송`
      : totals.subtotal >= FREE_SHIPPING_THRESHOLD
        ? "무료배송"
        : ""

  const handleQuantityChange = (itemId: string, next: number) => {
    if (next < 1) return
    const previous = lines
    setLines((current) =>
      current.map((l) => (l.id === itemId ? { ...l, quantity: next } : l)),
    )
    startTransition(async () => {
      try {
        const res = await fetch(`/api/cart/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: next }),
        })
        if (!res.ok) throw new Error("update failed")
        setError(null)
      } catch {
        setLines(previous)
        setError("수량 변경에 실패했어요. 다시 시도해주세요.")
      }
    })
  }

  const handleRemove = (itemId: string) => {
    const previous = lines
    setLines((current) => current.filter((l) => l.id !== itemId))
    startTransition(async () => {
      try {
        const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" })
        if (!res.ok) throw new Error("delete failed")
        setError(null)
      } catch {
        setLines(previous)
        setError("삭제에 실패했어요. 다시 시도해주세요.")
      }
    })
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card px-6 py-20 text-center">
        <span className="text-4xl" aria-hidden="true">
          🛒
        </span>
        <p className="mt-3 text-base font-medium">장바구니가 비어있어요</p>
        <p className="mt-1 text-sm text-muted-foreground">
          마음에 드는 상품을 담아보세요.
        </p>
        <LinkButton href="/products" className="mt-6">
          쇼핑 계속하기
        </LinkButton>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section aria-label="장바구니 상품 목록" className="flex flex-col gap-3">
        {error && (
          <div
            role="alert"
            className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </div>
        )}
        {lines.map((line) => (
          <CartLineRow
            key={line.id}
            line={line}
            isPending={isPending}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
          />
        ))}
      </section>

      <aside aria-label="주문 요약" className="lg:sticky lg:top-24 lg:h-fit">
        <Card>
          <CardContent className="flex flex-col gap-3 p-6">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">상품 소계</span>
              <span className="font-medium">{formatKRW(totals.subtotal)}</span>
            </div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">배송비</span>
              <span className="font-medium">
                {totals.shippingFee === 0 ? "무료" : formatKRW(totals.shippingFee)}
              </span>
            </div>
            {shippingHint && (
              <p className="text-xs text-indigo-600">{shippingHint}</p>
            )}
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">최종 결제금액</span>
              <span className="text-lg font-semibold">
                {formatKRW(totals.total)}
              </span>
            </div>
            <LinkButton href="/checkout" size="lg" className="mt-2 w-full">
              주문하기
            </LinkButton>
            <LinkButton href="/products" variant="ghost" className="w-full">
              쇼핑 계속하기
            </LinkButton>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}