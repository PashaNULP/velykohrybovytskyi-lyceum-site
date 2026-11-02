/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_ENV?: 'preview' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
