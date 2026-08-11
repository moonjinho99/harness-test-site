"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { updateProfile } from "@/lib/user-actions"

type Props = {
  name: string
  phone: string
  marketingOptIn: boolean
}

export function ProfileForm({ name, phone, marketingOptIn }: Props) {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setStatus(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)

    setIsPending(false)
    if (result?.error) {
      setStatus({ type: "error", message: result.error })
    } else {
      setStatus({ type: "success", message: "프로필이 저장되었습니다." })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          이름 <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={name}
          required
          maxLength={50}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="이름을 입력하세요"
        />
      </div>

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
