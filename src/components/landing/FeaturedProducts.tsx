import { ShoppingCart, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Product {
  id: string
  name: string
  price: number
  originalPrice: number
  discount: number
  rating: number
  reviews: number
  category: string
  emoji: string
  accent: string
}

const FEATURED_PRODUCTS: readonly Product[] = [
  {
    id: "1",
    name: "프리미엄 린넨 셔츠",
    price: 89000,
    originalPrice: 129000,
    discount: 31,
    rating: 4.8,
    reviews: 234,
    category: "의류",
    emoji: "👔",
    accent: "from-rose-200 to-rose-100",
  },
  {
    id: "2",
    name: "에어팟 프로 실리콘 케이스",
    price: 15900,
    originalPrice: 19900,
    discount: 20,
    rating: 4.6,
    reviews: 891,
    category: "전자제품",
    emoji: "🎧",
    accent: "from-indigo-200 to-indigo-100",
  },
  {
    id: "3",
    name: "제주 유기농 감귤 3kg",
    price: 22900,
    originalPrice: 29900,
    discount: 23,
    rating: 4.9,
    reviews: 1524,
    category: "식품",
    emoji: "🍊",
    accent: "from-amber-200 to-amber-100",
  },
  {
    id: "4",
    name: "글로우 세럼 50ml",
    price: 34500,
    originalPrice: 49000,
    discount: 30,
    rating: 4.7,
    reviews: 612,
    category: "뷰티",
    emoji: "✨",
    accent: "from-pink-200 to-pink-100",
  },
  {
    id: "5",
    name: "경량 러닝 스니커즈",
    price: 79000,
    originalPrice: 118000,
    discount: 33,
    rating: 4.5,
    reviews: 347,
    category: "스포츠",
    emoji: "👟",
    accent: "from-emerald-200 to-emerald-100",
  },
  {
    id: "6",
    name: "북유럽풍 무드등",
    price: 42000,
    originalPrice: 58000,
    discount: 28,
    rating: 4.8,
    reviews: 189,
    category: "생활용품",
    emoji: "💡",
    accent: "from-violet-200 to-violet-100",
  },
]

const priceFormatter = new Intl.NumberFormat("ko-KR")

function formatPrice(value: number): string {
  return `${priceFormatter.format(value)}원`
}

export function FeaturedProducts() {
  return (
    <section
      id="products"
      aria-labelledby="products-heading"
      className="bg-muted/30 py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-indigo-600">Best Picks</p>
            <h2
              id="products-heading"
              className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              이번 주 인기 상품
            </h2>
          </div>
          <a
            href="#products"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            더 많은 상품 보기 →
          </a>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface ProductCardProps {
  product: Product
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="group transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/40 dark:hover:shadow-none">
      <div
        className={`relative -mx-4 -mt-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-xl bg-gradient-to-br ${product.accent}`}
        style={{ marginLeft: 0, marginRight: 0, marginTop: 0 }}
        aria-hidden="true"
      >
        <span className="text-6xl transition-transform duration-500 group-hover:scale-110">
          {product.emoji}
        </span>
        <Badge
          variant="default"
          className="absolute top-3 left-3 bg-rose-500 text-white"
        >
          -{product.discount}%
        </Badge>
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
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>· 리뷰 {priceFormatter.format(product.reviews)}</span>
        </div>
      </CardContent>

      <CardFooter className="!bg-transparent !border-t-0 !pt-0">
        <Button className="w-full" size="lg">
          <ShoppingCart />
          장바구니 담기
        </Button>
      </CardFooter>
    </Card>
  )
}