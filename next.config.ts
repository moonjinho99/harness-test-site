import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "k.kakaocdn.net" },
      { protocol: "https", hostname: "img1.kakaocdn.net" },
    ],
  },
};

export default nextConfig;
