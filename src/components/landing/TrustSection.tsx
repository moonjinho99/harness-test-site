import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface TrustItem {
  icon: LucideIcon
  title: string
  description: string
}

const TRUST_ITEMS: readonly TrustItem[] = [
  {
    icon: Truck,
    title: "무료 배송",
    description: "5만원 이상 구매 시 전국 무료 배송",
  },
  {
    icon: RotateCcw,
    title: "30일 무료 반품",
    description: "받아본 뒤 마음에 들지 않아도 걱정 없이",
  },
  {
    icon: ShieldCheck,
    title: "안전한 결제",
    description: "토스페이먼츠로 안전하게 결제 처리",
  },
  {
    icon: Headphones,
    title: "24시간 고객센터",
    description: "언제든 채팅과 전화로 도와드립니다",
  },
]

export function TrustSection() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <h2 id="trust-heading" className="sr-only">
        노바몰이 신뢰받는 이유
      </h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <li
              key={item.title}
              className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-6 transition-colors hover:border-indigo-200 dark:hover:border-indigo-800/60"
            >
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm"
              >
                <Icon className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}