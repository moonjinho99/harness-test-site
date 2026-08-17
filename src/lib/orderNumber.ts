import { randomBytes } from "crypto";

/**
 * Generates an order number in the format: YYYYMMDD-XXXXXXXX
 * (date + 8-char uppercase hex).
 */
export function generateOrderNumber(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return `${y}${m}${d}-${rand}`;
}