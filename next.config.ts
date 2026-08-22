import type { NextConfig } from "next";

function appHostname(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (!raw) return undefined;
  try {
    const withProtocol = raw.includes("://") ? raw : `https://${raw}`;
    return new URL(withProtocol).hostname;
  } catch {
    return undefined;
  }
}

const host = appHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      ...(host
        ? [
            { protocol: "https" as const, hostname: host, pathname: "/api/uploads/**" },
            { protocol: "http" as const, hostname: host, pathname: "/api/uploads/**" },
          ]
        : []),
      { protocol: "http", hostname: "localhost", pathname: "/api/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/api/uploads/**" },
    ],
  },
};

export default nextConfig;
