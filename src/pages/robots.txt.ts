import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const isPublicProduction = import.meta.env.PUBLIC_SITE_ENV === 'production';
  const body = isPublicProduction
    ? `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap-index.xml', site)}\n`
    : 'User-agent: *\nDisallow: /\n';

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
