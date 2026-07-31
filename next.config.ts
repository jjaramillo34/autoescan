import type { NextConfig } from "next";

function imageKitHostname(): string | null {
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!endpoint) return null;
  try {
    return new URL(endpoint).hostname;
  } catch {
    return null;
  }
}

const imageKitHost = imageKitHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      ...(imageKitHost && imageKitHost !== "ik.imagekit.io"
        ? [
            {
              protocol: "https" as const,
              hostname: imageKitHost,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
