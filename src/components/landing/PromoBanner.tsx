"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Flame } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const SALE_DURATION_MS = 1000 * 60 * 60 * 36 // 36 hours

interface TimeLeft {
  hours: string
  minutes: string
  seconds: string
}

function getInitialDeadline(): number {
  return Date.now() + SALE_DURATION_MS
}

function computeTimeLeft(deadline: number): TimeLeft {
  const diff = Math.max(0, deadline - Date.now())
  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  return {
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  }
}

export function PromoBanner() {
  const [deadline] = useState<number>(getInitialDeadline)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    computeTimeLeft(getInitialDeadline())
  )

  useEffect(() => {
    setTimeLeft(computeTimeLeft(deadline))
    const id = setInterval(() => {
      setTimeLeft(computeTimeLeft(deadline))
    }, 1000)
    return () => clearInterval(id)
  }, [deadline])

  return (
    <section
      id="events"
      aria-labelledby="promo-heading"
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 sm:p-12 lg:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.25), transparent 40%)",
          }}
        />

        <div className="relative flex flex-col items-start gap-6 text-white lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4">
            <Badge
              variant="outline"
              className="w-fit border-white/40 bg-white/10 text-white backdrop-blur"
            >
              <Flame />
              한정 특가
            </Badge>
            <h2
              id="promo-heading"
              className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
            >
              전 상품 최대 <span className="text-amber-300">70% 할인</span>
            </h2>
            <p className="max-w-lg text-sm text-white/80 sm:text-base">
              신년 맞이 초특가 이벤트, 놓치면 후회하는 딱 오늘의 가격.
            </p>

            <div
              className="flex items-center gap-2 pt-2"
              aria-label="세일 종료까지 남은 시간"
            >
              <TimeBlock label="시간" value={timeLeft.hours} />
              <span className="text-2xl font-semibold text-white/70">:</span>
              <TimeBlock label="분" value={timeLeft.minutes} />
              <span className="text-2xl font-semibold text-white/70">:</span>
              <TimeBlock label="초" value={timeLeft.seconds} />
            </div>
          </div>

          <Button
            size="lg"
            className="bg-white text-indigo-700 hover:bg-white/90"
          >
            지금 바로 쇼핑하기
            <ArrowRight />
          </Button>
        </div>
      </div>
    </section>
  )
}

interface TimeBlockProps {
  value: string
  label: string
}

function TimeBlock({ value, label }: TimeBlockProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="flex min-w-14 items-center justify-center rounded-xl bg-black/25 px-3 py-2 font-mono text-xl font-semibold tabular-nums backdrop-blur sm:text-2xl">
        {value}
      </span>
      <span className="text-[10px] font-medium tracking-wider text-white/70 uppercase">
        {label}
      </span>
    </div>
  )
}