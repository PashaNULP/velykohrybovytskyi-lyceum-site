import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production';
const env = loadEnv(mode, process.cwd(), '');
const siteUrl = process.env.SITE_URL || process.env.CF_PAGES_URL || env.SITE_URL || env.CF_PAGES_URL || 'http://localhost:4321';

export default defineConfig({
  site: siteUrl,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
});
