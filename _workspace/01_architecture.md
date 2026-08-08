# 01. 아키텍처 초안

> 쇼핑몰 Next.js 프로젝트의 기술 스택 확정, 초기 설계 결정, 랜딩 페이지 구성 계획.

## 1. 기술 스택 (확정)

| 레이어 | 채택 기술 | 비고 |
|---|---|---|
| 프레임워크 | **Next.js 16.3.0** (App Router) | 요청은 v14였으나 `create-next-app@latest` 기본 설치. React 19 필요, `next.config.ts` 사용. 다운그레이드 원하면 별도 지시 필요. |
| 언어 | TypeScript 5 | `strict` 기본 활성화. `@/*` → `src/*` 별칭. |
| UI 프리미티브 | **shadcn/ui** (`base-nova` style, `neutral` baseColor) | RSC 지원. lucide 아이콘. `components.json`으로 설정 고정. 초기 컴포넌트: `button`, `badge`, `card`, `separator`. |
| 스타일링 | **Tailwind CSS v4** (`@tailwindcss/postcss`) | shadcn init이 `globals.css`에 CSS 변수 토큰 주입. `tailwind.config`은 v4에서 선택. |
| 인증 | **NextAuth.js v5 (Auth.js)** | 이후 단계에서 `src/lib/auth.ts`에 설정. 크리덴셜/OAuth 프로바이더는 요구사항 확정 후 결정. |
| ORM / DB | **Prisma + PostgreSQL** | 스키마·마이그레이션은 별도 단계. `DATABASE_URL` 환경변수 사용. |
| 린트 | ESLint 9 + `eslint-config-next` | flat config (`eslint.config.mjs`). |

### 설치 확인
- `package.json` 의 `dependencies`/`devDependencies` 그대로 유지.
- shadcn init이 `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/*`, `lucide-react` 자동 설치.

## 2. 주요 설계 결정

### 2.1 App Router + 라우트 그룹
- 랜딩/마케팅 페이지는 `(marketing)` 그룹, 쇼핑 도메인은 `(shop)` 그룹으로 분리해 URL은 유지한 채 레이아웃만 분기.
- 인증 페이지는 `app/auth/` 하위. NextAuth v5의 라우트 핸들러(`app/api/auth/[...nextauth]/route.ts`)를 사용.

### 2.2 서버 컴포넌트 우선
- 기본은 RSC. 상호작용 필요 컴포넌트만 `"use client"` 명시.
- 상품 조회 등 데이터 페칭은 Server Component 내부에서 직접 Prisma 호출 → 별도 API 레이어 없이 시작(YAGNI). REST/RPC가 필요해지면 그때 도입.

### 2.3 Prisma 접근 방식
- `src/lib/db.ts`에 개발/프로덕션 안전 싱글톤 패턴(`globalThis.prisma`) 적용.
- 환경변수는 `src/lib/env.ts`에서 검증(zod 예정). 스키마는 `prisma/schema.prisma`.
- DB 연결은 다음 단계에서 진행. 랜딩만 우선 구축.

### 2.4 인증(NextAuth v5) 계획
- `auth()` 헬퍼로 서버 컴포넌트에서 세션 조회.
- 세션 저장: 초기에는 JWT 전략, 사용자 프로필/주문 이력 등장 시 Prisma 어댑터로 전환 검토.
- 프로바이더: 최소 크리덴셜 + OAuth 1종(예: Google). 확정 전엔 하드코딩 금지.

### 2.5 컴포넌트 계층
```
components/
├── ui/          # shadcn 프리미티브 (편집 최소화)
├── sections/    # 랜딩 페이지의 큰 섹션 단위
└── shop/        # 도메인 컴포넌트 (ProductCard, PriceTag 등)
```
- 도메인 로직은 `src/features/{domain}` 또는 `src/server/`에 분리(필요 시). 지금은 파일이 없으므로 생성하지 않음.

### 2.6 스타일 토큰
- shadcn init이 `globals.css`에 CSS 변수(`--background`, `--foreground`, `--primary`, ...)를 배치.
- 다크모드는 `next-themes` 미도입 상태. 필요 시 도입.

### 2.7 검증/에러 처리
- 입력 검증은 zod로 통일(추후 도입). 서버 액션 진입점에서 검증.
- 서버 에러는 App Router의 `error.tsx`로 캐치, UI에는 사용자 친화적 메시지, 로그에는 원본 스택.

## 3. 랜딩 페이지 구성 계획

랜딩은 `src/app/page.tsx` (또는 `app/(marketing)/page.tsx`)에서 다음 섹션을 순서대로 렌더링. 각 섹션은 `src/components/sections/`에 독립 파일로 배치해 재사용/재정렬을 용이하게 함.

### 3.1 Hero
- 목적: 스토어 아이덴티티 + 대표 CTA.
- 구성 요소: 배경/배너 이미지 또는 그라디언트, `h1` 카피, 서브카피, 기본/보조 `Button` 2개(예: "지금 쇼핑하기", "베스트셀러 보기"), 신뢰 지표(별점/리뷰 수 배지) 옵션.
- shadcn: `Button`, `Badge`.

### 3.2 Features
- 목적: 스토어의 세일즈 포인트(무료 배송, 정품 보증, 빠른 반품 등).
- 구성: 3~4개 `Card`를 grid로. 각 카드는 `lucide-react` 아이콘 + 제목 + 짧은 설명.
- shadcn: `Card`, `Separator`.

### 3.3 Products Showcase
- 목적: 인기/신상품 6~8개 프리뷰.
- 구성: `ProductCard` 그리드(`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`), 각 카드는 이미지, 이름, 가격, "장바구니 추가" 버튼, 세일 여부 `Badge`.
- 데이터 소스: 지금은 `src/lib/mock-products.ts` 상수, DB 연결 이후 Prisma로 대체.
- shadcn: `Card`, `Badge`, `Button`.

### 3.4 CTA (Conversion 섹션)
- 목적: 회원가입/뉴스레터 유도.
- 구성: 강조 색상 배경, 카피, 이메일 입력 + 구독 버튼(폼 검증은 zod + 서버 액션).
- shadcn: `Button`, `Input`(추후 추가), `Card` 옵션.

### 3.5 Footer
- 목적: 부가 네비게이션 + 법적 링크.
- 구성: 4-column 그리드(회사/고객지원/정책/소셜), 하단 저작권 라인, `Separator`로 상단과 구분.
- shadcn: `Separator`.

### 3.6 렌더링/성능 원칙
- 각 섹션은 RSC. `next/image`로 이미지 최적화.
- 상단 스크롤 진입점 위주로 `priority` 이미지 지정.
- 하위 인터랙션(예: "장바구니 추가")만 클라이언트 경계 격리.

## 4. 다음 단계 (진행 순서 제안)

1. `src/app/page.tsx`를 위 섹션 조립으로 교체 + `src/components/sections/*` 파일 골격 생성.
2. `src/lib/mock-products.ts`로 임시 데이터 시드 → Products Showcase 연결.
3. Prisma 스키마 초안 (`Product`, `User`, `Order`, `OrderItem`) 및 DB 연결.
4. NextAuth v5 최소 설정(Credentials + Google) → `app/auth/*` 구성.
5. 장바구니/체크아웃 라우트 그룹 `(shop)` 구축.

## 5. 기록해둔 판단들

- **Next.js 14 요청 vs 실제 v16 설치**: `create-next-app@latest`가 최신을 강제. v14 고정이 요구사항이면 `npx create-next-app@14`로 재스캐폴딩 필요. 현재는 v16으로 진행.
- **`--no-git` 플래그 무시**: v16이 자동으로 git init함. 병합 시 scaffold의 `.git`은 제외해 기존 저장소를 보존.
- **App Router + RSC + 서버 액션** 조합으로 API 레이어 없이 시작. 외부 소비자 생기면 그때 REST/tRPC 도입.