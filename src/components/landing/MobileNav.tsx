"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, User, X } from "lucide-react"
import type { Session } from "next-auth"

import { Button } from "@/components/ui/button"
import { handleSignOut } from "@/lib/auth-actions"

type NavLink = {
  href: string
  label: string
}

type Props = {
  links: ReadonlyArray<NavLink>
  session: Session | null
}

export function MobileNav({ links, session }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClose = () => setIsOpen(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={isOpen}
        className="md:hidden"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {isOpen && (
        <div className="absolute inset-x-0 top-16 border-t border-border/60 bg-background md:hidden">
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleClose}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}

            {session?.user ? (
              <>
                <Link
                  href="/mypage"
                  onClick={handleClose}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  마이페이지 ({session.user.name ?? "회원"})
                </Link>
                <form action={handleSignOut} className="mt-2">
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    로그아웃
                  </Button>
                </form>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/auth/login" />}
                className="mt-2 w-full"
                onClick={handleClose}
              >
                <User />
                로그인
              </Button>
            )}
          </nav>
        </div>
      )}
    </>
  )
}