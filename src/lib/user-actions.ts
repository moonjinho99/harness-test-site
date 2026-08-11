"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/auth"
import { db } from "@/lib/db"

const UpdateProfileSchema = z.object({
  phone: z
    .string()
    .refine(
      (val) => val === "" || /^01[0-9]-?\d{3,4}-?\d{4}$/.test(val),
      { message: "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)" },
    ),
  marketingOptIn: z.boolean(),
})

export async function updateProfile(
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { error: "로그인이 필요합니다" }

  const parsed = UpdateProfileSchema.safeParse({
    phone: String(formData.get("phone") ?? ""),
    marketingOptIn: formData.get("marketingOptIn") === "true",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { phone, marketingOptIn } = parsed.data

  await db.user.update({
    where: { id: session.user.id },
    data: {
      phone: phone || null,
      marketingOptIn,
    },
  })

  revalidatePath("/mypage")
  return { success: true }
}
