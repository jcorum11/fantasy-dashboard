/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@tremor/react"],
  images: {
    domains: ["images.unsplash.com"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
