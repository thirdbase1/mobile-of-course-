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
    sitemap: 'https://mozosubz.xyz/sitemap.xml',
    host: 'https://mozosubz.xyz',
  }
}
