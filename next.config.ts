import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Cloudflare Workers では next/image の最適化が使えない
  },
};

export default nextConfig;

// next dev 時にCloudflareバインディング（D1, R2等）をローカルで利用可能にする
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
