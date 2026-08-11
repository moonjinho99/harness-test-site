"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/auth"
import { db } from "@/lib/db"

const UpdateProfileSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").max(50, "이름은 50자 이내로 입력해주세요"),
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
    name: formData.get("name"),
    phone: String(formData.get("phone") ?? ""),
    marketingOptIn: formData.get("marketingOptIn") === "true",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, phone, marketingOptIn } = parsed.data

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone: phone || null,
      marketingOptIn,
    },
  })

  revalidatePath("/mypage")
  return { success: true }
}
