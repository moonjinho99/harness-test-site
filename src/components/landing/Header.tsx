"use client"

import { useState } from "react"
import { Menu, ShoppingBag, ShoppingCart, User, X } from "lucide-react"

import { Button } from "@/components/ui/button"

const NAV_LINKS = [
  { href: "#home", label: "홈" },
  { href: "#products", label: "상품" },
  { href: "#categories", label: "카테고리" },
  { href: "#events", label: "이벤트" },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleToggle = () => setIsMenuOpen((prev) => !prev)
  const handleClose = () => setIsMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <ShoppingBag className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            노바<span className="text-indigo-600">몰</span>
          </span>
        </a>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="장바구니"
            className="relative"
          >
            <ShoppingCart />
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold text-white">
              3
            </span>
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <User />
            로그인
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="메뉴 열기"
            className="md:hidden"
            onClick={handleToggle}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleClose}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <Button variant="outline" size="sm" className="mt-2 w-full">
              <User />
              로그인
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}