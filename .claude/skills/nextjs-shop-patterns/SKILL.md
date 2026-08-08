---
name: nextjs-shop-patterns
description: Next.js 14 App Router 기반 쇼핑몰 구현 패턴 참조. Next.js 쇼핑몰 개발, App Router 구조 설계, Prisma 스키마/쿼리, NextAuth 설정, Server/Client Component 분리, Tailwind+shadcn/ui 컴포넌트, Zustand 장바구니, 주문 처리 API, 가격 계산 로직 구현 시 반드시 이 스킬을 참조할 것.
---

# Next.js 쇼핑몰 패턴

## 기술 스택

- **Runtime**: Next.js 14+ (App Router), TypeScript 5+
- **Styling**: Tailwind CSS + shadcn/ui
- **ORM**: Prisma 5+ + PostgreSQL
- **Auth**: NextAuth.js v5 (Auth.js)
- **State**: Zustand (장바구니), React Query (서버 상태)
- **Validation**: Zod

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/           # 로그인, 회원가입 (레이아웃 분리)
│   ├── (shop)/           # 일반 사용자 페이지
│   │   ├── page.tsx      # 홈
│   │   ├── products/     # 상품 목록, 상세
│   │   ├── cart/         # 장바구니
│   │   └── checkout/     # 결제
│   ├── (account)/        # 마이페이지, 주문내역
│   ├── admin/            # 관리자 (별도 미들웨어 보호)
│   └── api/              # Route Handlers
├── components/
│   ├── ui/               # shadcn/ui 기본 컴포넌트
│   ├── product/          # ProductCard, ProductGrid, ProductFilter
│   ├── cart/             # CartItem, CartSummary
│   └── layout/           # Header, Footer, Nav
├── lib/
│   ├── prisma.ts         # Prisma 클라이언트 싱글톤
│   ├── auth.ts           # NextAuth 설정
│   └── validations/      # Zod 스키마
├── store/
│   └── cart.ts           # Zustand 장바구니 스토어
└── types/                # 공통 TypeScript 타입
```

## 핵심 패턴

### Prisma 클라이언트 싱글톤

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### API 응답 형식 (모든 Route Handler에 일관 적용)

```typescript
type ApiResponse<T> = { success: boolean; data?: T; error?: string }
// 성공: { success: true, data: {...} }
// 실패: { success: false, error: "메시지" }
```

### 재고 트랜잭션 (race condition 방지)

```typescript
await prisma.$transaction(async (tx) => {
  const product = await tx.product.update({
    where: { id: productId, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  })
  if (!product) throw new Error('재고 부족')
  return tx.order.create({ data: orderData })
})
```

### Server vs Client Component 분리 기준

| 상황 | 선택 |
|------|------|
| DB 조회, 데이터 페칭 | Server Component |
| 클릭, 폼 입력, 상태 | Client Component (`'use client'`) |
| 장바구니 (전역 상태) | Client Component + Zustand |
| 상품 목록 페이지 | Server (데이터) + Client (필터 UI) |

### Zustand 장바구니 스토어 구조

```typescript
// store/cart.ts
interface CartItem {
  productId: string
  name: string
  price: number       // 원 단위 정수
  quantity: number
  imageUrl: string
  optionId?: string
}
interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clear: () => void
  total: () => number
}
```

## Prisma 스키마 핵심 모델

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(CUSTOMER)
  orders    Order[]
  reviews   Review[]
  createdAt DateTime @default(now())
}

enum Role { CUSTOMER ADMIN }

model Product {
  id          String      @id @default(cuid())
  name        String
  description String
  price       Int         // 원 단위 (소수점 없음)
  stock       Int         @default(0)
  images      String[]    // URL 배열
  categoryId  String
  category    Category    @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
  reviews     Review[]
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Order {
  id           String      @id @default(cuid())
  userId       String
  user         User        @relation(fields: [userId], references: [id])
  items        OrderItem[]
  totalAmount  Int         // 원 단위
  status       OrderStatus @default(PENDING)
  pgOrderId    String?     // PG사 주문번호
  pgPaymentKey String?     // 토스페이먼츠 paymentKey
  address      Json        // { name, phone, zipCode, address, detail }
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

enum OrderStatus { PENDING PAID SHIPPING DELIVERED CANCELLED REFUNDED }

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  price     Int     // 주문 시점 가격 스냅샷
}
```

## 가격 처리 규칙

- **저장**: 항상 정수(원) — `price: Int` (부동소수점 오차 방지)
- **표시**: `Intl.NumberFormat('ko-KR').format(price)` + "원"
- **결제 검증**: 클라이언트 전달 금액을 신뢰하지 말고 DB에서 재계산

```typescript
// 결제 승인 전 서버에서 금액 재계산 (필수)
const orderItems = await prisma.orderItem.findMany({ where: { orderId } })
const serverTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
if (serverTotal !== requestedAmount) throw new Error('결제 금액 불일치')
```

## 미들웨어 (관리자 보호)

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/admin')) {
    // 세션 확인 + role === 'ADMIN' 체크
    // 미인증 또는 비관리자 → /login 리다이렉트
  }
}
export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] }
```