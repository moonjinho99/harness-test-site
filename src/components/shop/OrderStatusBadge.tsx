import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/lib/orders"

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "결제 대기",
  PAID: "결제 완료",
  PREPARING: "상품 준비 중",
  SHIPPED: "배송 중",
  DELIVERED: "배송 완료",
  CANCELED: "주문 취소",
  REFUNDED: "환불 완료",
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  PAID: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  PREPARING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  SHIPPED: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  DELIVERED: "bg-green-100 text-green-700 hover:bg-green-100",
  CANCELED: "bg-rose-100 text-rose-700 hover:bg-rose-100",
  REFUNDED: "bg-rose-100 text-rose-700 hover:bg-rose-100",
}

type Props = {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: Props) {
  return (
    <Badge className={STATUS_STYLE[status]} variant="secondary">
      {STATUS_LABEL[status]}
    </Badge>
  )
}