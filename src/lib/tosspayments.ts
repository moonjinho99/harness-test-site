const TOSS_API = "https://api.tosspayments.com/v1";

function getBasicAuth(): string {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error("TOSS_SECRET_KEY not configured");
  return Buffer.from(`${secretKey}:`).toString("base64");
}

export interface TossPaymentResponse {
  paymentKey?: string;
  orderId?: string;
  status?: string;
  method?: string;
  totalAmount?: number;
  approvedAt?: string;
  code?: string;
  message?: string;
  [key: string]: unknown;
}

export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<TossPaymentResponse> {
  const res = await fetch(`${TOSS_API}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getBasicAuth()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  return (await res.json()) as TossPaymentResponse;
}

export async function cancelPayment(
  paymentKey: string,
  cancelReason: string,
): Promise<TossPaymentResponse> {
  const res = await fetch(`${TOSS_API}/payments/${paymentKey}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getBasicAuth()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cancelReason }),
  });
  return (await res.json()) as TossPaymentResponse;
}
