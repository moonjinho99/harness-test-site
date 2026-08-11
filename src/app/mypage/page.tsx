import Image from "next/image"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProfileForm } from "./profile-form"

export const metadata = { title: "마이페이지 | 노바몰" }

export default async function MyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/mypage")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      phone: true,
      role: true,
      marketingOptIn: true,
      createdAt: true,
    },
  })

  if (!user) redirect("/auth/login?callbackUrl=/mypage")

  const displayName = user.name ?? "회원"
  const joinDate = user.createdAt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <main className="min-h-svh bg-muted/30 px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">마이페이지</h1>

        {/* 프로필 카드 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {user.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-700">
                  {displayName.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-lg font-semibold">{displayName}</p>
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                    {user.role === "ADMIN" ? "관리자" : "회원"}
                  </Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">가입일: {joinDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 프로필 수정 */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">프로필 수정</CardTitle>
          </CardHeader>
          <Separator className="mt-4" />
          <CardContent className="pt-6">
            <ProfileForm
              name={user.name ?? ""}
              phone={user.phone ?? ""}
              marketingOptIn={user.marketingOptIn}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
