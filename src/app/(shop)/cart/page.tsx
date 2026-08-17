import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { CartView } from "@/components/shop/CartView"
import { getCartLines } from "@/lib/cart"

export const metadata = { title: "장바구니 | 노바몰" }

export default async function CartPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/cart")
  }

  const lines = await getCartLines(session.user.id)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-indigo-600">Cart</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          장바구니
        </h1>
      </header>
      <CartView initialLines={lines} />
    </main>
  )
}