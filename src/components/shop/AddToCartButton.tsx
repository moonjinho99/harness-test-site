"use client"

import { ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type Props = {
  productId: string
  stock: number
}

type Status = "idle" | "loading" | "added" | "error"

export function AddToCartButton({ productId, stock }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)

  const outOfStock = stock <= 0

  async function addToCart(): Promise<boolean> {
    setStatus("loading")
    setError(null)
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    })
    if (res.status === 401) {
      router.push(`/auth/signin?callbackUrl=/products`)
      return false
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setError(body.error ?? "담기에 실패했어요.")
      setStatus("error")
      return false
    }
    return true
  }

  async function handleAddToCart() {
    const ok = await addToCart()
    if (!ok) return
    setStatus("added")
    setTimeout(() => setStatus("idle"), 2000)
  }

  async function handleBuyNow() {
    const ok = await addToCart()
    if (!ok) return
    router.push("/cart")
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="flex-1"
          onClick={handleAddToCart}
          disabled={outOfStock || status === "loading"}
        >
          <ShoppingCart className="mr-2 size-4" />
          {status === "added"
            ? "담겼어요 ✓"
            : status === "loading"
              ? "처리 중..."
              : outOfStock
                ? "품절"
                : "장바구니 담기"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={handleBuyNow}
          disabled={outOfStock || status === "loading"}
        >
          바로 구매하기
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}
