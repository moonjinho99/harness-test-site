import { db } from "@/lib/db"

// Structural Prisma shapes — kept local so the file typechecks even before
// `prisma generate` has run. Once the generated client is available these can
// be swapped back to `import type { Category, Product } from "@prisma/client"`.
// ponytail: local structural types; swap to generated Prisma types once `prisma generate` runs.
interface PrismaCategory {
  id: string
  name: string
  slug: string
  emoji: string
  createdAt: Date
}

interface PrismaProduct {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  originalPrice: number | null
  stock: number
  images: string[]
  categoryId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Legacy UI-facing shape (kept for existing components; extended with Prisma fields).
export interface Product {
  id: string
  slug: string
  name: string
  price: number
  originalPrice: number
  discount: number
  rating: number
  reviews: number
  category: string
  emoji: string
  accent: string
  description: string
  // Prisma-aligned fields (present in mock fallback, absent when purely Prisma-backed).
  categorySlug: string
  stock: number
  images: string[]
  createdAt: Date
}

export type ProductWithCategory = PrismaProduct & { category: PrismaCategory }

export const CATEGORIES = [
  "의류",
  "전자제품",
  "식품",
  "뷰티",
  "스포츠",
  "생활용품",
] as const

export type Category = (typeof CATEGORIES)[number]

const CATEGORY_SLUG_BY_NAME: Record<Category, string> = {
  의류: "clothing",
  전자제품: "electronics",
  식품: "food",
  뷰티: "beauty",
  스포츠: "sports",
  생활용품: "living",
}

const CATEGORY_EMOJI: Record<Category, string> = {
  의류: "👕",
  전자제품: "🎧",
  식품: "🍊",
  뷰티: "✨",
  스포츠: "👟",
  생활용품: "💡",
}

export const SORT_OPTIONS = [
  { value: "recommended", label: "추천순" },
  { value: "price_asc", label: "낮은 가격순" },
  { value: "price_desc", label: "높은 가격순" },
  { value: "discount", label: "할인율순" },
  { value: "rating", label: "평점순" },
] as const

export type SortValue = (typeof SORT_OPTIONS)[number]["value"]

const priceFormatter = new Intl.NumberFormat("ko-KR")
export function formatPrice(value: number): string {
  return `${priceFormatter.format(value)}원`
}
export function formatCount(value: number): string {
  return priceFormatter.format(value)
}

// -- Mock data ---------------------------------------------------------------

type MockSeed = Omit<Product, "categorySlug"> & { daysAgo: number }

const PRODUCT_SEEDS: readonly MockSeed[] = [
  {
    id: "1",
    slug: "premium-linen-shirt",
    name: "프리미엄 린넨 셔츠",
    price: 89000,
    originalPrice: 129000,
    discount: 31,
    rating: 4.8,
    reviews: 234,
    category: "의류",
    emoji: "👔",
    accent: "from-rose-200 to-rose-100",
    description:
      "통기성 좋은 프리미엄 린넨 원단으로 제작한 클래식 셔츠. 사계절 어울리는 미니멀 실루엣.",
    stock: 45,
    images: ["👔"],
    createdAt: new Date(),
    daysAgo: 1,
  },
  {
    id: "2",
    slug: "airpods-pro-silicone-case",
    name: "에어팟 프로 실리콘 케이스",
    price: 15900,
    originalPrice: 19900,
    discount: 20,
    rating: 4.6,
    reviews: 891,
    category: "전자제품",
    emoji: "🎧",
    accent: "from-indigo-200 to-indigo-100",
    description:
      "충격 흡수 실리콘 소재의 에어팟 프로 전용 케이스. 카라비너 포함, 무선 충전 지원.",
    stock: 200,
    images: ["🎧"],
    createdAt: new Date(),
    daysAgo: 2,
  },
  {
    id: "3",
    slug: "jeju-organic-tangerine-3kg",
    name: "제주 유기농 감귤 3kg",
    price: 22900,
    originalPrice: 29900,
    discount: 23,
    rating: 4.9,
    reviews: 1524,
    category: "식품",
    emoji: "🍊",
    accent: "from-amber-200 to-amber-100",
    description:
      "제주 서귀포 유기농 인증 농장에서 직송하는 제철 감귤. 당도 12brix 이상 선별.",
    stock: 80,
    images: ["🍊"],
    createdAt: new Date(),
    daysAgo: 3,
  },
  {
    id: "4",
    slug: "glow-serum-50ml",
    name: "글로우 세럼 50ml",
    price: 34500,
    originalPrice: 49000,
    discount: 30,
    rating: 4.7,
    reviews: 612,
    category: "뷰티",
    emoji: "✨",
    accent: "from-pink-200 to-pink-100",
    description:
      "비타민C 유도체와 나이아신아마이드가 결합된 브라이트닝 세럼. 민감성 피부 테스트 완료.",
    stock: 60,
    images: ["✨"],
    createdAt: new Date(),
    daysAgo: 4,
  },
  {
    id: "5",
    slug: "lightweight-running-sneakers",
    name: "경량 러닝 스니커즈",
    price: 79000,
    originalPrice: 118000,
    discount: 33,
    rating: 4.5,
    reviews: 347,
    category: "스포츠",
    emoji: "👟",
    accent: "from-emerald-200 to-emerald-100",
    description:
      "한 짝 220g의 초경량 러닝화. 반응형 미드솔로 장거리 러닝에도 편안한 쿠셔닝.",
    stock: 30,
    images: ["👟"],
    createdAt: new Date(),
    daysAgo: 5,
  },
  {
    id: "6",
    slug: "nordic-mood-lamp",
    name: "북유럽풍 무드등",
    price: 42000,
    originalPrice: 58000,
    discount: 28,
    rating: 4.8,
    reviews: 189,
    category: "생활용품",
    emoji: "💡",
    accent: "from-violet-200 to-violet-100",
    description:
      "따뜻한 색온도의 LED 무드등. 3단계 밝기 조절, USB-C 충전으로 어디서나 사용 가능.",
    stock: 25,
    images: ["💡"],
    createdAt: new Date(),
    daysAgo: 6,
  },
  {
    id: "7",
    slug: "cotton-oversized-tee",
    name: "코튼 오버사이즈 티셔츠",
    price: 29000,
    originalPrice: 39000,
    discount: 26,
    rating: 4.6,
    reviews: 512,
    category: "의류",
    emoji: "👕",
    accent: "from-sky-200 to-sky-100",
    description:
      "20수 프리미엄 코튼 원단의 오버핏 티셔츠. 워싱 후에도 형태 유지.",
    stock: 100,
    images: ["👕"],
    createdAt: new Date(),
    daysAgo: 7,
  },
  {
    id: "8",
    slug: "wireless-charging-pad",
    name: "고속 무선 충전 패드",
    price: 24900,
    originalPrice: 34900,
    discount: 29,
    rating: 4.4,
    reviews: 728,
    category: "전자제품",
    emoji: "🔌",
    accent: "from-slate-200 to-slate-100",
    description:
      "15W 고속 무선 충전 지원. Qi 인증 기기와 호환, 안전 온도 제어 회로 내장.",
    stock: 40,
    images: ["🔌"],
    createdAt: new Date(),
    daysAgo: 8,
  },
  {
    id: "9",
    slug: "handdrip-coffee-bean-set",
    name: "핸드드립 원두 3종 세트",
    price: 32000,
    originalPrice: 42000,
    discount: 24,
    rating: 4.9,
    reviews: 421,
    category: "식품",
    emoji: "☕",
    accent: "from-orange-200 to-orange-100",
    description:
      "에티오피아·콜롬비아·과테말라 스페셜티 원두 각 200g. 로스팅 후 7일 이내 발송.",
    stock: 150,
    images: ["☕"],
    createdAt: new Date(),
    daysAgo: 9,
  },
  {
    id: "10",
    slug: "hydrating-toner-200ml",
    name: "수분 진정 토너 200ml",
    price: 18900,
    originalPrice: 26000,
    discount: 27,
    rating: 4.5,
    reviews: 934,
    category: "뷰티",
    emoji: "💧",
    accent: "from-cyan-200 to-cyan-100",
    description:
      "히알루론산 5중 복합체 함유 수분 토너. 무향·무색소, 데일리 사용 권장.",
    stock: 90,
    images: ["💧"],
    createdAt: new Date(),
    daysAgo: 10,
  },
  {
    id: "11",
    slug: "yoga-mat-6mm",
    name: "논슬립 요가 매트 6mm",
    price: 34900,
    originalPrice: 49000,
    discount: 29,
    rating: 4.7,
    reviews: 268,
    category: "스포츠",
    emoji: "🧘",
    accent: "from-teal-200 to-teal-100",
    description:
      "TPE 친환경 소재 6mm 두께 요가 매트. 미끄럼 방지 텍스처, 캐리 스트랩 포함.",
    stock: 70,
    images: ["🧘"],
    createdAt: new Date(),
    daysAgo: 11,
  },
  {
    id: "12",
    slug: "ceramic-diffuser",
    name: "세라믹 아로마 디퓨저",
    price: 28000,
    originalPrice: 39000,
    discount: 28,
    rating: 4.6,
    reviews: 156,
    category: "생활용품",
    emoji: "🕯️",
    accent: "from-stone-200 to-stone-100",
    description:
      "핸드메이드 세라믹 아로마 디퓨저. 리드 스틱 6개, 시그니처 오일 100ml 포함.",
    stock: 35,
    images: ["🕯️"],
    createdAt: new Date(),
    daysAgo: 12,
  },
]

function buildMockProducts(): Product[] {
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  return PRODUCT_SEEDS.map((seed) => ({
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    price: seed.price,
    originalPrice: seed.originalPrice,
    discount: seed.discount,
    rating: seed.rating,
    reviews: seed.reviews,
    category: seed.category,
    emoji: seed.emoji,
    accent: seed.accent,
    description: seed.description,
    stock: seed.stock,
    images: seed.images,
    categorySlug: CATEGORY_SLUG_BY_NAME[seed.category as Category],
    createdAt: new Date(now - seed.daysAgo * day),
  }))
}

// -- Public API --------------------------------------------------------------

export type ProductSortBy = "newest" | "price_asc" | "price_desc"

export interface GetProductsOptions {
  categorySlug?: string
  // Legacy alias supported for existing callers that pass the Korean category name.
  category?: string
  sortBy?: ProductSortBy
  // Legacy alias.
  sort?: string
  page?: number
  limit?: number
}

export interface GetProductsResult {
  products: Product[]
  total: number
}

const DEFAULT_LIMIT = 12

function normalizeSort(opts: GetProductsOptions): string {
  return opts.sortBy ?? opts.sort ?? "recommended"
}

function sortProducts(list: Product[], sort: string): Product[] {
  const copy = [...list]
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price)
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price)
    case "discount":
      return copy.sort((a, b) => b.discount - a.discount)
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating)
    case "newest":
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    default:
      return copy
  }
}

function filterMock(opts: GetProductsOptions): Product[] {
  let all = buildMockProducts()
  if (opts.categorySlug) {
    all = all.filter((p) => p.categorySlug === opts.categorySlug)
  } else if (opts.category) {
    all = all.filter((p) => p.category === opts.category)
  }
  return sortProducts(all, normalizeSort(opts))
}

// ponytail: mock fallback until DATABASE_URL is populated; remove try/catch once DB is required.
export async function getProducts(
  opts: GetProductsOptions = {},
): Promise<GetProductsResult> {
  const page = opts.page ?? 1
  const limit = opts.limit ?? DEFAULT_LIMIT
  const sort = normalizeSort(opts)

  const orderBy =
    sort === "price_asc"
      ? { price: "asc" as const }
      : sort === "price_desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const }

  const where = {
    isActive: true,
    ...(opts.categorySlug
      ? { category: { slug: opts.categorySlug } }
      : opts.category
        ? { category: { name: opts.category } }
        : {}),
  }

  try {
    // ponytail: cast until `prisma generate` populates typed model accessors.
    const client = db as unknown as {
      product: {
        findMany: (args: unknown) => Promise<ProductWithCategory[]>
        findUnique: (args: unknown) => Promise<ProductWithCategory | null>
        count: (args: unknown) => Promise<number>
      }
      category: {
        findMany: (args: unknown) => Promise<PrismaCategory[]>
      }
    }
    const [rows, total] = await Promise.all([
      client.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      client.product.count({ where }),
    ])
    if (rows.length === 0 && total === 0) throw new Error("empty-db")
    return {
      products: rows.map((r: ProductWithCategory) => prismaToProduct(r)),
      total,
    }
  } catch (error) {
    console.warn(
      "[products] Prisma unavailable, using mock:",
      error instanceof Error ? error.message : error,
    )
    const filtered = filterMock(opts)
    const start = (page - 1) * limit
    return {
      products: filtered.slice(start, start + limit),
      total: filtered.length,
    }
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const client = db as unknown as {
      product: {
        findUnique: (args: unknown) => Promise<ProductWithCategory | null>
      }
    }
    const row = await client.product.findUnique({
      where: { slug },
      include: { category: true },
    })
    if (!row) throw new Error("not-found-in-db")
    return prismaToProduct(row)
  } catch (error) {
    console.warn(
      "[products] getProductBySlug Prisma error, using mock:",
      error instanceof Error ? error.message : error,
    )
    return buildMockProducts().find((p) => p.slug === slug) ?? null
  }
}

export async function getCategories(): Promise<PrismaCategory[]> {
  try {
    const client = db as unknown as {
      category: {
        findMany: (args: unknown) => Promise<PrismaCategory[]>
      }
    }
    const rows = await client.category.findMany({ orderBy: { name: "asc" } })
    if (rows.length === 0) throw new Error("empty-categories")
    return rows
  } catch (error) {
    console.warn(
      "[products] getCategories Prisma error, using mock:",
      error instanceof Error ? error.message : error,
    )
    return (CATEGORIES as readonly Category[]).map((name) => ({
      id: `mock-${CATEGORY_SLUG_BY_NAME[name]}`,
      name,
      slug: CATEGORY_SLUG_BY_NAME[name],
      emoji: CATEGORY_EMOJI[name],
      createdAt: new Date(),
    }))
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { products } = await getProducts({ limit: 6 })
  return products
}

// Map Prisma row into the UI-facing shape. Presentational fields fall back to defaults
// since the DB schema does not carry them.
function prismaToProduct(row: ProductWithCategory): Product {
  const discount =
    row.originalPrice && row.originalPrice > row.price
      ? Math.round(((row.originalPrice - row.price) / row.originalPrice) * 100)
      : 0
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    originalPrice: row.originalPrice ?? row.price,
    discount,
    rating: 0,
    reviews: 0,
    category: row.category.name,
    categorySlug: row.category.slug,
    emoji: row.images[0] ?? row.category.emoji,
    accent: "from-slate-200 to-slate-100",
    description: row.description ?? "",
    stock: row.stock,
    images: row.images,
    createdAt: row.createdAt,
  }
}
