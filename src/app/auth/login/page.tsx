import { redirect } from "next/navigation"
import { ShoppingBag } from "lucide-react"

import { auth } from "@/auth"
import { KakaoSigninButton } from "@/components/auth/kakao-signin-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type SearchParams = { callbackUrl?: string }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (session?.user) redirect("/")

  const { callbackUrl: rawCallback } = await searchParams
  const callbackUrl = rawCallback?.startsWith("/") ? rawCallback : "/"

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center gap-3 pt-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <ShoppingBag className="size-6" />
          </span>
          <CardTitle className="text-xl">
            노바<span className="text-indigo-600">몰</span>에 오신 것을 환영합니다
          </CardTitle>
          <CardDescription>
            카카오 계정으로 간편하게 로그인하고 쇼핑을 시작하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pb-6">
          <KakaoSigninButton callbackUrl={callbackUrl} />
          <p className="text-center text-xs text-muted-foreground">
            로그인 시 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
