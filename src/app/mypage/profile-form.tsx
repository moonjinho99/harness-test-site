"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { updateProfile } from "@/lib/user-actions"

type Props = {
  phone: string
  marketingOptIn: boolean
}

export function ProfileForm({ phone, marketingOptIn }: Props) {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setStatus(null)

    const formData = new FormData(e.currentTarget)
    try {
      const result = await updateProfile(formData)
      if (result?.error) {
        setStatus({ type: "error", message: result.error })
      } else {
        setStatus({ type: "success", message: "프로필이 저장되었습니다." })
        setTimeout(() => setStatus(null), 3000)
      }
    } catch {
      setStatus({ type: "error", message: "오류가 발생했습니다. 다시 시도해주세요." })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
          전화번호
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="010-0000-0000"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="marketingOptIn"
          name="marketingOptIn"
          type="checkbox"
          defaultChecked={marketingOptIn}
          value="true"
          className="size-4 rounded border-input accent-indigo-600"
        />
        <label htmlFor="marketingOptIn" className="text-sm">
          마케팅 수신 동의 (이벤트·혜택 알림)
        </label>
      </div>

      {status && (
        <p
          className={`text-sm ${
            status.type === "success" ? "text-green-600" : "text-destructive"
          }`}
        >
          {status.message}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "저장 중..." : "저장하기"}
      </Button>
    </form>
  )
}
