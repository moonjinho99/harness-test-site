"use client"

import Script from "next/script"
import { useEffect, useRef, useMemo, useState } from "react"
import type { PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { calculateTotals, formatKRW, type CartLine } from "@/lib/cart"

type Props = {
  cartLines: CartLine[]
  user: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
  }
}

type ShippingForm = {
  recipient: string
  phone: string
  zipCode: string
  address: string
  addressDetail: string
  memo: string
}

// Daum Postcode global — loaded via <Script src="//t1.daumcdn.net/...">
type DaumPostcodeData = {
  zonecode: string
  address: string
  roadAddress: string
  jibunAddress: string
}
type DaumPostcode = {
  new (options: {
    oncomplete: (data: DaumPostcodeData) => void
  }): { open: () => void }
}
declare global {
  interface Window {
    daum?: { Postcode: DaumPostcode }
  }
}

export function CheckoutForm({ cartLines, user }: Props) {
  const totals = useMemo(() => calculateTotals(cartLines), [cartLines])
  const widgetRef = useRef<PaymentWidgetInstance | null>(null)
  type MethodsWidget = ReturnType<PaymentWidgetInstance["renderPaymentMethods"]>
  const methodsWidgetRef = useRef<MethodsWidget | null>(null)
  const [widgetReady, setWidgetReady] = useState(false)
  const [form, setForm] = useState<ShippingForm>({
    recipient: user.name ?? "",
    phone: user.phone ?? "",
    zipCode: "",
    address: "",
    addressDetail: "",
    memo: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
    if (!clientKey) return
    let cancelled = false

    ;(async () => {
      const { loadPaymentWidget } = await import("@tosspayments/payment-widget-sdk")
      const widget = await loadPaymentWidget(clientKey, user.id)
      if (cancelled) return
      widgetRef.current = widget
      methodsWidgetRef.current = await widget.renderPaymentMethods("#toss-payment-methods", { value: totals.total })
      await widget.renderAgreement("#toss-agreement")
      setWidgetReady(true)
    })().catch((err: unknown) => {
      if (!cancelled) setError("결제 위젯을 불러오지 못했어요. 새로고침 후 다시 시도해주세요.")
      console.error(err)
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  useEffect(() => {
    if (methodsWidgetRef.current && widgetReady) {
      methodsWidgetRef.current.updateAmount(totals.total)
    }
  }, [totals.total, widgetReady])

  const update = <K extends keyof ShippingForm>(key: K, value: ShippingForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const openPostcode = () => {
    if (typeof window === "undefined" || !window.daum?.Postcode) {
      setError("우편번호 서비스를 불러오지 못했어요. 잠시 후 다시 시도해주세요.")
      return
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        setForm((prev) => ({
          ...prev,
          zipCode: data.zonecode,
          address: data.roadAddress || data.address,
        }))
      },
    }).open()
  }

  const validate = (): string | null => {
    if (!form.recipient.trim()) return "받는 분 성함을 입력해주세요."
    if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/\s/g, "")))
      return "올바른 전화번호를 입력해주세요."
    if (!form.zipCode || !form.address) return "배송지 주소를 입력해주세요."
    if (!form.addressDetail.trim()) return "상세주소를 입력해주세요."
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    if (!widgetRef.current) { setError("결제 위젯이 준비되지 않았어요."); return }

    setError(null)
    setIsSubmitting(true)

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartLines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
          receiverName: form.recipient,
          receiverPhone: form.phone,
          postalCode: form.zipCode,
          address: form.address,
          addressDetail: form.addressDetail,
          memo: form.memo,
        }),
      })
      const orderBody = (await orderRes.json().catch(() => ({}))) as {
        success?: boolean
        data?: { id: string; orderNumber: string; totalAmount: number }
        error?: string
      }
      if (!orderRes.ok || !orderBody.data) {
        throw new Error(orderBody.error ?? "주문 생성에 실패했어요.")
      }
      const orderData = orderBody.data

      const firstName = cartLines[0]?.product.name ?? "상품"
      const restCount = cartLines.length - 1
      const orderName = restCount > 0 ? `${firstName} 외 ${restCount}건` : firstName

      await widgetRef.current.requestPayment({
        orderId: orderData.orderNumber,
        orderName,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerEmail: user.email ?? undefined,
        customerName: form.recipient,
        customerMobilePhone: form.phone.replace(/-/g, ""),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제 요청에 실패했어요.")
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
      />
      <form
        onSubmit={handleSubmit}
        className="grid gap-8 lg:grid-cols-[1fr_360px]"
        noValidate
      >
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <h2 className="text-lg font-semibold">배송지 정보</h2>

              <Field label="받는 분" htmlFor="recipient" required>
                <input
                  id="recipient"
                  type="text"
                  autoComplete="name"
                  value={form.recipient}
                  onChange={(e) => update("recipient", e.target.value)}
                  className={inputCls}
                  required
                />
              </Field>

              <Field label="전화번호" htmlFor="phone" required>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="010-0000-0000"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={inputCls}
                  required
                />
              </Field>

              <Field label="주소" htmlFor="zipCode" required>
                <div className="flex gap-2">
                  <input
                    id="zipCode"
                    type="text"
                    readOnly
                    placeholder="우편번호"
                    value={form.zipCode}
                    className={`${inputCls} max-w-32`}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openPostcode}
                  >
                    우편번호 찾기
                  </Button>
                </div>
                <input
                  type="text"
                  readOnly
                  placeholder="주소"
                  value={form.address}
                  className={`${inputCls} mt-2`}
                  required
                />
                <input
                  type="text"
                  placeholder="상세 주소를 입력해주세요"
                  value={form.addressDetail}
                  onChange={(e) => update("addressDetail", e.target.value)}
                  className={`${inputCls} mt-2`}
                  required
                />
              </Field>

              <Field label="배송 메모" htmlFor="memo">
                <input
                  id="memo"
                  type="text"
                  placeholder="예: 부재 시 문 앞에 놓아주세요"
                  value={form.memo}
                  onChange={(e) => update("memo", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h2 className="text-lg font-semibold">주문 상품</h2>
              <ul className="flex flex-col gap-3">
                {cartLines.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="line-clamp-1 pr-2 text-foreground">
                      {line.product.name} × {line.quantity}
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatKRW(line.product.price * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 결제 위젯 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold">결제 수단</h2>
              <div id="toss-payment-methods" />
              <div id="toss-agreement" className="mt-4" />
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card>
            <CardContent className="flex flex-col gap-3 p-6">
              <h2 className="text-lg font-semibold">결제 요약</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">상품 소계</span>
                <span className="font-medium">{formatKRW(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">배송비</span>
                <span className="font-medium">
                  {totals.shippingFee === 0
                    ? "무료"
                    : formatKRW(totals.shippingFee)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-medium">최종 결제금액</span>
                <span className="text-lg font-semibold">
                  {formatKRW(totals.total)}
                </span>
              </div>
              {error && (
                <p role="alert" className="text-sm text-rose-600">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                className="mt-2 w-full"
                disabled={isSubmitting || !widgetReady}
              >
                {isSubmitting ? "결제 요청 중..." : widgetReady ? "결제하기" : "위젯 로딩 중..."}
              </Button>
              <p className="text-xs text-muted-foreground">
                결제 진행 시 이용약관 및 개인정보 처리방침에 동의한 것으로
                간주됩니다.
              </p>
            </CardContent>
          </Card>
        </aside>
      </form>
    </>
  )
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  )
}
