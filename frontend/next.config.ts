import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /@privy-io\/react-auth/ },
      { message: /Can't resolve '@farcaster/ }
    ];
    return config;
  }
};

export default nextConfig;
