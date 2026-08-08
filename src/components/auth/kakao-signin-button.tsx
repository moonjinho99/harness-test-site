"use client"

import { signIn } from "next-auth/react"

type Props = {
  callbackUrl?: string
}

export function KakaoSigninButton({ callbackUrl = "/" }: Props) {
  const handleClick = () => {
    signIn("kakao", { callbackUrl })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="카카오 계정으로 로그인"
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-4 text-sm font-semibold text-black shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEE500] disabled:opacity-60"
    >
      <span
        aria-hidden
        className="flex size-5 items-center justify-center rounded-sm bg-black text-[10px] font-bold text-[#FEE500]"
      >
        K
      </span>
      카카오로 시작하기
    </button>
  )
}