import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { CheckoutForm } from "@/components/shop/CheckoutForm"
import { getCartLines } from "@/lib/cart"
import { db } from "@/lib/db"

export const metadata = { title: "주문/결제 | 노바몰" }

export default async function CheckoutPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/checkout")
  }

  const lines = await getCartLines(session.user.id)
  if (lines.length === 0) {
    redirect("/cart")
  }

  let user: { id: string; name: string | null; email: string | null; phone: string | null } | null =
    null
  try {
    user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, phone: true },
    })
  } catch {
    user = { id: session.user.id, name: null, email: null, phone: null }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-indigo-600">Checkout</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          주문 / 결제
        </h1>
      </header>
      <CheckoutForm
        cartLines={lines}
        user={user ?? { id: session.user.id, name: null, email: null, phone: null }}
      />
    </main>
  )
}