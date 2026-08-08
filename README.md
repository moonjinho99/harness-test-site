# AI-Driven Shopping Mall

> **나는 코드를 한 줄도 직접 짜지 않는다.**  
> 코딩, 테스트, 코드 리뷰, Git, 설계, DB 구축 — 모든 개발 과정을 AI 에이전트 팀에 위임한다.

## 프로젝트 개요

이 프로젝트는 **AI를 활용한 완전 위임 개발**의 실험이다.

쇼핑몰을 만드는 것이 목표가 아니라, **AI 에이전트 팀이 쇼핑몰을 스스로 설계하고 구축하는 과정 자체**가 목표다. 인간 개발자는 요구사항을 정의하고 방향을 제시하는 역할만 한다.

```
인간의 역할:  "의류 쇼핑몰 만들어줘. 결제는 토스페이먼츠로."
AI의 역할:   설계 → 코딩 → 테스트 → 코드 리뷰 → 커밋 → 배포
```

## AI 개발팀 구성

| 에이전트 | 역할 |
|---------|------|
| `shop-architect` | 아키텍처 설계, 데이터 모델, API 명세 |
| `shop-backend` | Next.js API Routes, Prisma, 인증, 결제 연동 |
| `shop-frontend` | Next.js 페이지, React 컴포넌트, UI/UX |
| `shop-qa` | 통합 테스트, 보안 점검, 버그 리포트 |

오케스트레이터(`shop-orchestrator`)가 4개 에이전트를 조율하며 Phase별로 작업을 분배한다.

## 기술 스택

AI 에이전트가 선정한 스택:

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5
- **Payment**: 토스페이먼츠 (국내 PG사)
- **State**: Zustand (클라이언트), React Query (서버)

## 개발 워크플로우

```
Phase 1: shop-architect  → 아키텍처 문서, 데이터 모델, API 설계
Phase 2: shop-backend    → Prisma 스키마, API Routes, 결제 연동
Phase 3: shop-frontend   → 페이지, 컴포넌트, 반응형 UI
Phase 4: shop-qa         → 테스트 작성, 보안 점검, 버그 리포트
```

모든 Phase는 Claude Code + AI 에이전트가 실행한다. 사람이 직접 코드를 작성하는 단계는 없다.

## 핵심 규칙

- ❌ 사람이 직접 코드 작성 금지
- ❌ 사람이 직접 Git 커밋 금지
- ❌ 사람이 직접 DB 스키마 작성 금지
- ✅ 요구사항 정의, 방향 설정, 피드백만 허용

## 시작하기

```bash
# 이 저장소는 Claude Code CLI로 실행합니다.
# https://claude.ai/claude-code

claude  # 프로젝트 디렉토리에서 실행

# Claude에게 요청:
# "쇼핑몰 개발 시작해줘"
```

## 쇼핑몰 주요 기능

AI 에이전트 팀이 구축하는 기능:

- 상품 목록 / 상세 페이지 (검색, 카테고리 필터)
- 장바구니 / 결제 (토스페이먼츠)
- 회원 가입 / 로그인 (카카오, 구글, 이메일)
- 주문 내역 / 마이페이지
- 상품 리뷰 / 평점
- 관리자 대시보드 (상품·주문·사용자 관리)

## 이 프로젝트가 탐구하는 질문

> AI 에이전트만으로 실제 서비스 수준의 쇼핑몰을 만들 수 있을까?  
> 인간 개발자 없이 코드 품질, 보안, 테스트를 유지할 수 있을까?  
> AI 팀의 병목은 어디서 발생하는가?

---

*모든 코드는 AI가 작성했습니다. 이 README도 AI가 작성했습니다.*