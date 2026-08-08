import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import "@/lib/env"; // fail-fast: 환경변수 zod 검증을 부팅 시 강제 실행

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [Kakao],
  session: { strategy: "database" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role ?? "CUSTOMER";
      return session;
    },
  },
});