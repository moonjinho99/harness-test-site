export { auth as middleware } from "@/auth";
export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/admin/:path*", "/mypage", "/mypage/:path*"],
};