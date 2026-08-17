"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/link-button"

export default function CheckoutFailPage() {
  const params = useSearchParams()
  const code = params.get("code")
  const message = params.get("message") ?? "결제가 취소되었거나 실패했어요."

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center px-4 py-16">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <span className="text-4xl" aria-hidden="true">
            ❌
          </span>
          <h1 className="text-lg font-semibold">결제에 실패했어요</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          {code && (
            <p className="text-xs text-muted-foreground">에러 코드: {code}</p>
          )}
          <div className="mt-2 flex w-full gap-2">
            <LinkButton href="/cart" variant="outline" className="flex-1">
              장바구니로
            </LinkButton>
            <LinkButton href="/checkout" className="flex-1">
              다시 시도
            </LinkButton>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}