import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typesscript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
