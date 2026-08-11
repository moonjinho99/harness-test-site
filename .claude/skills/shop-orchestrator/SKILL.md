---
name: shop-orchestrator
description: 쇼핑몰 웹사이트 개발 전체를 조율하는 오케스트레이터. "쇼핑몰 만들어줘", "shop 개발 시작", "쇼핑몰 개발해줘", "쇼핑몰 기능 추가", "결제 구현해줘", "상품 관리 만들어줘", "주문 시스템 만들어줘", "관리자 대시보드", "쇼핑몰 다시 실행", "재실행", "계속 진행", "쇼핑몰 업데이트", "쇼핑몰 수정" 등 쇼핑몰 개발 관련 모든 요청 시 반드시 이 스킬을 사용할 것.
---

# 쇼핑몰 개발 오케스트레이터

## 실행 모드: 서브 에이전트 (직렬/병렬 혼합)

shop-architect → shop-backend → shop-frontend → shop-qa 순으로 진행.
모든 Agent 호출 시 `model: "opus"` 파라미터를 반드시 명시한다.

## Phase 0: 컨텍스트 확인

시작 전 실행 모드를 결정한다:

1. `_workspace/` 디렉토리 존재 여부 확인
2. 사용자 요청 파악
   - `_workspace/` 없음 → **초기 실행** (Phase 1부터 전체)
   - `_workspace/` 있음 + 부분 수정 요청 → **부분 재실행** (해당 Phase만)
   - `_workspace/` 있음 + 새 기능 요청 → **기능 추가** (기존 `_workspace/`를 `_workspace_prev/`로 이동 후 진행)

## Phase 1: 아키텍처 설계

**실행 모드:** 단독 서브 에이전트 (직렬, 가장 먼저 실행)

`shop-architect` 에이전트를 호출해 다음을 산출한다:
- `_workspace/01_architecture.md` — 전체 기술 아키텍처
- `_workspace/01_data_model.md` — Prisma 스키마 초안 (ERD 포함)
- `_workspace/01_api_design.md` — API 엔드포인트 목록
- `_workspace/01_directory_structure.md` — 프로젝트 폴더 구조

완료 후 산출물 경로를 Phase 2/3에 전달.

## Phase 2: 백엔드 구현

**실행 모드:** 단독 서브 에이전트 (Phase 1 완료 후)

`shop-backend` 에이전트를 호출해 다음을 구현한다:

**구현 순서:**
1. Prisma 스키마 + 초기 마이그레이션
2. NextAuth.js 설정 (카카오, 구글, 이메일)
3. 상품 API (CRUD, 검색, 필터, 카테고리)
4. 장바구니 API
5. 주문 API + 재고 트랜잭션 (`prisma.$transaction`)
6. 결제 연동 (토스페이먼츠, `korean-pg-integration` 스킬 참조)
7. 리뷰/평점 API
8. 관리자 API

`nextjs-shop-patterns` 스킬의 Prisma 패턴, API 응답 형식, 트랜잭션 패턴을 반드시 참조.

## Phase 3: 프론트엔드 구현

**실행 모드:** 단독 서브 에이전트 (Phase 1 완료 후, Phase 2와 병렬 가능)

`shop-frontend` 에이전트를 호출해 다음을 구현한다:

**페이지 순서:**
1. 레이아웃 (Header, Footer, Navigation)
2. 홈 → 상품 목록 → 상품 상세
3. 장바구니 → 체크아웃 → 주문 완료
4. 마이페이지 → 주문 내역
5. 관리자 대시보드

`nextjs-shop-patterns` 스킬의 Server/Client Component 분리 원칙을 반드시 참조.

## Phase 4: QA 검증 + 루프

**실행 모드:** 단독 서브 에이전트 (Phase 2, 3 완료 후)

`shop-qa` 에이전트를 호출해 다음을 검증한다:

1. **결제 플로우** (CRITICAL) — 금액 정합성, 실패 처리
2. **재고 race condition** — 동시 주문 트랜잭션
3. **인증 보호** — 보호된 경로 전수 확인
4. **API-UI shape 일치** — 프론트-백 통신 정합성
5. **보안** — e-commerce OWASP 취약점

QA 결과: `_workspace/04_qa_report.md`

### 루프 메커니즘 (최대 3회)

QA 완료 후 `_workspace/04_qa_report.md` 끝의 `<loop-status>` 신호를 읽는다.

**PASS 신호** → 루프 종료, 완료 보고

**FAIL 신호** → 아래 절차를 따른다:
1. `_workspace/loop_state.md`에서 현재 반복 횟수 확인 (없으면 1회차로 초기화)
2. **반복 횟수 ≥ 3이면**: 더 이상 재시도하지 않고 미해결 버그를 사용자에게 보고 후 종료
3. **반복 횟수 < 3이면**:
   - `_workspace/loop_state.md`의 횟수를 +1 증가
   - QA 리포트의 `<loop-feedback>` 블록을 읽어 수정 대상 Phase 확인
   - 백엔드 이슈 있음 → `shop-backend` 에이전트를 피드백과 함께 재호출
   - 프론트엔드 이슈 있음 → `shop-frontend` 에이전트를 피드백과 함께 재호출
   - 재구현 완료 후 `shop-qa`를 다시 호출 (Phase 4 반복)

## 데이터 전달 프로토콜

- **중간 산출물**: `_workspace/` 폴더 (파일 기반), 파일명: `{phase번호}_{내용}.md`
- **최종 산출물**: 프로젝트 루트 (`src/`, `prisma/`, `tests/`)

## 루프 상태 파일

`_workspace/loop_state.md` 형식:
```
iteration: 1          # 현재 반복 횟수 (최대 3)
last_qa_status: FAIL  # PASS | FAIL
failed_phases: [2, 3] # 재실행이 필요한 Phase 번호
```

Phase 0에서 `_workspace/loop_state.md`가 존재하면 읽어 이전 루프 상태를 파악한다.

## 에러 핸들링

- 에이전트 실패: 1회 재시도 → 재실패 시 `_workspace/04_qa_report.md`에 명시하고 진행
- PG 연동 실패: 에러 상세 기록 + 사용자에게 API 키/도메인 등록 확인 요청

## 테스트 시나리오

**정상 흐름:**
> "쇼핑몰 개발 시작해줘. 의류 쇼핑몰이야."
→ Phase 0 컨텍스트 확인 → Phase 1 아키텍처 → Phase 2 백엔드 → Phase 3 프론트엔드 → Phase 4 QA

**부분 재실행:**
> "결제 모듈만 다시 구현해줘"
→ Phase 0 (`_workspace/` 존재 확인) → Phase 2 결제 부분만 → Phase 4 결제 검증

**기능 추가:**
> "상품 리뷰 기능 추가해줘"
→ Phase 0 → Phase 2 리뷰 API → Phase 3 리뷰 UI → Phase 4 검증

**에러 흐름:**
> 토스페이먼츠 연동 실패 → `_workspace/04_qa_report.md`에 CRITICAL 기록 → 사용자에게 API 키/도메인 설정 확인 요청