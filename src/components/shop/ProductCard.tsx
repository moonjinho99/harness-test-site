import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCount, formatPrice, type Product } from "@/lib/products"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      aria-label={`${product.name} 상세 보기`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      <Card className="group h-full transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/40 dark:hover:shadow-none">
        <div
          className={`relative -mx-4 -mt-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-xl bg-gradient-to-br ${product.accent}`}
          style={{ marginLeft: 0, marginRight: 0, marginTop: 0 }}
          aria-hidden="true"
        >
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <span className="text-6xl transition-transform duration-500 group-hover:scale-110">
              {product.emoji}
            </span>
          )}
          {product.discount > 0 && (
            <Badge
              variant="default"
              className="absolute top-3 left-3 bg-rose-500 text-white"
            >
              -{product.discount}%
            </Badge>
          )}
        </div>

        <CardHeader>
          <p className="text-xs font-medium text-muted-foreground">
            {product.category}
          </p>
          <CardTitle className="line-clamp-1">{product.name}</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-foreground">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star
              aria-hidden="true"
              className="size-3.5 fill-amber-400 stroke-amber-400"
            />
            <span className="font-medium text-foreground">
              {product.rating}
            </span>
            <span>· 리뷰 {formatCount(product.reviews)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
