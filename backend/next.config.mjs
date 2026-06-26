/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: '/:path*',
          destination: '/index.html',
        },
      ],
    };
  },
};

export default nextConfig;
