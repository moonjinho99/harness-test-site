// Structural Prisma shapes and typed client cast.
// ponytail: mirrors existing products.ts pattern until `prisma generate` runs and typed accessors are available.
import { db } from "@/lib/db";

export interface PrismaProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  images: string[];
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrismaCartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product?: PrismaProduct;
}

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED"
  | "REFUNDED";

export type PaymentStatus =
  | "READY"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELED"
  | "FAILED";

export interface PrismaOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface PrismaOrder {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  receiverName: string;
  receiverPhone: string;
  postalCode: string;
  address: string;
  addressDetail: string | null;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: PrismaOrderItem[];
  payment?: PrismaPayment | null;
}

export interface PrismaPayment {
  id: string;
  orderId: string;
  paymentKey: string;
  method: string | null;
  amount: number;
  status: PaymentStatus;
  approvedAt: Date | null;
  rawResponse: unknown;
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Minimal accessor surface used by cart/order/payment routes.
interface Delegate<T> {
  findMany: (args?: unknown) => Promise<T[]>;
  findUnique: (args: unknown) => Promise<T | null>;
  findFirst: (args: unknown) => Promise<T | null>;
  create: (args: unknown) => Promise<T>;
  update: (args: unknown) => Promise<T>;
  updateMany: (args: unknown) => Promise<{ count: number }>;
  upsert: (args: unknown) => Promise<T>;
  delete: (args: unknown) => Promise<T>;
  deleteMany: (args: unknown) => Promise<{ count: number }>;
  count: (args?: unknown) => Promise<number>;
}

export interface TypedClient {
  product: Delegate<PrismaProduct>;
  cartItem: Delegate<PrismaCartItem>;
  order: Delegate<PrismaOrder>;
  orderItem: Delegate<PrismaOrderItem>;
  payment: Delegate<PrismaPayment>;
  $transaction: <R>(fn: (tx: TypedClient) => Promise<R>) => Promise<R>;
}

export function typedDb(): TypedClient {
  return db as unknown as TypedClient;
}
