import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/admin', '/api/', '/dashboard/settings', '/dashboard/profile'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: ['/'],
        crawlDelay: 0,
      },
      {
        userAgent: 'DuckDuckBot',
        allow: ['/'],
      },
      {
        userAgent: 'YandexBot',
        allow: ['/'],
      },
      {
        userAgent: 'Baiduspider',
        allow: ['/'],
        crawlDelay: 1,
      },
    ],
    sitemap: 'https://mozosubz.xyz/sitemap.xml',
    host: 'https://mozosubz.xyz',
  }
}
