import Link from "next/link"

import { ProductCard } from "@/components/shop/ProductCard"
import { CATEGORIES, getProducts } from "@/lib/products"

import { FilterBar, SortSelect } from "./filter-bar"

type SearchParams = Promise<{ category?: string; sort?: string }>

export const metadata = {
  title: "상품 목록 · 노바몰",
  description: "카테고리별로 엄선된 노바몰의 전체 상품을 만나보세요.",
}

function isValidCategory(value: string | undefined): value is string {
  if (!value) return false
  return (CATEGORIES as readonly string[]).includes(value)
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { category, sort } = await searchParams
  const activeCategory = isValidCategory(category) ? category : undefined
  const { products, total } = await getProducts({ category: activeCategory, sort })

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="mb-8 flex flex-col gap-1 sm:mb-10">
        <p className="text-sm font-medium text-indigo-600">Shop</p>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {activeCategory ? activeCategory : "전체 상품"}
          </h1>
          <span className="text-sm text-muted-foreground">
            총 <strong className="text-foreground">{total}</strong>개
            상품
          </span>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <FilterBar activeCategory={activeCategory} activeSort={sort} />

        <section aria-label="상품 목록">
          <div className="mb-4 hidden items-center justify-end lg:flex">
            <SortSelect activeSort={sort} />
          </div>

          {products.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden="true">
        🔍
      </span>
      <p className="mt-3 text-sm text-muted-foreground">
        해당 조건의 상품이 없어요.
      </p>
      <Link
        href="/products"
        className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        전체 상품 보기 →
      </Link>
    </div>
  )
}
