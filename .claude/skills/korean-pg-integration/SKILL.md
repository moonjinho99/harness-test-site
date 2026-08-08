---
name: korean-pg-integration
description: 국내 PG사(토스페이먼츠, KCP, 이니시스) 연동 패턴. 토스페이먼츠 결제 연동, 국내 PG사 웹훅 처리, 결제 승인 검증, 환불/취소 처리, 결제 실패 핸들링 구현 시 반드시 이 스킬을 사용할 것.
---

# 국내 PG사 연동

## PG사 선택 가이드

| PG사 | 추천 상황 | 복잡도 |
|------|----------|--------|
| **토스페이먼츠** | 스타트업, 모던 API, 빠른 연동 | 낮음 (기본값) |
| KCP | 대기업 계약, 전통적 쇼핑몰 | 높음 |
| 이니시스 | KCP 대안, 카드사 직거래 필요 | 높음 |

기본은 토스페이먼츠로 구현한다. KCP/이니시스가 필요하면 `references/kcp.md`, `references/inicis.md`를 로드한다.

## 토스페이먼츠 연동

### 패키지 설치

```bash
npm install @tosspayments/payment-sdk   # 프론트엔드
```

### 전체 결제 흐름

```
[프론트] 결제 버튼 클릭
    → loadTossPayments(clientKey)
    → payment.requestPayment({ amount, orderId, ... })
    → 결제창 팝업

[결제 완료] 토스가 successUrl로 리다이렉트
    → URL params: paymentKey, orderId, amount

[서버] POST /api/payment/confirm
    1. DB에서 주문 금액 재계산 (클라이언트 amount 절대 신뢰 금지)
    2. 금액 불일치 시 즉시 거부
    3. 토스 서버에 결제 승인 요청
    4. 성공 → DB Order.status = 'PAID'
    5. 실패 → Order.status = 'PENDING' 유지 + 에러 반환
```

### 프론트엔드 결제 요청

```typescript
// app/(shop)/checkout/_components/PaymentButton.tsx  ('use client')
import { loadTossPayments } from '@tosspayments/payment-sdk'

async function handlePayment(orderId: string, amount: number) {
  const tossPayments = await loadTossPayments(
    process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY!
  )
  const payment = tossPayments.payment({ customerKey: session.user.id })

  await payment.requestPayment({
    method: 'CARD',
    amount: { currency: 'KRW', value: amount },
    orderId,
    orderName: '주문명',
    successUrl: `${window.location.origin}/checkout/success`,
    failUrl: `${window.location.origin}/checkout/fail`,
    customerEmail: session.user.email,
    customerName: session.user.name ?? '고객',
  })
}
```

### 백엔드 결제 승인

```typescript
// app/api/payment/confirm/route.ts
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ success: false, error: '인증 필요' }, { status: 401 })

  const { paymentKey, orderId, amount } = await request.json()

  // 1. DB에서 주문 금액 재계산 (필수 보안 체크)
  const order = await prisma.order.findUnique({
    where: { id: orderId, userId: session.user.id },
    include: { items: true },
  })
  if (!order) return Response.json({ success: false, error: '주문 없음' }, { status: 404 })

  const serverAmount = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  )
  if (serverAmount !== amount) {
    return Response.json({ success: false, error: '결제 금액 불일치' }, { status: 400 })
  }

  // 2. 토스 서버에 결제 승인 요청
  const credentials = Buffer.from(
    `${process.env.TOSSPAYMENTS_SECRET_KEY!}:`
  ).toString('base64')

  const tossResponse = await fetch(
    'https://api.tosspayments.com/v1/payments/confirm',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    }
  )

  if (!tossResponse.ok) {
    const error = await tossResponse.json()
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }

  // 3. DB 업데이트
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID', pgPaymentKey: paymentKey },
  })

  return Response.json({ success: true })
}
```

### 웹훅 처리

```typescript
// app/api/webhooks/tosspayments/route.ts
export async function POST(request: Request) {
  // TODO: HMAC-SHA256으로 X-Toss-Signature 검증
  const { eventType, data } = await request.json()

  switch (eventType) {
    case 'PAYMENT_STATUS_CHANGED':
      // 결제 상태 변경 처리
      break
    case 'CANCEL_STATUS_CHANGED':
      // 취소 상태 변경 처리
      break
  }

  return Response.json({ success: true })
}
```

### 환불/취소

```typescript
async function cancelPayment(paymentKey: string, reason: string, amount?: number) {
  const credentials = Buffer.from(
    `${process.env.TOSSPAYMENTS_SECRET_KEY!}:`
  ).toString('base64')

  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cancelReason: reason,
        ...(amount && { cancelAmount: amount }), // 부분 취소 시만 포함
      }),
    }
  )
  if (!response.ok) throw new Error('환불 실패')
  return response.json()
}
```

## 환경 변수

```env
# .env.local
NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY=test_ck_...  # 프론트엔드 (공개 가능)
TOSSPAYMENTS_SECRET_KEY=test_sk_...              # 백엔드 전용 (절대 노출 금지)
```

## 주요 에러 코드

| 코드 | 의미 | 처리 |
|------|------|------|
| `NOT_FOUND_PAYMENT` | 결제 없음 | 주문 상태 재확인 |
| `ALREADY_PROCESSED_PAYMENT` | 이미 처리됨 | 중복 요청 방지 |
| `INVALID_STOPPED_CARD` | 정지 카드 | 다른 카드 사용 안내 |
| `EXCEED_MAX_DAILY_PAYMENT_COUNT` | 일일 한도 초과 | 내일 재시도 안내 |

## 테스트 환경

- 테스트 키(`test_ck_...`, `test_sk_...`) 사용 시 실제 결제 없이 테스트 가능
- 테스트 카드: 임의 카드번호 입력 (테스트 환경에서 자동 승인)
- 토스 개발자 대시보드에서 도메인 허용 목록 등록 필요 (localhost 포함)