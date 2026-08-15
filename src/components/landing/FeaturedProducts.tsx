import Link from "next/link"

import { ProductCard } from "@/components/shop/ProductCard"
import { getFeaturedProducts } from "@/lib/products"

export async function FeaturedProducts() {
  const products = await getFeaturedProducts()

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
          <Link
            href="/products"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            더 많은 상품 보기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}