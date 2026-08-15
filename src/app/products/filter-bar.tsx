"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"

import { CATEGORIES, SORT_OPTIONS } from "@/lib/products"

const ALL_LABEL = "전체"

interface FilterBarProps {
  activeCategory?: string
  activeSort?: string
}

export function FilterBar({ activeCategory, activeSort }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const buildHref = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (!value) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const query = params.toString()
      return query ? `/products?${query}` : "/products"
    },
    [searchParams],
  )

  const handleCategoryClick = (category?: string) => {
    startTransition(() => {
      router.push(buildHref({ category }))
    })
  }

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    startTransition(() => {
      router.push(buildHref({ sort: value === "recommended" ? undefined : value }))
    })
  }

  const categories: (string | undefined)[] = [undefined, ...CATEGORIES]
  const selectedSort = activeSort ?? "recommended"

  return (
    <div
      className={`flex flex-col gap-6 lg:sticky lg:top-24 ${isPending ? "opacity-70" : ""}`}
    >
      {/* Desktop sidebar */}
      <aside className="hidden lg:block" aria-label="카테고리 필터">
        <h2 className="mb-3 text-sm font-semibold text-foreground">카테고리</h2>
        <ul className="flex flex-col gap-1">
          {categories.map((category) => {
            const isActive =
              category === undefined
                ? !activeCategory
                : activeCategory === category
            return (
              <li key={category ?? "all"}>
                <button
                  type="button"
                  onClick={() => handleCategoryClick(category)}
                  aria-pressed={isActive}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {category ?? ALL_LABEL}
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* Mobile horizontal chip strip */}
      <nav
        aria-label="카테고리 필터"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden"
      >
        {categories.map((category) => {
          const isActive =
            category === undefined
              ? !activeCategory
              : activeCategory === category
          return (
            <button
              key={category ?? "all"}
              type="button"
              onClick={() => handleCategoryClick(category)}
              aria-pressed={isActive}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                isActive
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-border/70 bg-card text-muted-foreground hover:border-indigo-200 hover:text-foreground"
              }`}
            >
              {category ?? ALL_LABEL}
            </button>
          )
        })}
      </nav>

      {/* Sort dropdown (mobile shows inline here; desktop version rendered in page) */}
      <div className="lg:hidden">
        <label
          htmlFor="sort-mobile"
          className="mb-1 block text-xs font-medium text-muted-foreground"
        >
          정렬
        </label>
        <select
          id="sort-mobile"
          value={selectedSort}
          onChange={handleSortChange}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

interface SortSelectProps {
  activeSort?: string
}

export function SortSelect({ activeSort }: SortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (value === "recommended") {
      params.delete("sort")
    } else {
      params.set("sort", value)
    }
    const query = params.toString()
    startTransition(() => {
      router.push(query ? `/products?${query}` : "/products")
    })
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">정렬</span>
      <select
        value={activeSort ?? "recommended"}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
