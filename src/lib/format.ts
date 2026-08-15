const krwFormatter = new Intl.NumberFormat("ko-KR");

export function formatKRW(price: number): string {
  return `${krwFormatter.format(price)}원`;
}
