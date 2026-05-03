/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8000'}/:path*`,
      },
    ]
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'github.com'],
  },
}

export default nextConfig
