/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimize images for slow networks
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  
  // Enable React strict mode for debugging
  reactStrictMode: true,
  
  // Optimize experimental features for performance
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      'lucide-react',
    ],
    optimizeCss: true,
  },

  // Minify and compress CSS/JS aggressively
  swcMinify: true,
  
  // Enable SWC-based transforms for better performance
  swcTracingOptions: {
    enabled: false,
  },
}

export default nextConfig


