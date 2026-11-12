/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.nextgenuk.online',
          },
        ],
        destination: 'https://nextgenuk.online/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/articles/:id/:file(.*\\.pdf)',
        destination: '/api/articles/:id/pdf',
      },
    ];
  },
};

export default nextConfig;
