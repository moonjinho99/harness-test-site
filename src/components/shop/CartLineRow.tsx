"use client"

import Link from "next/link"
import { Minus, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatKRW, type CartLine } from "@/lib/cart"

type Props = {
  line: CartLine
  isPending: boolean
  onQuantityChange: (itemId: string, next: number) => void
  onRemove: (itemId: string) => void
}

export function CartLineRow({
  line,
  isPending,
  onQuantityChange,
  onRemove,
}: Props) {
  const { product, quantity } = line
  const lineTotal = product.price * quantity
  const cover = product.images[0]

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-3xl" aria-hidden="true">
            📦
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-1 text-sm font-medium hover:text-indigo-600"
        >
          {product.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          단가 {formatKRW(product.price)}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div
            role="group"
            aria-label="수량 조절"
            className="flex items-center rounded-md border border-border"
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label="수량 감소"
              disabled={isPending || quantity <= 1}
              onClick={() => onQuantityChange(line.id, quantity - 1)}
              className="size-8 rounded-r-none"
            >
              <Minus className="size-4" />
            </Button>
            <span
              aria-live="polite"
              className="min-w-8 px-2 text-center text-sm font-medium tabular-nums"
            >
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="수량 증가"
              disabled={isPending}
              onClick={() => onQuantityChange(line.id, quantity + 1)}
              className="size-8 rounded-l-none"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="상품 삭제"
            disabled={isPending}
            onClick={() => onRemove(line.id)}
            className="text-muted-foreground hover:text-rose-600"
          >
            <Trash2 className="mr-1 size-4" />
            삭제
          </Button>
        </div>
      </div>

      <div className="text-right sm:min-w-24">
        <p className="text-xs text-muted-foreground">소계</p>
        <p className="text-base font-semibold">{formatKRW(lineTotal)}</p>
      </div>
    </Card>
  )
}