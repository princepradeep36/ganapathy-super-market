import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/checkout', '/order/', '/orders'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
