import Link from "next/link"
import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "인증 서버 설정에 문제가 있습니다. 잠시 후 다시 시도해 주세요.",
  AccessDenied: "카카오 로그인 접근이 거부되었습니다. 권한을 확인해 주세요.",
  Verification: "인증 링크가 만료되었거나 이미 사용되었습니다.",
  OAuthAccountNotLinked:
    "이미 다른 방식으로 가입된 계정입니다. 기존 로그인 방법을 이용해 주세요.",
  Default: "로그인 중 오류가 발생했습니다. 다시 시도해 주세요.",
}

type SearchParams = { error?: string }

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { error } = await searchParams
  const message = ERROR_MESSAGES[error ?? "Default"] ?? ERROR_MESSAGES.Default

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center gap-3 pt-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </span>
          <CardTitle className="text-xl">로그인 오류</CardTitle>
          <CardDescription>{message}</CardDescription>
          {error && error in ERROR_MESSAGES && (
            <p className="text-xs text-muted-foreground">에러 코드: {error}</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pb-6">
          <Button render={<Link href="/auth/login" />}>
            로그인 페이지로 돌아가기
          </Button>
          <Button variant="ghost" render={<Link href="/" />}>
            홈으로
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
