# 03. 구현 진행 현황

## 완료 ✅

| 기능 | 브랜치 | 비고 |
|------|--------|------|
| 랜딩 페이지 (Hero, Category, FeaturedProducts, Promo, Trust, Footer) | feature/landing-page | |
| 카카오 소셜 로그인/회원가입 (NextAuth v5 + Prisma Adapter) | feature/kakao-auth | |
| 공통 헤더 (UserMenu, MobileNav) | feature/mypage | 헤더 공통화 포함 |
| 마이페이지 (프로필 조회/수정) | feature/mypage | |
| 상품 목록 `/products` (카테고리·정렬 필터) | feature/product-list | |
| 상품 상세 `/products/[slug]` | feature/product-list | |
| Prisma 스키마 (User, Account, Session, Category, Product) | feature/product-list | |
| 장바구니 `/cart` (CartItem 모델, 수량 조절) | feature/cart-checkout | |
| 체크아웃 `/checkout` (배송지 입력, 주문 요약) | feature/cart-checkout | |
| 토스페이먼츠 결제 연동 (결제창, 승인, webhook) | feature/cart-checkout | |
| 주문 완료 `/order/complete` | feature/cart-checkout | |
| 주문 내역 `/mypage/orders` | feature/cart-checkout | |

---

## 남은 작업

### 🔴 핵심 — 쇼핑 플로우

- [ ] **DB 연결** — `DATABASE_URL` 설정, `prisma migrate dev`, 시드 데이터
- [ ] **상품 상세 "담기" 버튼** — `/products/[slug]` 에서 `POST /api/cart` 호출 활성화

### 🟡 중요 — 사용성

- [ ] **상품 검색** `/products?q=` — 키워드 검색
- [ ] **온보딩** `/auth/onboarding` — 약관 동의, 전화번호 입력 (첫 로그인 후)
- [ ] **상품 리뷰·평점** — 구매자 리뷰 작성, 평점 집계
- [ ] **찜하기** — Wishlist 모델, 상품 카드 토글

### 🟢 관리자

- [ ] **관리자 대시보드** `/admin` — 상품 CRUD, 주문 관리 (role=ADMIN 보호)

---

## 변경 이력

| 날짜 | 브랜치 | 내용 |
|------|--------|------|
| 2026-08-11 | feature/product-list | 상품 목록/상세, ProductCard, products.ts 데이터 레이어 |
| 2026-08-08 | feature/mypage | 마이페이지, 헤더 공통화 |
| — | feature/kakao-auth | 카카오 로그인, NextAuth v5 |
| — | feature/landing-page | 랜딩 페이지 전체 |
