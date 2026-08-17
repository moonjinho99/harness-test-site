"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/link-button"

type Status = "confirming" | "success" | "failed"

export default function CheckoutSuccessPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<Status>("confirming")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const paymentKey = params.get("paymentKey")
  const orderId = params.get("orderId")
  const amount = params.get("amount")

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setStatus("failed")
      setErrorMessage("결제 정보가 올바르지 않아요.")
      return
    }
    const controller = new AbortController()
    ;(async () => {
      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
          signal: controller.signal,
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string
          }
          throw new Error(body.error ?? "결제 승인에 실패했어요.")
        }
        setStatus("success")
        router.replace(`/order/complete?orderNumber=${encodeURIComponent(orderId)}`)
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        setStatus("failed")
        setErrorMessage(err instanceof Error ? err.message : "알 수 없는 오류")
      }
    })()
    return () => controller.abort()
  }, [paymentKey, orderId, amount, router])

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center px-4 py-16">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          {status === "confirming" && (
            <>
              <span className="text-4xl" aria-hidden="true">
                ⏳
              </span>
              <h1 className="text-lg font-semibold">결제를 승인하는 중이에요</h1>
              <p className="text-sm text-muted-foreground">
                잠시만 기다려주세요.
              </p>
            </>
          )}
          {status === "success" && (
            <>
              <span className="text-4xl" aria-hidden="true">
                ✅
              </span>
              <h1 className="text-lg font-semibold">결제가 완료되었어요</h1>
              <p className="text-sm text-muted-foreground">
                주문 완료 페이지로 이동합니다...
              </p>
            </>
          )}
          {status === "failed" && (
            <>
              <span className="text-4xl" aria-hidden="true">
                ⚠️
              </span>
              <h1 className="text-lg font-semibold">결제 승인에 실패했어요</h1>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <div className="mt-2 flex w-full gap-2">
                <LinkButton href="/cart" variant="outline" className="flex-1">
                  장바구니로
                </LinkButton>
                <LinkButton href="/checkout" className="flex-1">
                  다시 시도
                </LinkButton>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}