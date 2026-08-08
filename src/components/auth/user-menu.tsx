"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { User } from "lucide-react"
import type { Session } from "next-auth"

import { Button } from "@/components/ui/button"
import { handleSignOut } from "@/lib/auth-actions"

type Props = {
  session: Session | null
}

export function UserMenu({ session }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [isOpen])

  if (!session?.user) {
    return (
      <Button
        variant="outline"
        size="sm"
        render={<Link href="/auth/login" />}
        className="hidden sm:inline-flex"
      >
        <User />
        로그인
      </Button>
    )
  }

  const { name, image } = session.user
  const displayName = name ?? "회원"
  const initial = displayName.slice(0, 1)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-border/60 bg-background py-1 pr-3 pl-1 text-sm font-medium transition-colors hover:bg-muted"
      >
        {image ? (
          <Image
            src={image}
            alt=""
            width={28}
            height={28}
            className="size-7 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700"
          >
            {initial}
          </span>
        )}
        <span className="hidden max-w-24 truncate sm:inline">{displayName}</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border border-border/60 bg-background shadow-lg"
        >
          <div className="border-b border-border/40 px-3 py-2 text-xs text-muted-foreground">
            {displayName}
          </div>
          <Link
            role="menuitem"
            href="/mypage"
            className="block px-3 py-2 text-sm hover:bg-muted"
            onClick={() => setIsOpen(false)}
          >
            마이페이지
          </Link>
          <form action={handleSignOut}>
            <button
              role="menuitem"
              type="submit"
              className="block w-full px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
            >
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
