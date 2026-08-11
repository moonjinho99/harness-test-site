import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ShoppingCart, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCount, formatPrice, getProductBySlug } from "@/lib/products"

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: "상품을 찾을 수 없습니다 · 노바몰" }
  return {
    title: `${product.name} · 노바몰`,
    description: product.description,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Params
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        목록으로 돌아가기
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div
          className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${product.accent}`}
          aria-hidden="true"
        >
          <span className="text-9xl">{product.emoji}</span>
          {product.discount > 0 && (
            <Badge
              variant="default"
              className="absolute top-5 left-5 bg-rose-500 text-white"
            >
              -{product.discount}%
            </Badge>
          )}
        </div>

        <div className="flex flex-col">
          <Badge variant="secondary" className="w-fit">
            {product.category}
          </Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Star
              aria-hidden="true"
              className="size-4 fill-amber-400 stroke-amber-400"
            />
            <span className="font-medium text-foreground">
              {product.rating}
            </span>
            <span>· 리뷰 {formatCount(product.reviews)}</span>
          </div>

          <Separator className="my-6" />

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-foreground">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
            <span className="text-sm font-semibold text-rose-500">
              -{product.discount}%
            </span>
          </div>

          <p className="mt-6 leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="flex-1" disabled>
              <ShoppingCart />
              장바구니 담기
            </Button>
            <Button size="lg" variant="outline" className="flex-1" disabled>
              바로 구매하기
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            * 결제 기능은 준비 중입니다.
          </p>
        </div>
      </div>
    </main>
  )
}
