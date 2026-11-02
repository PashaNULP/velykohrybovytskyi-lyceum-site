import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const status = z.enum(['draft', 'review', 'published'], {
  error: 'Статус має бути draft, review або published.',
});

const optionalDate = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.coerce.date({ error: 'Дата має бути коректною.' }).optional(),
);

const optionalAcademicYear = z.preprocess(
  (value) => value === '' || value === null ? undefined : value,
  z.string().regex(/^\d{4}–\d{4}$/, 'Навчальний рік має мати формат 2026–2027.').optional(),
);

const slug = z
  .string({ error: 'Додайте унікальний slug.' })
  .min(3, 'Slug має містити щонайменше 3 символи.')
  .max(100, 'Slug задовгий: максимум 100 символів.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug має містити лише малі латинські літери, цифри й дефіси.');

const mediaPath = z
  .string({ error: 'Додайте шлях до зображення.' })
  .min(1, 'Шлях до зображення не може бути порожнім.')
  .refine(
    (value) => value.startsWith('/') || /^https:\/\//.test(value),
    'Зображення повинно мати локальний шлях від / або повну HTTPS-адресу.',
  );

const photo = z.object({
  src: mediaPath,
  alt: z.string({ error: 'Додайте альтернативний опис фотографії.' }).min(5, 'Alt-текст має бути змістовним.'),
  caption: z.string().max(240, 'Підпис фотографії задовгий.').optional(),
});

const news = defineCollection({
  loader: glob({ base: './src/content/news', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string({ error: 'Додайте заголовок новини.' }).min(5).max(140),
    slug,
    publishedAt: z.coerce.date({ error: 'Додайте коректну дату публікації.' }),
    category: z.enum(['Події', 'Навчання', 'Спільнота', 'Досягнення'], {
      error: 'Оберіть одну з дозволених категорій новин.',
    }),
    summary: z.string({ error: 'Додайте короткий опис новини.' }).min(20).max(360),
    cover: photo,
    gallery: z.array(photo).max(30, 'Одна новина може містити максимум 30 фотографій.').default([]),
    status,
    featured: z.boolean().default(false),
    seoTitle: z.string().max(70, 'SEO-заголовок має містити не більше 70 символів.').optional(),
    seoDescription: z.string().max(170, 'SEO-опис має містити не більше 170 символів.').optional(),
  }),
});

const documents = defineCollection({
  loader: glob({ base: './src/content/documents', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string({ error: 'Додайте назву документа.' }).min(5).max(180),
    slug,
    category: z.enum(['Установчі документи', 'Освітній процес', 'Для батьків', 'Звіти'], {
      error: 'Оберіть одну з дозволених категорій документів.',
    }),
    documentDate: z.coerce.date({ error: 'Додайте коректну дату документа.' }),
    summary: z.string({ error: 'Додайте короткий опис документа.' }).min(10).max(360),
    pdf: z
      .string({ error: 'Додайте шлях до PDF.' })
      .regex(/^\/files\/[a-z0-9/_-]+\.pdf$/i, 'PDF повинен бути в /public/files і мати безпечну назву файла.')
      .refine(
        (value) => existsSync(join(process.cwd(), 'public', value.replace(/^\//, ''))),
        'PDF-файл не знайдено в каталозі public. Перевірте шлях або завантажте файл.',
      ),
    status,
    academicYear: optionalAcademicYear,
  }),
});

const announcements = defineCollection({
  loader: glob({ base: './src/content/announcements', pattern: '**/*.md' }),
  schema: z
    .object({
      title: z.string({ error: 'Додайте назву оголошення.' }).min(5).max(140),
      slug,
      publishedAt: z.coerce.date({ error: 'Додайте коректну дату публікації.' }),
      expiresAt: optionalDate,
      status,
      important: z.boolean().default(false),
    })
    .refine((data) => !data.expiresAt || data.expiresAt >= data.publishedAt, {
      message: 'Дата завершення актуальності не може бути раніше дати публікації.',
      path: ['expiresAt'],
    }),
});

const galleries = defineCollection({
  loader: glob({ base: './src/content/galleries', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string({ error: 'Додайте назву фотогалереї.' }).min(5).max(140),
    slug,
    date: z.coerce.date({ error: 'Додайте коректну дату галереї.' }),
    description: z.string({ error: 'Додайте опис галереї.' }).min(20).max(500),
    cover: photo,
    photos: z.array(photo).min(1, 'Додайте щонайменше одну фотографію.').max(60),
    status,
  }),
});

export const collections = { news, documents, announcements, galleries };
