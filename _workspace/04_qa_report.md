# QA 리포트 v2 — feature/cart-checkout (Loop 2)

## 검증 일시
2026-08-17

## 결과 요약

| 항목 | 상태 |
|------|------|
| TypeScript (`npx tsc --noEmit`) | PASS |
| CRITICAL-1 CheckoutForm envelope 파싱 | PASS |
| CRITICAL-2 CheckoutForm body 평탄화 | PASS |
| CRITICAL-3 OrderCancelButton 필드명 | PASS |
| CRITICAL-4 Webhook HMAC 서명 검증 | PASS |
| HIGH-2 checkout/success `body.error` | PASS |
| HIGH-3 재고 선차감 제거 (orders POST) | PASS |
| HIGH-4 order/complete 소유자 검증 | PASS |
| HIGH-5 lib/orders.ts 필드 매핑 | PASS |

**CRITICAL: 0건 · HIGH: 0건**

---

## 남은 이슈 (MEDIUM/LOW — 비블로킹)

### MEDIUM

- **[MED-1]** `checkout/success` 새로고침 시 confirm 재시도 → 서버가 409로 방어하지만 "실패" UI 노출. localStorage 완료 마킹으로 UX 개선 가능.
- **[MED-2]** `/api/orders/[orderId]` GET이 id 기반 조회 — 향후 orderNumber 기반 접근 필요 시 `OR` 조건 추가.
- **[MED-3]** API 응답 envelope(`{success,data}`) 벗기기 유틸 없음 — 클라이언트 확장 시 재발 가능.

### LOW

- **[LOW-1]** `CartView.tsx` 미사용 `Link`/`Button` import.
- **[LOW-2]** `lib/orders.ts` `mapItem`에서 `item.price` 참조 (`unitPrice`가 실제 필드, 폴백으로 동작은 함).
- **[LOW-3]** `TOSS_WEBHOOK_SECRET` 미설정 시 검증 스킵 (dev 편의 — 스테이징/프로덕션에서 strict 전환 필요).
- **[LOW-4]** `lib/format.ts`와 `lib/cart.ts`에 `formatKRW` 중복 정의.

---

## 커밋 이력

| 커밋 | 내용 |
|------|------|
| `1c3c87d` | feat: 장바구니/주문/결제 API 구현 |
| `b15f6b9` | fix: 웹훅 서명 검증, 재고 선차감 제거, 주문 필드 매핑 수정 |
| `6e5bff6` | feat: 장바구니/체크아웃/주문 UI 구현 |

<loop-status>PASS</loop-status>
