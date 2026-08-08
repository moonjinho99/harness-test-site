import { ArrowRight, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-indigo-950/40 dark:via-background dark:to-violet-950/40"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.25), transparent 45%), radial-gradient(circle at 80% 60%, rgba(168,85,247,0.20), transparent 40%)",
        }}
      />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-10 px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <Badge
          variant="outline"
          className="border-indigo-200 bg-white/70 text-indigo-700 backdrop-blur-sm dark:border-indigo-800/60 dark:bg-background/60 dark:text-indigo-300"
        >
          <Sparkles />
          2026 신년 특가 시즌 오픈
        </Badge>

        <div className="flex flex-col items-center gap-6">
          <h1
            id="hero-heading"
            className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            매일의 발견,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              노바몰에서 만나요
            </span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            엄선된 브랜드와 오늘의 특가, 그리고 무료 배송까지.
            <br className="hidden sm:block" />
            취향을 아는 커머스, 노바몰에서 지금 시작하세요.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" className="min-w-40">
            쇼핑 시작하기
            <ArrowRight />
          </Button>
          <Button size="lg" variant="outline" className="min-w-40">
            신상품 보기
          </Button>
        </div>

        <dl className="grid w-full max-w-3xl grid-cols-3 gap-4 pt-6 text-center sm:gap-8">
          {[
            { value: "12만+", label: "누적 고객" },
            { value: "4.9", label: "평균 평점" },
            { value: "48h", label: "빠른 배송" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <dt className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {stat.value}
              </dt>
              <dd className="text-xs font-medium text-muted-foreground sm:text-sm">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}