# 02. 인증 아키텍처 (Kakao OAuth 단일 프로바이더)

> 카카오 소셜 로그인/회원가입을 NextAuth.js v5 (Auth.js beta) + Prisma Adapter + PostgreSQL 조합으로 구현하기 위한 설계 문서.
> 대상 스택: Next.js 16.3.0 (App Router), TypeScript 5, React 19.

## 0. 이전 결정에서의 변경 (`01_architecture.md` §2.4 대비)

| 항목 | 기존 계획 | 이번 결정 | 사유 |
|---|---|---|---|
| 세션 전략 | JWT 우선, 필요 시 Prisma Adapter로 전환 | **처음부터 Database Session (Prisma Adapter)** | 회원가입=주문/배송/포인트 이력의 시작점. OAuth-only 흐름에선 Adapter가 User/Account 테이블 자동 생성/링크를 담당하므로 별도 회원가입 폼이 없어도 성립. JWT로 시작하면 첫 결제/주문 붙이는 시점에 스키마 마이그레이션 재작업 필요. |
| 프로바이더 | Credentials + Google 1종 | **Kakao 단일** | 국내 사용자 커버리지 우선. Credentials는 회원가입 폼/비밀번호 정책/재설정 등 부수 화면 요구 → YAGNI. 필요 시 프로바이더 배열에 추가만 하면 됨. |
| 회원가입 UX | 별도 회원가입 페이지 | **첫 카카오 로그인 = 자동 회원가입** | Prisma Adapter가 최초 로그인 시 User/Account row 생성. 추가 프로필(닉네임/전화/약관 동의)은 후속 온보딩 페이지에서 수집. |

## 1. 인증 플로우

### 1.1 시퀀스 (첫 로그인 = 회원가입)

```
[Browser]                [Next.js /api/auth]        [Kakao]                 [Postgres]
   |                            |                       |                        |
   |--GET /login--------------->|                       |                        |
   |<--Kakao 버튼 렌더 (RSC)---|                       |                        |
   |                            |                       |                        |
   |--signIn("kakao") 클릭----->|                       |                        |
   |   (POST /api/auth/signin/kakao, CSRF token 포함)   |                        |
   |                            |--302 authorize------->|                        |
   |<---------- 302 to kakao.com --------------------- |                        |
   |                            |                       |                        |
   |--동의화면 로그인/승인----->|                       |                        |
   |<---302 /api/auth/callback/kakao?code=...&state=...-|                        |
   |                            |                       |                        |
   |--GET callback------------->|                       |                        |
   |                            |--code→access_token--->|                        |
   |                            |<---access_token-------|                        |
   |                            |--/v2/user/me--------->|                        |
   |                            |<---profile------------|                        |
   |                            |                       |                        |
   |                            |--PrismaAdapter        |                        |
   |                            |   .getUserByAccount---|----------------------->|
   |                            |<---(없음)-------------|<----null---------------|
   |                            |   .createUser         |----------------------->|
   |                            |   .linkAccount        |----------------------->|
   |                            |   .createSession      |----------------------->|
   |                            |                       |                        |
   |<--Set-Cookie: authjs.session-token=<opaque>--------|                        |
   |     HttpOnly; Secure; SameSite=Lax; Path=/         |                        |
   |<--302 /  (또는 callbackUrl) ---------------------- |                        |
```

### 1.2 시퀀스 (재방문 = 세션 재사용)

```
[Browser]                       [Next.js]                       [Postgres]
   |                                |                                |
   |--GET / (cookie 포함)---------->|                                |
   |                                |--auth() 서버 헬퍼              |
   |                                |  → adapter.getSessionAndUser   |
   |                                |----------------------------->|
   |                                |<--session row + user row------|
   |<--RSC 렌더 (session=User)----- |                                |
```

세션 만료(`session.expires < now()`)면 쿠키 무효화 후 익명 렌더. 클라이언트에서 `useSession()`은 `/api/auth/session`으로 폴링(옵션).

### 1.3 로그아웃

- `signOut()` 호출 → `POST /api/auth/signout` (CSRF 검증) → adapter가 `Session` row 삭제 → `Set-Cookie: authjs.session-token=; Max-Age=0`.

### 1.4 계정 링크 정책

- **단일 프로바이더이므로 다중 계정 링크는 지금 시점에 불필요.**
- 향후 다른 프로바이더 추가 시: `allowDangerousEmailAccountLinking`는 기본값(`false`) 유지. 이메일이 겹치더라도 자동 링크 금지 (계정 탈취 벡터).

## 2. Prisma 스키마

`prisma/schema.prisma` 초안. NextAuth v5 Prisma Adapter 표준 4개 테이블 + 쇼핑몰 확장 필드.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────────────────────
// NextAuth v5 Adapter 표준 테이블
// 참조: https://authjs.dev/getting-started/adapters/prisma
// ─────────────────────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique         // Kakao 비즈앱 미승인 시 null 가능 → nullable 유지
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]

  // ── 쇼핑몰 확장 필드 ──
  phone         String?                    // 카카오는 별도 동의항목. 최초엔 null.
  role          Role      @default(CUSTOMER)
  marketingOptIn Boolean  @default(false)  // 마케팅 수신 동의 (선택 약관)
  termsAgreedAt DateTime?                  // 필수 약관 동의 시각 (온보딩에서 채움)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 후속 도메인 관계 (다음 단계에서 정의)
  // orders    Order[]
  // addresses Address[]
  // cart      Cart?

  @@index([role])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String                    // "oauth"
  provider          String                    // "kakao"
  providerAccountId String                    // Kakao user id
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expires])                          // 만료 세션 청소 배치용
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ── 도메인 enum ──
enum Role {
  CUSTOMER
  ADMIN
}
```

### 2.1 스키마 결정 근거

- **`sessionToken` opaque 문자열 유지**: Auth.js가 서명·검증하지 않고 DB 조회로 신뢰. 서버 재기동/키 로테이션에도 세션 유지.
- **`refresh_token` / `access_token` 저장**: 카카오 API 재호출(예: 프로필 재동기화, 알림톡 자격) 필요 시 활용. 지금은 로그인만 하더라도 나중에 지우기 어려우니 처음부터 저장.
- **`Role` enum**: 관리자 페이지 진입 여부만 있으면 되는 초기엔 CUSTOMER/ADMIN 2단계로 충분. 세분화는 필요 시 확장.
- **`email` nullable**: 카카오 개발용 앱은 이메일 제공에 비즈니스 인증이 필요. 초기 개발/QA 환경에서 null이 정상 시나리오.
- **`termsAgreedAt`**: 콜백 직후 온보딩 페이지에서 필수 약관 동의를 받아 채운다. `null`이면 결제 라우트에서 차단.

## 3. 환경변수

`.env.local` (개발), 운영은 배포 플랫폼 시크릿 매니저.

```bash
# ── Auth.js v5 ──
AUTH_SECRET="<openssl rand -base64 33 결과값>"   # 필수. JWT 서명 & CSRF 토큰 서명에 사용
AUTH_URL="http://localhost:3000"                  # 프로덕션에서만 필수 (프리뷰/커스텀 도메인 시). 로컬은 자동감지.
AUTH_TRUST_HOST="true"                            # Vercel 이외의 호스트(자체 도메인) 배포 시 필요

# ── Kakao Provider ──
AUTH_KAKAO_ID="<카카오 개발자센터 앱의 REST API 키>"
AUTH_KAKAO_SECRET="<카카오 앱의 Client Secret (활성화 후 발급)>"

# ── Database ──
DATABASE_URL="postgresql://user:pass@localhost:5432/shop?schema=public"
# (선택) Prisma Migrate 전용 URL. Neon/Supabase 같이 pooling URL과 direct URL이 분리된 경우:
# DIRECT_URL="postgresql://user:pass@localhost:5432/shop?schema=public"
```

### 3.1 환경변수 검증

`src/lib/env.ts`에 zod 스키마로 부팅 시 검증. 누락되면 즉시 fail-fast.

```typescript
// src/lib/env.ts
import { z } from "zod";

const schema = z.object({
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 chars (use `openssl rand -base64 33`)"),
  AUTH_KAKAO_ID: z.string().min(1),
  AUTH_KAKAO_SECRET: z.string().min(1),
  DATABASE_URL: z.string().url(),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z.enum(["true", "false"]).optional(),
});

export const env = schema.parse(process.env);
```

### 3.2 카카오 개발자센터 콜솔 설정

앱 콘솔에서 다음이 일치해야 한다.

| 항목 | 개발 값 | 프로덕션 값 |
|---|---|---|
| 플랫폼 → Web → 사이트 도메인 | `http://localhost:3000` | `https://shop.example.com` |
| 카카오 로그인 → Redirect URI | `http://localhost:3000/api/auth/callback/kakao` | `https://shop.example.com/api/auth/callback/kakao` |
| 동의항목 | 닉네임(필수), 프로필 사진(선택), 이메일(비즈앱 승인 후) | 동일 |
| Client Secret | "코드 발급" 후 "활성화" 필수 | 활성화 |

## 4. 디렉토리 구조 (추가 파일 목록)

`_workspace/01_directory_structure.md` §"앞으로 추가 예정 디렉토리" 확장. 이번 페이즈에서 실제로 생성할 파일만 나열.

```
harness-test/
├── prisma/
│   └── schema.prisma                            # §2 스키마
├── .env.local                                   # §3 환경변수 (git 제외)
├── .env.example                                 # 팀 공유용 템플릿 (git 포함, 값은 비움)
└── src/
    ├── auth.ts                                  # NextAuth v5 최상위 설정 (auth, signIn, signOut, handlers export)
    ├── middleware.ts                            # 보호 라우트 미들웨어 (선택, §5.3 참고)
    ├── app/
    │   ├── api/
    │   │   └── auth/
    │   │       └── [...nextauth]/
    │   │           └── route.ts                 # `export const { GET, POST } = handlers`
    │   ├── auth/
    │   │   ├── login/
    │   │   │   └── page.tsx                     # "카카오로 시작하기" 버튼 (Client Component, signIn 호출)
    │   │   ├── error/
    │   │   │   └── page.tsx                     # OAuth 실패/거부 시 안내
    │   │   └── onboarding/
    │   │       └── page.tsx                     # 최초 로그인 후 약관 동의/전화번호 입력 (선택 단계)
    │   └── (shop)/
    │       └── account/
    │           └── page.tsx                     # 마이페이지 (auth() 서버 헬퍼로 세션 조회)
    ├── components/
    │   └── auth/
    │       ├── kakao-signin-button.tsx          # "use client" — signIn("kakao", { callbackUrl })
    │       └── user-menu.tsx                    # 헤더의 로그인/로그아웃 드롭다운
    └── lib/
        ├── auth.ts                              # (선택) auth() 재수출 헬퍼 — 순환참조 회피용
        ├── db.ts                                # Prisma 싱글톤 (01_architecture §2.3)
        └── env.ts                               # zod 환경변수 검증 (§3.1)
```

### 4.1 파일별 핵심 내용 스케치

**`src/auth.ts`** — Auth.js v5의 표준 진입점

```typescript
import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [Kakao],                     // AUTH_KAKAO_ID / AUTH_KAKAO_SECRET 자동 인식
  session: { strategy: "database" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      // 클라이언트로 노출할 필드만 명시적으로 매핑
      session.user.id = user.id;
      session.user.role = (user as { role?: "CUSTOMER" | "ADMIN" }).role ?? "CUSTOMER";
      return session;
    },
  },
});
```

**`src/app/api/auth/[...nextauth]/route.ts`**

```typescript
export { GET, POST } from "@/auth";  // handlers를 분해해 export
// 실제로는: import { handlers } from "@/auth"; export const { GET, POST } = handlers;
```

**`src/lib/db.ts`** — Prisma 싱글톤 (01_architecture §2.3 확정 패턴)

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**`src/app/auth/login/page.tsx`** — 서버 컴포넌트가 이미 로그인된 사용자를 리다이렉트

```typescript
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { KakaoSigninButton } from "@/components/auth/kakao-signin-button";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");
  return <KakaoSigninButton callbackUrl="/" />;
}
```

## 5. 보안 고려사항

### 5.1 세션 전략: Database

- **선택**: `session.strategy = "database"`.
- **쿠키**: `authjs.session-token` (프로덕션은 `__Secure-authjs.session-token`).
  - `HttpOnly` — JS 접근 차단, XSS로 세션 토큰 탈취 방지.
  - `Secure` — HTTPS 전용 (프로덕션 자동, 로컬 개발은 http 허용).
  - `SameSite=Lax` — CSRF 완화 + OAuth 리다이렉트 흐름 호환 (Strict면 콜백 시 쿠키 미전송).
  - `Path=/` — 전 라우트.
- **세션 값이 opaque 문자열**이라 서명키(`AUTH_SECRET`) 유출돼도 세션 위조 불가 (DB row 필요). JWT 대비 이점.
- **만료 기본 30일** — 로그인 편의성 우선. 결제 라우트는 별도로 최근 인증 재확인(step-up) 도입 여지 남김.
- **만료 세션 청소**: `Session.expires < now()` row는 배치 삭제 필요 (초기엔 무시, row 누적되면 pg_cron 또는 Vercel Cron으로 정리). `ponytail: cron 없이 시작, row 100k 넘으면 도입.`

### 5.2 CSRF

- **Auth.js v5 내장**: `POST /api/auth/signin/*`, `/api/auth/signout` 등 상태변경 엔드포인트는 double-submit 쿠키 (`authjs.csrf-token`) 로 자동 보호. 사용자 코드에서 별도 처리 불필요.
- **직접 API 라우트 작성 시**(예: `/api/checkout`): `auth()` 헬퍼로 세션 확인 + `SameSite=Lax` 쿠키에 의존 + 크로스 사이트 form 제출 없는지 확인. 필요 시 origin 헤더 검증 추가.
- **OAuth `state` 파라미터**: Auth.js가 자동 생성/검증. 리다이렉트 URI 하이재킹/replay 방지.

### 5.3 라우트 보호

미들웨어에서 전역 보호는 초기엔 최소화. 각 페이지에서 `auth()` 호출이 명시적이고 디버깅 쉽다.

```typescript
// src/middleware.ts (선택)
export { auth as middleware } from "@/auth";
export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/admin/:path*"],
};
```

- 이 매처에 걸린 라우트는 미인증 시 자동으로 `/auth/login`으로 리다이렉트.
- **관리자 라우트**(`/admin/*`): 미들웨어만으론 role 검사 불가 → 페이지 내부에서 `session.user.role === "ADMIN"` 확인 후 아니면 `notFound()`.

### 5.4 시크릿 관리

- `AUTH_SECRET`, `AUTH_KAKAO_SECRET`는 절대 클라이언트 번들에 노출 금지 (`NEXT_PUBLIC_` prefix 사용 금지).
- `.env.local`은 `.gitignore`에 있는지 확인 (create-next-app 기본 포함).
- 노출 의심 시: 카카오 콘솔에서 Client Secret 재발급 + `AUTH_SECRET` 재생성 후 기존 `Session` row 전체 삭제 (강제 재로그인).

### 5.5 로그아웃/탈퇴

- **로그아웃**: `Session` row 삭제 + 쿠키 무효화. 카카오 서버 세션은 유지됨(정상).
- **회원탈퇴** (후속 페이즈): `User.onDelete: Cascade`로 `Account`, `Session` 자동 삭제. 카카오에도 unlink API 호출 필요 (`/v1/user/unlink`, 저장된 `access_token` 사용). 주문 이력 등 법정 보존 대상은 soft delete로 전환 검토.

### 5.6 PII / 카카오 동의항목

- 카카오는 동의항목별 승인 필요. 초기엔 **닉네임 + 프로필 이미지**만 필수, 이메일/전화번호는 비즈앱 승인 후.
- 개발 모드에선 이메일 null이 정상. `User.email` unique 제약은 유지하되 nullable — Postgres에서 null unique는 여러 개 허용.
- 국내 개인정보보호법: 수집 시점(`termsAgreedAt`) + 항목 + 목적을 온보딩 페이지에서 명시적으로 동의 받아야 함.

### 5.7 보안 체크리스트 (커밋 전)

- [ ] `AUTH_SECRET` `.env.local`에만 존재, 커밋 안됨
- [ ] `AUTH_KAKAO_SECRET` 하드코딩 없음
- [ ] `signIn`/`signOut` 호출은 Auth.js가 제공하는 함수만 사용 (수동 fetch 금지 → CSRF 우회 리스크)
- [ ] `session.user`에 노출되는 필드는 `callbacks.session`에 명시적으로 매핑된 것만
- [ ] 프로덕션 배포 시 `AUTH_URL`이 실제 도메인과 일치, HTTPS
- [ ] 카카오 콘솔의 Redirect URI가 프로덕션 도메인과 정확히 일치 (trailing slash까지)

## 6. 설치 커맨드 요약 (구현 페이즈 참고용)

```bash
npm install next-auth@beta @auth/prisma-adapter @prisma/client zod
npm install -D prisma
npx prisma init --datasource-provider postgresql
# schema.prisma 작성 후
npx prisma migrate dev --name init_auth
npx prisma generate
```

## 7. 다음 단계

1. Prisma 초기화 + 스키마 마이그레이션 (`shop-backend`)
2. `src/auth.ts` + `[...nextauth]/route.ts` 배선 (`shop-backend`)
3. `/auth/login` 카카오 버튼 페이지 (`shop-frontend`)
4. 헤더 UserMenu (로그인/로그아웃/마이페이지 링크) (`shop-frontend`)
5. 온보딩 페이지 — 필수 약관 동의 + 전화번호 (`shop-frontend`, `shop-backend`)
6. 인증 E2E 시나리오 (카카오 개발 계정 사용) (`shop-qa`)

---

**전달 대상**
- `shop-backend`: §1 플로우, §2 스키마, §3 환경변수, §4.1 auth.ts/route.ts 스니펫
- `shop-frontend`: §4 디렉토리, §4.1 login/page.tsx 스니펫, §5.3 미들웨어
- `shop-qa`: 전체 문서 (특히 §1 시퀀스, §5 보안 체크리스트)