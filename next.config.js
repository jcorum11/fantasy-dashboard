/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@tremor/react"],
  images: {
    domains: ["images.unsplash.com"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Enable source maps in development
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = "eval-source-map";
    }
    return config;
  },
};

module.exports = nextConfig;
