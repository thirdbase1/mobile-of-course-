import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/login',
          '/register',
          '/services',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/admin',
          '/api/',
          '/dashboard',
          '/checkout',
          '/confirm-email',
          '/forgot-password',
          '/reset-password',
          '/register-success',
          '/*.json$',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/about',
          '/login',
          '/register',
          '/services',
          '/privacy',
          '/terms',
        ],
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/about',
          '/login',
          '/register',
          '/services',
          '/privacy',
          '/terms',
        ],
        crawlDelay: 0,
      },
      {
        userAgent: 'DuckDuckBot',
        allow: [
          '/',
          '/about',
          '/login',
          '/register',
          '/services',
          '/privacy',
          '/terms',
        ],
      },
      {
        userAgent: 'YandexBot',
        allow: [
          '/',
          '/about',
          '/login',
          '/register',
          '/services',
          '/privacy',
          '/terms',
        ],
      },
      {
        userAgent: 'Baiduspider',
        allow: [
          '/',
          '/about',
          '/login',
          '/register',
          '/services',
          '/privacy',
          '/terms',
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: 'https://www.mozosubz.xyz/sitemap.xml',
    host: 'https://www.mozosubz.xyz',
  }
}
