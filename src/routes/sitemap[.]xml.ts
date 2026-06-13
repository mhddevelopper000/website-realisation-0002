import { createFileRoute } from '@tanstack/react-router';
import type {} from '@tanstack/react-start';

// TODO: set BASE_URL to the production custom domain once configured.
const BASE_URL = '';

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const entries: SitemapEntry[] = [
          { path: '/', changefreq: 'weekly', priority: '1.0' },
          { path: '/contact', changefreq: 'monthly', priority: '0.6' },
        ];

        const { data: products } = await supabaseAdmin
          .from('products')
          .select('slug, updated_at')
          .eq('is_active', true);
        for (const p of products ?? []) {
          entries.push({
            path: `/produits/${p.slug}`,
            lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
            changefreq: 'weekly',
            priority: '0.8',
          });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join('\n'),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join('\n');

        return new Response(xml, {
          headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
        });
      },
    },
  },
});
