const CATEGORIES = [
  { name: "의류", emoji: "👗", tint: "from-rose-100 to-rose-50" },
  { name: "전자제품", emoji: "🎧", tint: "from-indigo-100 to-indigo-50" },
  { name: "식품", emoji: "🥗", tint: "from-emerald-100 to-emerald-50" },
  { name: "뷰티", emoji: "💄", tint: "from-pink-100 to-pink-50" },
  { name: "스포츠", emoji: "⚽", tint: "from-amber-100 to-amber-50" },
  { name: "생활용품", emoji: "🏠", tint: "from-violet-100 to-violet-50" },
]

export function CategorySection() {
  return (
    <section
      id="categories"
      aria-labelledby="categories-heading"
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mb-10 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">Categories</p>
          <h2
            id="categories-heading"
            className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            원하는 카테고리를 골라보세요
          </h2>
        </div>
        <a
          href="#categories"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          전체보기 →
        </a>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {CATEGORIES.map((category) => (
          <li key={category.name}>
            <a
              href={`#category-${category.name}`}
              className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 dark:hover:border-indigo-800/60 dark:hover:shadow-none"
            >
              <span
                className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${category.tint} text-2xl transition-transform group-hover:scale-110 dark:opacity-90`}
                aria-hidden="true"
              >
                {category.emoji}
              </span>
              <span className="text-sm font-medium text-foreground">
                {category.name}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}