# 01. 기능 설계: 장바구니 → 체크아웃 → 결제 → 주문

> 대상 브랜치: `feature/cart-checkout` (develop 기준 분기)
> 전제: 기존 스키마(User, Product 등)를 존중하고 4개 모델만 추가한다. 재발명 금지.

## 요약

- 장바구니는 **DB 저장** (`CartItem`) — 로그인 사용자만 지원. 비로그인 지원은 YAGNI, 필요할 때 `sessionId` 컬럼 추가.
- 주문/결제는 **토스페이먼츠 표준 결제창 + 서버 승인 API** 흐름. Webhook은 보조 안전망.
- 금액 검증은 **서버가 절대 신뢰의 원천**. 클라이언트가 보낸 금액은 검증용으로만 사용, 승인 시 DB의 `Order.totalAmount`로 재계산해 비교.

---

## Prisma 모델

기존 `schema.prisma`에 아래 추가. User/Product에는 관계 역참조 필드만 추가.

```prisma
// User에 추가할 역참조
model User {
  // ... 기존 필드 유지
  cartItems CartItem[]
  orders    Order[]
}

// Product에 추가할 역참조
model Product {
  // ... 기존 필드 유지
  cartItems  CartItem[]
  orderItems OrderItem[]
}

model CartItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  quantity  Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])          // 동일 상품은 하나의 라인으로 합산
  @@index([userId])
}

model Order {
  id             String       @id @default(cuid())
  orderNumber    String       @unique              // 사람이 읽는 주문번호 (예: 20260815-XXXX)
  userId         String
  status         OrderStatus  @default(PENDING)
  totalAmount    Int                                // 상품합계 + 배송비 - 할인
  shippingFee    Int          @default(0)
  discountAmount Int          @default(0)

  // 배송 정보 (주문 시점 스냅샷)
  receiverName   String
  receiverPhone  String
  postalCode     String
  address        String
  addressDetail  String?
  memo           String?

  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  user     User        @relation(fields: [userId], references: [id])
  items    OrderItem[]
  payment  Payment?

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model OrderItem {
  id          String @id @default(cuid())
  orderId     String
  productId   String
  // 주문 시점 스냅샷 — 상품이 이후 변경/삭제되어도 주문 이력은 불변
  productName String
  unitPrice   Int
  quantity    Int

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@index([orderId])
}

model Payment {
  id            String        @id @default(cuid())
  orderId       String        @unique              // 1:1 (부분결제 요구 나오기 전엔 단순 유지)
  paymentKey    String        @unique              // 토스 paymentKey
  method        String?                            // CARD, TRANSFER, ...
  amount        Int
  status        PaymentStatus @default(READY)
  approvedAt    DateTime?
  rawResponse   Json?                              // 승인 응답 원본 (감사/디버그)
  failureCode   String?
  failureMessage String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([status])
}

enum OrderStatus {
  PENDING       // 주문 생성, 결제 대기
  PAID          // 결제 완료
  PREPARING     // 상품 준비중
  SHIPPED       // 배송중
  DELIVERED     // 배송 완료
  CANCELED      // 취소
  REFUNDED      // 환불
}

enum PaymentStatus {
  READY         // 결제창 호출 준비
  IN_PROGRESS   // 사용자 결제 진행중
  DONE          // 승인 완료
  CANCELED      // 사용자 취소
  FAILED        // 실패
}
```

### 텍스트 ERD

```
User ─┬─< CartItem >─ Product
      └─< Order ─┬─< OrderItem >─ Product
                 └── Payment (1:1)
```

### 설계 근거 (간단히)

- **CartItem `@@unique([userId, productId])`**: 같은 상품을 여러 라인으로 두면 UI/집계가 복잡해진다. `upsert` 한 방으로 처리.
- **OrderItem에 상품명/단가 스냅샷**: 상품 가격/이름이 나중에 바뀌어도 주문 이력은 그대로 남아야 한다. 회계·CS·법적 요구.
- **Order에 배송 정보 스냅샷**: 별도 `Address` 모델은 YAGNI. "주소록 저장" 기능이 요청될 때 분리.
- **Payment.rawResponse Json**: PG 응답 전체 보존. 분쟁 대응·재처리에 필수.
- **Payment 1:1**: 부분결제/분할결제 요구가 나오기 전까지 1:1 유지가 가장 단순하다.

---

## API 엔드포인트

모두 App Router Route Handler (`src/app/api/**/route.ts`). 인증 필요 엔드포인트는 `auth()`로 세션 확인, 없으면 401.

### 장바구니

| Method | Path | 설명 | 인증 | 요청 바디 | 응답 |
|---|---|---|---|---|---|
| GET  | `/api/cart` | 내 장바구니 조회 (product join) | 필요 | — | `{ items: CartItemWithProduct[], subtotal: number }` |
| POST | `/api/cart` | 담기 (있으면 수량 증가) | 필요 | `{ productId: string, quantity: number }` | `{ item: CartItem }` |
| PATCH| `/api/cart/[itemId]` | 수량 변경 | 필요 | `{ quantity: number }` (1 이상) | `{ item: CartItem }` |
| DELETE | `/api/cart/[itemId]` | 라인 삭제 | 필요 | — | `{ ok: true }` |
| DELETE | `/api/cart` | 전체 비우기 | 필요 | — | `{ ok: true }` |

검증: zod 스키마 (`quantity` 1~99, `productId` cuid). 재고 초과는 서버가 min(재고, 요청수량)으로 클램프하고 응답에 실제 반영값을 알린다.

### 주문

| Method | Path | 설명 | 인증 | 요청 바디 | 응답 |
|---|---|---|---|---|---|
| POST | `/api/orders` | 주문 생성 (PENDING) — 결제창 호출 직전 | 필요 | `{ items: {productId, quantity}[], shipping: {...}, memo? }` | `{ orderId, orderNumber, amount }` |
| GET  | `/api/orders` | 내 주문 목록 (페이지네이션) | 필요 | `?page=1&size=10` | `{ orders: Order[], total, page, size }` |
| GET  | `/api/orders/[orderId]` | 주문 상세 (본인만) | 필요 | — | `{ order: OrderWithItemsAndPayment }` |

주문 생성 시 서버가 하는 일:
1. `CartItem` (또는 요청된 items) 검증 — 재고, 활성 상품 여부.
2. 트랜잭션 안에서 `Order` + `OrderItem`(스냅샷) 생성, `stock` 차감은 **아직 하지 않음** (결제 승인 시점에 차감).
3. `orderNumber` 생성: `YYYYMMDD-<8자리 랜덤>`.
4. `Payment` READY 상태로 함께 생성.

### 결제

| Method | Path | 설명 | 인증 | 요청 바디 | 응답 |
|---|---|---|---|---|---|
| POST | `/api/payments/confirm` | 토스 결제 승인 API 호출 + 주문 확정 | 필요 | `{ paymentKey, orderId, amount }` (토스 successUrl에서 전달) | `{ ok: true, orderNumber }` |
| POST | `/api/payments/webhook` | 토스 서버 → 우리 서버 webhook (상태 동기화) | Webhook 서명 검증 | 토스 이벤트 payload | `200 OK` |
| POST | `/api/payments/cancel` | 사용자 주문 취소 (승인 전/후 모두) | 필요 | `{ orderId, reason }` | `{ ok: true }` |

**`/confirm` 흐름 (핵심)**:
1. 세션 유저 == `Order.userId` 확인.
2. `Order.totalAmount` == 요청 `amount` 확인 (변조 방지).
3. 토스 서버 `POST https://api.tosspayments.com/v1/payments/confirm` 호출 (Basic Auth = `secretKey:` base64).
4. 트랜잭션:
   - `Payment.status = DONE`, `paymentKey`, `approvedAt`, `rawResponse` 저장
   - `Order.status = PAID`
   - `Product.stock` 차감 (`decrement`, 조건부 update로 음수 방지)
   - 해당 유저의 `CartItem` 중 이 주문에 포함된 상품 삭제
5. 실패 시 `Payment.status = FAILED`, `failureCode/Message` 기록, `Order`는 `PENDING` 유지 (재시도 가능).

**Idempotency**: `/confirm` 재요청 시 `Payment.status`가 이미 `DONE`이면 200으로 짧게 리턴. Webhook도 동일 원칙.

---

## 페이지 구조

Server/Client 분리 원칙: 데이터 페칭·초기 렌더는 서버, 사용자 상호작용(수량 변경, 폼, 결제창 호출)은 클라이언트.

### `/cart` — 장바구니

- `src/app/(shop)/cart/page.tsx` — **Server** — 세션 확인, Prisma로 `CartItem[]` 조회, 소계 계산, `<CartView items=... />` 렌더.
  - 미로그인 시 `redirect('/auth/signin?callbackUrl=/cart')`.
- `src/components/shop/CartView.tsx` — **Client** — 수량 +/-, 라인 삭제, 전체 선택/삭제. 낙관적 업데이트, `fetch('/api/cart/...')`. 하단에 "주문하기" 버튼 → `/checkout`.
- `src/components/shop/CartLineRow.tsx` — **Client** — 개별 라인 UI (수량 입력, 소계 표시).

### `/checkout` — 체크아웃

- `src/app/(shop)/checkout/page.tsx` — **Server** — 장바구니 재조회 + 재고 재검증(구매 직전 최신 값), 초기 배송지(User 스냅샷) 로드, `<CheckoutForm .../>` 렌더.
- `src/components/shop/CheckoutForm.tsx` — **Client** —
  - 배송지 입력 (다음 우편번호 API 스크립트 동적 로드)
  - 주문 요약 (상품/수량/합계/배송비)
  - "결제하기" 클릭 →
    1. `POST /api/orders` 로 주문 생성 (PENDING) → `{ orderId, orderNumber, amount }`
    2. 토스페이먼츠 SDK (`@tosspayments/tosspayments-sdk`) `requestPayment` 호출
    3. 성공 시 토스가 `successUrl=/checkout/success?orderId=...` 로 리다이렉트

### `/checkout/success` — 결제 승인 처리 페이지

- `src/app/(shop)/checkout/success/page.tsx` — **Client** (`searchParams`에서 paymentKey, orderId, amount 읽음)
  - 마운트 시 `POST /api/payments/confirm` 호출
  - 성공 → `router.replace('/order/complete?orderNumber=...')`
  - 실패 → 에러 UI + "결제 다시 시도" 버튼 (`/checkout`으로 복귀)
- `src/app/(shop)/checkout/fail/page.tsx` — **Client** — 토스 실패 리다이렉트 처리, 코드/메시지 노출.

### `/order/complete` — 주문 완료

- `src/app/(shop)/order/complete/page.tsx` — **Server** — `?orderNumber=` 파라미터로 주문 조회 (본인 것만), 요약 표시, "주문 내역 보기" / "쇼핑 계속" CTA.

### `/mypage/orders` — 주문 내역

- `src/app/(shop)/mypage/orders/page.tsx` — **Server** — 세션 유저의 주문 목록, 페이지네이션 (searchParams).
- `src/app/(shop)/mypage/orders/[orderNumber]/page.tsx` — **Server** — 주문 상세 (본인 검증).
- `src/components/shop/OrderStatusBadge.tsx` — **Server**(순수 표시).
- 취소 버튼이 필요한 상태(PENDING/PAID)에서만 `<OrderCancelButton />` — **Client** — `/api/payments/cancel` 호출.

### 공통 유틸

- `src/lib/tosspayments.ts` — 토스 서버 API 클라이언트 (confirm, cancel). `TOSS_SECRET_KEY` 사용.
- `src/lib/format.ts` — 원화 포맷 `formatKRW(price)`.
- `src/lib/orderNumber.ts` — 주문번호 생성기.
- `src/server/cart.ts`, `src/server/orders.ts` — Route Handler에서 재사용할 서비스 계층.

---

## 구현 우선순위

각 단계는 독립 커밋 가능. 다음 단계로 넘어가기 전에 최소 수동 확인(로컬 curl 또는 브라우저).

1. **DB 마이그레이션** — Prisma 스키마 추가, `prisma migrate dev --name add_cart_order_payment`. 시드 없이도 다음 단계 진행 가능.
2. **장바구니 API + 페이지** — `/api/cart` 5개 엔드포인트, `/cart` 페이지. 결제 없이 담기/수량변경/삭제 완성.
3. **주문 생성 API + 체크아웃 폼** — `POST /api/orders`, `/checkout` 폼 (결제 SDK 호출 없이 orderId 생성까지). 배송지 검증 포함.
4. **토스페이먼츠 연동** — 결제창 호출, `/checkout/success` + `/api/payments/confirm`, `/checkout/fail`. `.env`에 `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` 추가. 테스트 키로 시작.
5. **주문 완료 + 주문 내역** — `/order/complete`, `/mypage/orders`, 상세.
6. **취소/환불** — `/api/payments/cancel`. 결제 전(PENDING) 취소 먼저, PG 취소(PAID → CANCELED)는 이후.
7. **Webhook (보조 안전망)** — `/api/payments/webhook` 서명 검증 + 상태 동기화. `/confirm`이 정상 동작하면 대부분의 케이스는 이미 처리됨 — webhook은 클라이언트가 창을 닫아버리는 등의 예외 대비.

## 명시적 스킵 (YAGNI)

- 비로그인 장바구니 (LocalStorage/쿠키) — 요구 시 CartItem에 `sessionId String?` 추가.
- 쿠폰/포인트 — `Order.discountAmount` 스키마만 열어둠, 로직 미구현.
- 부분결제/분할결제 — `Order:Payment = 1:1` 유지.
- 배송지 주소록 저장 (`Address` 모델) — 요청 오면 분리.
- 재고 예약(락) — 결제 승인 시점에 `stock >= quantity` 조건부 `updateMany`로 차감(원자성 확보). 동시성 이슈가 실제로 관측되면 그때 Redis 락 도입.
- 관리자 주문 관리 화면 — 별도 스프린트.

## 위험 & 방어

- **금액 변조**: 서버에서 `Order.totalAmount == confirm.amount` 재검증. 다르면 즉시 실패.
- **재고 초과 판매**: `updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } })` 결과 `count=0`이면 결제 승인 롤백 대상(토스 취소 API 호출).
- **Confirm 중복 호출**: `Payment.status === DONE`이면 즉시 200. 토스는 동일 `paymentKey`로 중복 요청 시 이미 승인됨을 알림.
- **웹훅 위조**: 토스 webhook 서명 헤더 검증. 미검증 요청은 401.