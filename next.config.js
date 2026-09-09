/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable source maps in development
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = "eval-source-map";
    }
    return config;
  },
};

module.exports = nextConfig;
