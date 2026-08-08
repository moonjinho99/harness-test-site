import { z } from "zod";

const schema = z.object({
  AUTH_SECRET: z.string().min(32),
  AUTH_KAKAO_ID: z.string().min(1),
  AUTH_KAKAO_SECRET: z.string().min(10),
  DATABASE_URL: z.string().url(),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z.enum(["true", "false"]).optional(),
});

export const env = schema.parse(process.env);