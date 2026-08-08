# 01. 디렉토리 구조

> 스캐폴딩 완료 후 실제 생성된 프로젝트 구조 스냅샷.
> 경로 기준: `D:/myproject/harness-test/`

## 최상위 구조

```
harness-test/
├── .claude/                  # Claude Code 설정 (기존)
├── .git/                     # Git 저장소 (기존, --no-git 무시되어 scaffold도 생성했으나 병합 시 제거)
├── .idea/                    # JetBrains IDE 설정 (기존)
├── .omc/                     # OMC 런타임 상태 (자동 생성)
├── _workspace/               # 아키텍처/기획 문서 (본 디렉토리)
├── node_modules/             # npm 의존성
├── public/                   # 정적 자산 (favicon, svg 등)
├── src/                      # 애플리케이션 소스
├── .gitignore                # Next.js 기본 + IDE/OMC 규칙 병합본
├── .gitignore.scaffold.bak   # create-next-app 원본 gitignore 백업
├── AGENTS.md                 # create-next-app v16 자동 생성 에이전트 가이드
├── CLAUDE.md                 # 프로젝트별 Claude 지침 (기존 유지)
├── README.md                 # 프로젝트 README (기존 유지)
├── components.json           # shadcn/ui 설정
├── eslint.config.mjs         # ESLint 9 flat config
├── next-env.d.ts             # Next.js 타입 참조
├── next.config.ts            # Next.js 설정
├── package.json              # 매니페스트
├── package-lock.json         # 잠금 파일
├── postcss.config.mjs        # PostCSS (Tailwind v4 플러그인)
└── tsconfig.json             # TypeScript 설정 (paths: @/* → src/*)
```

## `src/` 상세

```
src/
├── app/                      # Next.js App Router
│   ├── favicon.ico
│   ├── globals.css           # Tailwind v4 + shadcn CSS 변수/토큰
│   ├── layout.tsx            # 루트 레이아웃
│   └── page.tsx              # 홈 페이지 (현재는 create-next-app 기본)
├── components/
│   └── ui/                   # shadcn/ui 프리미티브
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── separator.tsx
└── lib/
    └── utils.ts              # `cn()` 헬퍼 (clsx + tailwind-merge)
```

## 설치된 주요 패키지 (`package.json` 발췌)

**dependencies**
- `next` 16.3.0
- `react` 19.2.8
- `react-dom` 19.2.8
- shadcn init/add가 추가한 것들: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/react-slot`, `@radix-ui/react-separator` (init 시 자동 설치)

**devDependencies**
- `typescript` ^5
- `@types/node` ^20, `@types/react` ^19, `@types/react-dom` ^19
- `tailwindcss` ^4, `@tailwindcss/postcss` ^4
- `eslint` ^9, `eslint-config-next` 16.3.0

## 앞으로 추가 예정 디렉토리 (계획)

```
src/
├── app/
│   ├── (marketing)/          # 랜딩·정적 페이지 그룹
│   ├── (shop)/               # 상품/장바구니/체크아웃 그룹
│   ├── api/                  # 라우트 핸들러 (필요 시)
│   └── auth/                 # NextAuth 페이지
├── components/
│   ├── sections/             # 랜딩용 큰 섹션 (Hero, Features, ...)
│   └── shop/                 # 도메인 컴포넌트 (ProductCard 등)
├── features/                 # 기능 단위 유즈케이스 (선택)
├── lib/
│   ├── auth.ts               # NextAuth v5 설정
│   ├── db.ts                 # Prisma 클라이언트 싱글톤
│   └── env.ts                # 환경변수 스키마
└── server/                   # 서버 액션·데이터 접근 계층
prisma/
├── schema.prisma
└── migrations/
```

## 스캐폴딩 중 발생한 이슈 & 조치

1. `create-next-app`이 기존 `.omc/`, `CLAUDE.md`, `README.md`를 conflict로 판정.
   → 임시 디렉토리(`D:/myproject/_scaffold_tmp/shop`)에 스캐폴드 후 필요한 파일만 병합.
2. `--no-git`이 v16에서도 무시되고 `.git`이 재생성됨.
   → 병합 시 scaffold의 `.git`은 복사 대상에서 제외해 기존 저장소를 유지.
3. `create-next-app@latest`가 Next.js 16.3.0을 설치 (요청은 v14).
   → 아키텍처 문서에서 결정사항으로 기록. React 19 + Tailwind v4 스택으로 계속 진행.