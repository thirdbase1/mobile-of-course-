/** @type {import('next').NextConfig} */
const BACKEND = 'https://8zgnjk.wormhole.bar'

const nextConfig = {
  experimental: {
    allowedHosts: ['all'],
  },
  async rewrites() {
    return [
      {
        source:      '/api/backend/:path*',
        destination: `${BACKEND}/:path*`,
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/backend/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
export default nextConfig
