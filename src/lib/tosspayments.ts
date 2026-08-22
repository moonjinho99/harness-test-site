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

async function tossRequest(url: string, body: object): Promise<TossPaymentResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${getBasicAuth()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = (await res.json()) as TossPaymentResponse;
    if (!res.ok && !data.code) throw new Error(`Toss API error: ${res.status}`);
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<TossPaymentResponse> {
  return tossRequest(`${TOSS_API}/payments/confirm`, { paymentKey, orderId, amount });
}

export async function cancelPayment(
  paymentKey: string,
  cancelReason: string,
): Promise<TossPaymentResponse> {
  return tossRequest(`${TOSS_API}/payments/${paymentKey}/cancel`, { cancelReason });
}
