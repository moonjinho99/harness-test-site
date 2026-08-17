"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type Props = {
  orderId: string
}

export function OrderCancelButton({ orderId }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async () => {
    const confirmed =
      typeof window !== "undefined" &&
      window.confirm("정말 이 주문을 취소하시겠어요?")
    if (!confirmed) return
    setIsPending(true)
    setError(null)
    try {
      const res = await fetch("/api/payments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, cancelReason: "고객 요청" }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "주문 취소에 실패했어요.")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        onClick={handleCancel}
        disabled={isPending}
        className="text-rose-600 hover:text-rose-700"
      >
        {isPending ? "취소 요청 중..." : "주문 취소"}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}