# QA 보고서 — 카카오 소셜 로그인

**대상:** NextAuth v5 + Kakao Provider + Prisma Adapter (DB Session)
**검증일:** 2026-08-08
**검증 범위:** 코드 정합성 · 보안 체크리스트 · 클라이언트/서버 경계 · 타입 정합성 (인증 페이즈 한정, E2E/런타임 검증은 DB 설정 이후)

---

## 결과 요약: PASS-WITH-WARNINGS

- CRITICAL: 0건
- HIGH: 1건 (본 QA에서 즉시 수정 완료)
- MEDIUM: 2건
- LOW: 2건

---

## CRITICAL (0건)

없음. `AUTH_SECRET`/`AUTH_KAKAO_SECRET` 하드코딩 없음, `NEXT_PUBLIC_` prefix 오용 없음, `session.user` 노출 필드는 `callbacks.session`에 명시 매핑된 것뿐, `signIn`/`signOut`은 `next-auth`/`@/auth` 제공 함수로만 호출됨.

---

## HIGH (1건 — 수정 완료)

### [HIGH-1] `src/lib/env.ts` 부팅 시 실행되지 않아 zod 검증 무력화 → **수정 완료**
- **위치:** `src/lib/env.ts` (import되는 곳이 어디에도 없었음)
- **재현:** 프로젝트 전체에서 `from "@/lib/env"` 참조 0건. `.env.local`에서 `AUTH_SECRET`이나 `DATABASE_URL`이 누락돼도 앱이 정상 부팅되어, 콜백 시점 또는 Prisma 첫 호출 시점에야 불명확한 에러로 죽음.
- **영향:** 설계 문서 §3.1 "부팅 시 fail-fast" 계약이 코드에 반영되지 않음. 배포 파이프라인이 조용히 잘못된 시크릿으로 뜰 위험.
- **수정 방향:** `src/auth.ts` 최상단에 `import "@/lib/env"` 추가 → 앱 부팅 시 `schema.parse(process.env)`가 실행되어 누락 시 즉시 throw.
- **적용:** `src/auth.ts`에 side-effect import 1줄 추가 (diff 완료).

```ts
// src/auth.ts
import "@/lib/env"; // fail-fast: 환경변수 zod 검증을 부팅 시 강제 실행
```

---

## MEDIUM (2건)

### [MED-1] `env.ts`가 `AUTH_URL` HTTPS 강제 안 함
- **위치:** `src/lib/env.ts:8`
- **재현:** `AUTH_URL: z.string().url().optional()` — `http://malicious.example/…` 도 통과.
- **영향:** 프로덕션 배포 시 실수로 http 값이 들어가면 쿠키가 `Secure` 없이 발급될 수 있음.
- **수정 방향:** 프로덕션에서만 `startsWith("https://")` 를 요구하는 refinement 추가. YAGNI라면 최소한 배포 문서에 명시. (본 페이즈는 로컬 개발 위주라 보고만.)

### [MED-2] `.env.example`에 설계 문서에 명시된 선택 변수 누락
- **위치:** `.env.example`
- **재현:** 파일에 `AUTH_URL`, `AUTH_TRUST_HOST`, `DIRECT_URL` 없음. `env.ts` 스키마엔 optional로 정의되어 있으나 팀 공유용 템플릿엔 존재하지 않아 배포 시 누락 위험.
- **영향:** Vercel 이외 배포/pooling URL 사용 시 트러블슈팅 지연.
- **수정 방향:** `.env.example`에 주석과 함께 optional 키 추가.

---

## LOW (2건)

### [LOW-1] `session` 콜백에서 `user`를 `as { role?: … }`로 캐스팅
- **위치:** `src/auth.ts:17`
- **영향:** Prisma Adapter가 넘겨주는 `user`는 `@prisma/client`의 `User` 타입이 아닌 NextAuth `AdapterUser`. `role` 필드는 커스텀 컬럼이라 타입 단언이 필요하지만, 이후 필드 추가 시 오타 감지가 안 됨.
- **수정 방향:** Prisma 생성 타입으로 좁히거나, `AdapterUser` 모듈 확장(`declare module "@auth/core/adapters"`). 현재 필드 1개라 유지 가능.

### [LOW-2] `user-menu.tsx`에서 `<img>` 태그 사용 (Next.js `<Image>` 미사용)
- **위치:** `src/components/auth/user-menu.tsx:59`
- **영향:** Kakao CDN 아바타 최적화 미적용. `eslint-disable` 주석 있음 — 의도적.
- **수정 방향:** `next.config`의 `images.remotePatterns`에 `k.kakaocdn.net` 추가 후 `<Image>`로 전환하면 LCP 개선. 지금은 랜딩 페이지가 로그인 상태에서만 노출되는 소형 아바타라 보류 가능.

---

## 검증 항목별 결과

| 항목 | 결과 | 비고 |
|---|---|---|
| `AUTH_SECRET`/`AUTH_KAKAO_SECRET` 하드코딩 여부 | PASS | 코드/`.env.example` 모두 빈 값 |
| `NEXT_PUBLIC_` prefix 민감 변수 여부 | PASS | 없음 |
| `session.user` 필드 명시적 매핑 | PASS | `id`, `role`만 매핑, 타입도 일치 |
| `signIn`/`signOut` 수동 fetch 사용 여부 | PASS | 모두 `next-auth/react` 또는 `@/auth` 함수 |
| middleware matcher 커버리지 | PASS | `/account/*`, `/checkout/*`, `/admin/*` — 설계 문서 §5.3과 일치 |
| `/auth/login` 로그인된 사용자 리다이렉트 | PASS | `if (session?.user) redirect("/")` |
| `handleSignOut` 서버 액션 | PASS | `"use server"` + `signOut({ redirectTo: "/" })` |
| Session 타입 확장 (`next-auth.d.ts`) ↔ `callbacks.session` 정합 | PASS | `id: string`, `role: "CUSTOMER" \| "ADMIN"` 일치 |
| Header → UserMenu 세션 전달 타입 | PASS | `auth()` 반환 `Session \| null` → `Session \| null` prop |
| Prisma Adapter 필수 4테이블 (User/Account/Session/VerificationToken) | PASS | 스키마 완전 |
| `onDelete: Cascade` 설정 | PASS | Account/Session 모두 `onDelete: Cascade` |
| `enum Role` ↔ TS 타입 일치 | PASS | `CUSTOMER \| ADMIN` 일치 |
| `"use client"` 파일에서 서버 모듈 import | PASS | client 파일들은 `next-auth`, `next-auth/react`, `next/link`, `@/lib/auth-actions` (server action)만 사용 — `@/auth`, `@/lib/db` 직접 import 없음 |
| Header.tsx 서버 컴포넌트 전환 | PASS | `"use client"` 없음, `useState` 없음, `async function` |
| `kakao-signin-button.tsx`가 `next-auth/react` signIn 사용 | PASS | client 컴포넌트 규약 준수 |
| **env.ts 부팅 시 실행** | **FIXED** | 위 HIGH-1 참조 |

---

## 합격 근거

1. 보안 체크리스트(§5.7) 6개 항목 모두 충족.
2. 클라이언트/서버 경계가 깔끔 — 서버 전용(`@/auth`, `@/lib/db`, Prisma)은 `Header.tsx`(RSC)와 `handleSignOut`(server action)에만 존재, 클라이언트 컴포넌트는 세션을 prop으로만 수신.
3. Prisma Adapter 표준 스키마와 커스텀 필드(`role`, `phone`, `termsAgreedAt`, `marketingOptIn`)가 설계 문서(§2)와 완전 일치.
4. HIGH-1은 QA에서 즉시 수정 → 재검증 불필요한 side-effect import 한 줄.

## 불합격 요소

없음. PASS-WITH-WARNINGS는 MEDIUM 2건(문서/배포 편의), LOW 2건(스타일)에 대한 표시일 뿐 릴리즈 차단 사유는 아님.

---

## 사용자 필수 액션

**본 페이즈는 코드 정합성만 검증했고, 실제 카카오 로그인 E2E는 아래 3가지가 세팅되어야 실행 가능하다.**

### 1. PostgreSQL DB 설정 및 마이그레이션

```bash
# 로컬 Postgres 준비 (Docker 예시)
docker run -d --name shop-pg -e POSTGRES_PASSWORD=pass -e POSTGRES_USER=user -e POSTGRES_DB=shop -p 5432:5432 postgres:16

# 스키마 반영
npx prisma migrate dev --name init_auth
npx prisma generate
```

### 2. `.env.local` 작성

프로젝트 루트에 생성 (git 무시). `.env.example` 참조:

```bash
AUTH_SECRET="<openssl rand -base64 33 결과값>"
AUTH_KAKAO_ID="<카카오 개발자센터 앱의 REST API 키>"
AUTH_KAKAO_SECRET="<카카오 앱 Client Secret (활성화된 값)>"
DATABASE_URL="postgresql://user:pass@localhost:5432/shop?schema=public"
# 프로덕션에서만: AUTH_URL="https://your.domain", AUTH_TRUST_HOST="true"
```

`AUTH_SECRET` 32자 미만이면 부팅 시 zod가 즉시 throw (HIGH-1 수정 효과).

### 3. 카카오 개발자센터 콘솔 설정

카카오 developers.kakao.com → 내 애플리케이션 → 선택:

| 항목 | 개발 값 |
|---|---|
| 플랫폼 → Web → 사이트 도메인 | `http://localhost:3000` |
| 카카오 로그인 → 활성화 | ON |
| 카카오 로그인 → Redirect URI | `http://localhost:3000/api/auth/callback/kakao` |
| 보안 → Client Secret | "코드 발급" 후 **"활성화"** 반드시 |
| 동의항목 | 닉네임(필수), 프로필 사진(선택). 이메일은 비즈앱 승인 후. |

**주의:** Redirect URI trailing slash까지 정확히 일치해야 하며, 콘솔의 REST API 키가 `AUTH_KAKAO_ID`, Client Secret이 `AUTH_KAKAO_SECRET`이다 (헷갈리기 쉬움).

---

## 다음 QA 페이즈 예약 항목

1. 실제 카카오 로그인 E2E (Playwright, 세션 쿠키 확인)
2. `/mypage` 라우트 미들웨어 차단 검증 (`matcher`에 `/mypage` 미포함 — 설계 문서는 `/account/*`, 컴포넌트는 `/mypage` 링크 사용 → 다음 페이즈에서 경로 통일 필요)
3. 로그아웃 후 세션 row 실제 삭제 여부 (Prisma inspect)
4. `OAuthAccountNotLinked` 시나리오 (다른 provider 추가 후)