import { ShoppingBag, ShoppingCart } from "lucide-react"
import Link from "next/link"

import { auth } from "@/auth"
import { UserMenu } from "@/components/auth/user-menu"
import { Button } from "@/components/ui/button"
import { MobileNav } from "@/components/landing/MobileNav"

const NAV_LINKS = [
  { href: "/", label: "홈" },
  { href: "/#products", label: "상품" },
  { href: "/#categories", label: "카테고리" },
  { href: "/#events", label: "이벤트" },
] as const

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2">
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
          <Link
            href="/cart"
            aria-label="장바구니"
            className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ShoppingCart className="size-4" />
          </Link>
          <UserMenu session={session} />
          <MobileNav links={NAV_LINKS} session={session} />
        </div>
      </div>
    </header>
  )
}