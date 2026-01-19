/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/corporate/:path*',
        destination: `${process.env.NEXT_PUBLIC_CORPORATE_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;